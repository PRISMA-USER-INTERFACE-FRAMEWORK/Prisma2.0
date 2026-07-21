# View Lifecycle

## States

A PrismaUI view moves through these states:

```
[not created]
     │
     │  CreateView("page.html", onDomReady)
     ▼
[loading]          ← CEF is fetching and parsing the HTML
     │
     │  DOM parsed and JS executed → onDomReady fires on game thread
     ▼
[ready + hidden]   ← default state after creation
     │
     │  Show()
     ▼
[visible + no focus]  ← rendered on screen, game input unchanged
     │
     │  Focus(view, pauseGame, disableFocusMenu)
     ▼
[visible + focused]   ← mouse/keyboard routed to HTML, cursor active
     │
     │  Unfocus()
     ▼
[visible + no focus]
     │
     │  Hide()
     ▼
[ready + hidden]
     │
     │  Destroy()  (optional - rarely needed)
     ▼
[destroyed]
```

---

## Creation

```cpp
PrismaView view = api->CreateView("page.html", OnDomReady);
// View starts hidden - no Hide() call needed, but explicit is fine:
// api->Hide(view);
```

`CreateView` is asynchronous - the HTML file is loaded via CEF's own render process. Your `OnDomReady` callback fires on the **main game thread** (via `F4SE::GetTaskInterface()->AddTask`) after the DOM is parsed and all inline `<script>` blocks have executed.

**Do not call `Invoke` or `RegisterJSListener` before `OnDomReady` fires.** The JS context is not yet ready.

**Create views on `kPostLoadGame` / `kNewGame`**, not on `kGameDataReady`:

```cpp
case F4SE::MessagingInterface::kPostLoadGame:
case F4SE::MessagingInterface::kNewGame:
    if (g_view == 0 && g_api) {
        g_view = g_api->CreateView("page.html", OnDomReady);
        g_api->RegisterConsoleCallback(g_view, consoleCallback);
        g_api->RegisterTranslations(g_view, "MyPlugin_F4");
    }
    break;
```

Guard with `g_view == 0` to avoid creating duplicates on multiple load events.

---

## DOM Ready Callback

```cpp
static void OnDomReady(PrismaView view)
{
    // Fires on the main game thread - safe for RE:: access and JS calls
    g_api->RegisterJSListener(view, "onClose", OnClose);
    g_api->RegisterJSListener(view, "onDataRequest", OnDataRequest);
    g_api->Invoke(view, "init()");
    logger::info("DOM ready for view {}", view);
}
```

The callback receives the view handle so one function can serve multiple views.

---

## JS Listener Threading

`RegisterJSListener` callbacks are dispatched onto the game thread by the framework itself (it
wraps every callback in `F4SE::GetTaskInterface()->AddTask(...)` before it ever reaches your code) -
the same guarantee `BindUIEvent` (V4) makes. You do not need to dispatch manually. `RE::*` singleton
access, `InteropCall`/`Invoke` calls, and any other game-thread work are all safe to do directly
inside a `RegisterJSListener` callback - no manual `AddTask` needed (though a redundant one is
harmless if you have existing code that does it).

```cpp
g_api->RegisterJSListener(view, "queryPlayer", [](const char* s) {
    // Safe directly here - already running on the game thread.
    auto* player = RE::PlayerCharacter::GetSingleton();
    std::string result = std::to_string((int)player->GetActorValue(RE::ActorValue::kHealth));
    g_api->InteropCall(g_view, "onPlayerHP", result.c_str());
});
```

`OnDomReadyCallback` and `JSCallback` (from `Invoke`) are also delivered on the game thread.

`BindUIEvent` (V4) remains the preferred API for new code when you specifically need game-thread
delivery guaranteed by contract - `RegisterJSListener`'s current behavior is an implementation
detail of the CEF backend, not a signature-level promise the way `BindUIEvent`'s is.

---

## Show / Hide

`Show` and `Hide` control compositing - whether the view's pixels are included in the D3D11 Present call. They are not the same as `Focus`/`Unfocus`.

| Operation | What it does |
|-----------|-------------|
| `Show` | View is rendered on screen |
| `Hide` | View is invisible but JS keeps running |
| `Focus` | Input (mouse + keyboard) goes to the view |
| `Unfocus` | Input returns to game |

Typical toggle pattern:

