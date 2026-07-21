# Writing HTML Views for PrismaUI_F4

## The Runtime

Views are rendered by **CEF** (Chromium Embedded Framework, currently CEF 147) - a real, current
Chromium build. The "What Does NOT Work" table below predates the CEF backend and has not been
re-verified feature-by-feature against it - treat every row as "unconfirmed" rather than "confirmed
missing," and test directly rather than trusting the list as-is. Standard Chromium features
(`IntersectionObserver`, `ResizeObserver`, `WebGL`, `WebSockets`, etc.) generally work.

When something doesn't work, check this document before assuming your HTML is wrong.

---

## File Location

| Source (edit here) | Deployed location | MO2 virtual path |
|---|---|---|
| `YourPlugin/assets/views/page.html` | `mods/YourPlugin/PrismaUI_F4/views/page.html` | `Data/PrismaUI_F4/views/page.html` |

The framework loads views via `file:///` URIs resolved relative to `Data/PrismaUI_F4/views/`. Filenames must be unique across all PrismaUI plugins. You can reference images or other assets by relative path from the views folder.

**Never edit files under `mods/` directly.** Always edit the source and redeploy with `Copy-Item`.

---

## JavaScript Support

### What Works

- **ES2020+**: `const`, `let`, arrow functions, template literals, destructuring, `async/await`, Promises, `class`, optional chaining (`?.`), nullish coalescing (`??`)
- **DOM API**: Full access to `document`, `window`, `Element`, event listeners, `setTimeout`/`setInterval`, `requestAnimationFrame`
- **Fetch API**: Available for `file://` resources. Not useful for network requests (game process has no internet access by design).
- **CSS**: Flexbox, Grid, CSS variables (`--var`), animations (`@keyframes`), transitions, `calc()`, `backdrop-filter`, `clip-path`
- **Web Storage**: `localStorage` and `sessionStorage` are available but data is scoped to the view's URL. Not persistent across game launches.
- **JSON**: `JSON.parse` / `JSON.stringify` work normally.
- **Canvas**: 2D canvas API available.
- **SVG**: Inline SVG in HTML renders correctly.

### What Does NOT Work

| API | Status | Workaround |
|-----|--------|-----------|
| `IntersectionObserver` | Not implemented | Guard with `typeof IntersectionObserver !== 'undefined'` |
| `ResizeObserver` | Not implemented | Use fixed layout or window resize events |
| `WebGL` / `WebGPU` | Not available | Use D3D11 from C++ side |
| `Worker` / `SharedWorker` | Not available | Keep processing on main JS thread |
| `IndexedDB` | Not available | Use `localStorage` or pass data from C++ |
| `WebSockets` / `XMLHttpRequest` to HTTP | No network | All data comes from C++ via `InteropCall`/`Invoke` |
| `dbg()` | Not a thing | Use `console.log()` only |
| `alert()` / `confirm()` / `prompt()` | Not implemented | Build your own modal in HTML |
| CSS `@import` | May not resolve | Inline all CSS in `<style>` tags |
| External fonts via `@font-face url(http...)` | No network | Use system fonts or embed font as base64 |

### Always Guard Optional APIs

```javascript
// WRONG - will throw ReferenceError and abort the entire script
var observer = new IntersectionObserver(callback);

// CORRECT
var observer;
if (typeof IntersectionObserver !== 'undefined') {
  observer = new IntersectionObserver(callback);
} else {
  observer = { observe: function() {}, unobserve: function() {} };
  console.log('IntersectionObserver not available');
}
```

A `ReferenceError` at script load time aborts the rest of your JS. Always test features before using them.

---

## JavaScript Console Logging

**Use `console.log()` - never `dbg()`, `print()`, or custom globals.**

```javascript
console.log('info message');    // appears in C++ log as [JS LOG]
console.warn('warning');        // appears as [JS WARN]
console.error('error');         // appears as [JS ERR]
```

These only appear in your F4SE log if you registered a `ConsoleMessageCallback` from C++. See the [API Reference](api-reference.md#registerconsolecallback).

---

## The JS ↔ C++ Bridge

### C++ → JS: Push data to the page

Use `InteropCall` for named function calls (best performance):

```cpp
// C++
api->InteropCall(view, "onPlayerData", R"({"hp":210,"ap":75,"name":"Sole Survivor"})");
```

```javascript
// JS
function onPlayerData(json) {
  var data = JSON.parse(json);
  document.getElementById('hp').textContent = data.hp;
}
```

Use `Invoke` for arbitrary expressions:

```cpp
// C++
std::string script = "document.title = '" + escapedTitle + "'";
api->Invoke(view, script.c_str());
```

### JS → C++: Events from the page to the plugin

Register a listener from C++ (do this inside your `OnDomReady` callback):

> **Threading:** `JSListenerCallback` is dispatched onto the **main game thread** - the framework
> wraps every `RegisterJSListener` callback in its own `F4SE::GetTaskInterface()->AddTask` before
> your code runs, so `RE::*` access inside a listener is safe without you dispatching manually. See
> [api-reference.md - Threading Warning](api-reference.md#threading-warning-js-listener-callbacks)
> for the full explanation.

```cpp
// C++
api->RegisterJSListener(view, "requestClose", [](const char* /*arg*/) {
    api->Unfocus(view);
    api->Hide(view);
});

api->RegisterJSListener(view, "onSettingChanged", [](const char* json) {
    // RE:: access is safe directly here, no dispatch needed
    logger::info("Setting changed: {}", json ? json : "");
});
```

```javascript
// JS - these are now global functions on window
document.getElementById('closeBtn').addEventListener('click', function() {
  requestClose();
});

document.getElementById('volumeSlider').addEventListener('input', function() {
  onSettingChanged(JSON.stringify({ key: 'volume', value: this.value }));
});
```

### Passing Complex Data

Always use JSON strings for structured data crossing the C++/JS boundary. Both sides parse and produce JSON:

```cpp
// C++ - build JSON and push it
nlohmann::json j;
j["items"] = nlohmann::json::array();
for (auto& item : inventory) {
    j["items"].push_back({ {"name", item.name}, {"count", item.count} });
}
api->InteropCall(view, "loadInventory", j.dump().c_str());
```

```javascript
// JS - receive and render
function loadInventory(jsonStr) {
  var data = JSON.parse(jsonStr);
  data.items.forEach(function(item) {
    // build DOM nodes...
  });
}
```

---

## Viewport and Layout

Views are always the full screen size. `100vw` and `100vh` equal the game's render resolution. Design your UI to work at 1920×1080 and test at 2560×1440 if possible. Use `min-width`, `max-width`, and centered containers rather than fixed pixel positions.

```css
/* Good - centered container, responsive width */
.panel {
  width: min(600px, 90vw);
  margin: 0 auto;
}

/* Risky - will look wrong at 4K */
.panel {
  left: 660px;
  width: 600px;
}
```

---

## Closing the View from JS

The standard pattern is to register a listener and call it:

```javascript
// JS
function closeMyMenu() {
  requestClose(); // listener registered from C++
}
```

Alternatively you can call a JS function that the C++ side reads back via `Invoke` with a callback, but the listener pattern is simpler and lower latency.

---

## Transparency and Backgrounds

The view composites over the 3D game using alpha blending. `background:transparent` on `body` will show the game world through your page. You can create floating panels with semi-transparent backgrounds:

```css
body {
  background: transparent;
}
.panel {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px); /* blurs game world behind panel */
}
```

If you want to block mouse clicks from reaching the game (e.g., a full-screen overlay), set `pointer-events: auto` on a full-screen element. The focus system handles this at the engine level - when focused, all mouse events go to the view regardless.

---

## Fonts

System fonts available in the game process: `Courier New`, `Arial`, `Segoe UI`, `Consolas`. For a terminal/retro look, `Courier New` or `Consolas` are reliable. You can embed a font as base64 in a `@font-face` rule if needed, but avoid loading fonts from external URLs.

---

## Performance Guidelines

- **Avoid `document.querySelectorAll` in tight loops.** Cache element references.
- **Batch DOM updates** - build HTML strings and set `innerHTML` once rather than appending many nodes individually.
- **`requestAnimationFrame`** is available and works correctly for smooth animations.
- **Heavy JS work** (sorting large arrays, string manipulation) is fine. CEF's renderer runs in its own dedicated process and won't block the game's render thread.
- **Avoid creating and destroying many DOM nodes repeatedly.** Reuse and update existing nodes.

---

## Debugging

Register a `ConsoleMessageCallback` from C++ to see all `console.*` output in your F4SE log. This is the primary debugging tool.

For DOM inspection, use the inspector:

```cpp
// C++ - create and show inspector (development only, never ship this)
api->CreateInspectorView(view);
api->SetInspectorBounds(view, 10.0f, 10.0f, 900, 600);
api->SetInspectorVisibility(view, true);
```

The inspector is the full Chrome DevTools. You can inspect the DOM, run JS in the console, check computed styles, and see network requests (all file://).

---

## Template: Minimal Full-Screen Menu

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:100vw; height:100vh;
    background:transparent;
    font-family:'Courier New',monospace;
    display:flex; align-items:center; justify-content:center;
  }
  .panel {
    background:rgba(8,8,6,0.92);
    border:1px solid #3d3208;
    padding:32px 40px;
    color:#f59e0b;
    min-width:400px;
  }
</style>
</head>
<body>
<div class="panel">
  <h1 id="title">MENU</h1>
</div>
<script>
  // Data pushed from C++ via InteropCall
  function setTitle(text) {
    document.getElementById('title').textContent = text;
  }
  console.log('page ready');
</script>
</body>
</html>
```

---

## Build and Deployment Automation

The framework root's own `build-and-deploy.bat` is stale (it predates the CEF cutover and looks for
an Ultralight SDK setup step that no longer applies) - build the framework manually per the steps in
the main [README](../README.md#building-the-framework).

The **example plugin** has its own working `build-and-deploy.bat` under `example-f4se-plugin/`; see
the [README](../README.md#building-the-example-plugin) for how to run it.