```cpp
static void Toggle()
{
    if (!g_api || !g_api->IsValid(g_view)) return;
    g_visible = !g_visible;
    if (g_visible) {
        g_api->Show(g_view);
        g_api->Focus(g_view, /*pauseGame=*/true, /*disableFocusMenu=*/false);
    } else {
        g_api->Unfocus(g_view);
        g_api->Hide(g_view);
    }
}
```

---

## Focus

### `pauseGame`

When `true`, the game's time scale is set to zero - NPCs stop moving, timers pause. Restored automatically on `Unfocus`. Use for menus that require exclusive player attention (inventory, settings, terminal).

When `false`, the game continues running while the UI is open. Use for overlays or menus opened from existing paused contexts (e.g. opening a sub-panel while PauseMenu is already open).

### `disableFocusMenu`

Controls whether PrismaUI's Scaleform FocusMenu overlay is shown:

**`false` (default):** The FocusMenu overlay is active. It manages the game cursor and intercepts ESC to unfocus the view. Use this for standalone menus opened directly from gameplay - the overlay handles cursor visibility and ESC for you.

**`true`:** The FocusMenu overlay is suppressed. Keyboard events reach the HTML `keydown` handler directly. The game's existing cursor (if any) remains active. Use this when your view opens on top of an existing game menu that already shows a cursor - for example, a panel opened while PauseMenu is open. In this case your JS must handle ESC:

```javascript
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        e.preventDefault();
        myCloseFunction(); // call your C++ listener to unfocus/hide
    }
});
```

### `HasAnyActiveFocus`

```cpp
if (api->HasAnyActiveFocus()) {
    // Suppress game hotkeys while any PrismaUI menu is open
    return;
}
```

---

## Multiple Views

Each `CreateView` call produces an independent view with its own CEF browser instance, D3D11 textures, and JS environment. Views do not share state.

**Ordering:** Views are composited in ascending `order` value. Default is 0:

```cpp
api->SetOrder(backgroundView, 0);
api->SetOrder(popupView, 10);
```

**Focus:** Only one view can have focus at a time. Calling `Focus` on a second view while the first is focused automatically unfocuses the first.

**Performance:** Each active view costs GPU texture memory and CEF rendering time. Keep views hidden when not in use - rendering is skipped for hidden views.

---

## View Recovery

There is no automatic crash-recovery mechanism for a misbehaving view under the current CEF-based
framework. If a view behaves strangely, it will not self-heal - destroy and recreate it yourself.

---

## Inspector

DevTools opens in your **external** browser, not as an in-game overlay - `SetInspectorBounds`'s
position/size parameters have no effect. DevTools requires `[DevTools] bEnabled=1` in the
framework's own ini; otherwise `SetInspectorVisibility`/`SetInspectorBounds` warn and no-op.

```cpp
// Setup (development only - do not ship). Requires [DevTools] bEnabled=1 in the framework ini.
api->CreateInspectorView(view);
// SetInspectorBounds still exists for API compatibility but is a no-op under CEF - DevTools opens
// in your external browser instead of an in-game overlay. Safe to call, has no effect.
api->SetInspectorBounds(view, 0.0f, 0.0f, 900, 550);

// Toggle - opens/targets the DevTools target list in your external browser, not an in-game overlay
bool showing = api->IsInspectorVisible(view);
api->SetInspectorVisibility(view, !showing);
```

---

## Destruction

`Destroy` fully tears down a view. After calling it, the handle is invalid.

```cpp
api->Unfocus(view);
api->Hide(view);
api->Destroy(view);
view = 0;
```

In normal usage, never destroy views - create them once on `kPostLoadGame` and keep them for the session.

---

## Scroll

Mouse wheel events are forwarded to the focused view. Scroll amount is tunable per view:

```cpp
api->SetScrollingPixelSize(view, 40);  // default is 28 px per tick
```

---

## Example Plugin Reference

The **PrismaUI-F4-Example** plugin demonstrates all of these patterns in a working plugin with four tabs:

1. **Papyrus Bridge** - Reading globals and quest properties without C++ code
2. **C++ Bridge** - Invoking JS from C++, and listening for JS callbacks
3. **Event Log** - Debugging and tracing all JS↔C++ communication
4. **Tutorial** - Comprehensive guide to all features

The example plugin is located at `example-f4se-plugin/` in this repo and demonstrates:
- DOM ready callback registration
- JS listener event handling
- Copy-to-clipboard integration from JS
- Performance-optimized HTML with semantic markup (no CSS frameworks)
- Proper error handling for null/undefined values
- Threading best practices for JS↔C++ communication

See the main [README](../README.md#building-the-example-plugin) for build instructions.
