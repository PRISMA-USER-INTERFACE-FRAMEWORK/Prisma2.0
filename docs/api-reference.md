# API Reference - PrismaUI_F4

Every method has its own detailed page under [`api/`](api/) - signature, parameters, return value,
threading, gotchas, and an example where one adds value. This page is the index and the
cross-cutting concepts that apply to more than one method.

Using an AI assistant? [`prisma-mcp`](../mcp-server/) gives it live tools that cover this entire
page - looking up any method, searching by keyword, and reading the current header - so it doesn't
have to rely on you pasting these docs in manually.

## Overview

The public API is declared entirely in `PrismaUI_F4_API.h`. Copy that single header into your
plugin's `src/` folder. You do not link against PrismaUI_F4 at compile time; the connection is made
at runtime via `GetProcAddress`.

```cpp
#include "PrismaUI_F4_API.h"

// On kGameDataReady:
auto* api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI9>();
```

---

## Types

### `PrismaView`

```cpp
typedef uint64_t PrismaView;
```

An opaque handle that identifies one HTML view. The value `0` means "no view" / invalid. Always
check [`IsValid`](api/IsValid.md) before using a handle you haven't used recently, particularly
after a game reload.

### `ConsoleMessageLevel`

```cpp
enum class ConsoleMessageLevel : uint8_t {
    Log = 0,
    Warning,
    Error,
    Debug,
    Info
};
```

Passed to `ConsoleMessageCallback`. Maps directly to the JavaScript `console.*` level.

### Callback types

```cpp
// Called once when the HTML document's DOM is fully parsed and ready.
typedef void (*OnDomReadyCallback)(PrismaView view);

// Called with the string result of a JS expression evaluated via Invoke().
typedef void (*JSCallback)(const char* result);

// Called when JS code calls the registered listener function on window.
typedef void (*JSListenerCallback)(const char* argument);

// Called for every console.log/warn/error line from JS.
typedef void (*ConsoleMessageCallback)(
    PrismaView view,
    ConsoleMessageLevel level,
    const char* message
);
```

**Threading:** `OnDomReadyCallback` and `JSListenerCallback` are both invoked on the main game
thread. See [Threading](#threading) below.

---

## Interface versions

| Type | Adds |
|------|------|
| [`IVPrismaUI1`](#ivprismaui1) | All core view operations |
| [`IVPrismaUI2`](#ivprismaui2) | [`RegisterConsoleCallback`](api/RegisterConsoleCallback.md) |
| [`IVPrismaUI3`](#ivprismaui3) | [`RegisterTranslations`](api/RegisterTranslations.md) |
| [`IVPrismaUI4`](#ivprismaui4) | [`BindUIEvent`](api/BindUIEvent.md) (game-thread JS listener), [`EnumerateViews`](api/EnumerateViews.md) |
| [`IVPrismaUI5`](#ivprismaui5) | [`GetViewSRV`](api/GetViewSRV.md), [`SetViewOffscreen`](api/SetViewOffscreen.md), [`BindViewToGeometry`](api/BindViewToGeometry.md), [`BindViewToScreenTexture`](api/BindViewToScreenTexture.md), [`UnbindViewFromGeometry`](api/UnbindViewFromGeometry.md) (on-mesh rendering) |
| [`IVPrismaUI6`](#ivprismaui6) | [`SuppressHUDWidget`](api/SuppressHUDWidget.md), [`SuppressVanillaMenu`](api/SuppressVanillaMenu.md), [`CloseVanillaMenu`](api/CloseVanillaMenu.md) |
| [`IVPrismaUI7`](#ivprismaui7) | [`SuppressVanillaMenuIf`](api/SuppressVanillaMenuIf.md), [`EnableActivateChoiceFilter`](api/EnableActivateChoiceFilter.md), [`SuppressActivateChoicePerk`](api/SuppressActivateChoicePerk.md) |
| [`IVPrismaUI8`](#ivprismaui8) | [`EnumerateViewsEx`](api/EnumerateViewsEx.md) (owner-tagged), [`GetActivateChoiceLabel`](api/GetActivateChoiceLabel.md), [`TriggerActivateChoice`](api/TriggerActivateChoice.md), [`GetViewHealth`](api/GetViewHealth.md), [`SetViewOffscreenSize`](api/SetViewOffscreenSize.md) |
| [`IVPrismaUI9`](#ivprismaui9) | Controller/keyboard button-prompt API - [`IsUsingGamepad`](api/IsUsingGamepad.md), [`GetControllerStyle`](api/GetControllerStyle.md)/[`SetControllerStyle`](api/SetControllerStyle.md), [`NoteInputDevice`](api/NoteInputDevice.md), [`GetButtonPrompt`](api/GetButtonPrompt.md), [`GetGamepadButtonName`](api/GetGamepadButtonName.md). Also [`SetViewOwnsEscape`](api/SetViewOwnsEscape.md) and [`SetViewOffscreenBackground`](api/SetViewOffscreenBackground.md) - see the compatibility note below. |

Always request the highest version you need. If the installed PrismaUI_F4 is older than your
requested version, `RequestPluginAPI` returns `nullptr` - handle this gracefully.

> **Compatibility note on `IVPrismaUI9` specifically:** `SetViewOwnsEscape` and
> `SetViewOffscreenBackground` were added to this interface after V9 first shipped, rather than as a
> new `IVPrismaUI10`. The nullptr-on-mismatch guarantee above holds at whole-version granularity,
> not for methods added within an already-released version - if your plugin is compiled against a
> header that includes these two methods but the player has an older `PrismaUI_F4.dll` that predates
> them, calling either one is undefined behavior (the vtable slot doesn't exist on the older build),
> not a clean failure. If you use either method, document that your plugin requires a current
> `PrismaUI_F4.dll` build.

```cpp
auto* api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI9>();
if (!api) {
    logger::error("PrismaUI V9 not available - update PrismaUI_F4");
    return;
}
```

---

## `RequestPluginAPI`

```cpp
template <typename T>
[[nodiscard]] inline T* RequestPluginAPI();
```

Locates `PrismaUI_F4.dll` in the current process via `GetModuleHandleW`, calls its exported
`RequestPluginAPI` function, and casts the result. Returns `nullptr` if:
- PrismaUI_F4 is not loaded
- The loaded version does not support the requested interface

**Call timing:** During or after `F4SE::MessagingInterface::kGameDataReady`. Do not call during
`F4SEPlugin_Load` or `F4SEPlugin_Query`; F4SE may not have loaded PrismaUI_F4 yet.

---

## Threading

`JSListenerCallback` functions registered via `RegisterJSListener`, and `BindUIEvent` callbacks,
both run on the **main game thread**, not the CEF render thread - the framework wraps every one of
them in its own `F4SE::GetTaskInterface()->AddTask(...)` before your code ever runs.

`RE::*` singleton access, `InteropCall`/`Invoke` calls, and any other game-thread work are safe to
do directly inside either kind of callback - no manual `AddTask` needed.

```cpp
api->RegisterJSListener(view, "requestGameData", [](const char* s) {
    auto* player = RE::PlayerCharacter::GetSingleton();   // safe directly here
});
```

Prefer `BindUIEvent` (V4) for new code when you want the game-thread guarantee to be part of the
API's actual contract - but existing `RegisterJSListener` code already gets the same guarantee and
does not need to change.

---

## IVPrismaUI1

- [`CreateView`](api/CreateView.md)
- [`Invoke`](api/Invoke.md)
- [`InteropCall`](api/InteropCall.md)
- [`RegisterJSListener`](api/RegisterJSListener.md)
- [`HasFocus`](api/HasFocus.md)
- [`Focus`](api/Focus.md)
- [`Unfocus`](api/Unfocus.md)
- [`Show`](api/Show.md)
- [`Hide`](api/Hide.md)
- [`IsHidden`](api/IsHidden.md)
- [`GetScrollingPixelSize`](api/GetScrollingPixelSize.md)
- [`SetScrollingPixelSize`](api/SetScrollingPixelSize.md)
- [`IsValid`](api/IsValid.md)
- [`Destroy`](api/Destroy.md)
- [`SetOrder`](api/SetOrder.md)
- [`GetOrder`](api/GetOrder.md)
- [`CreateInspectorView`](api/CreateInspectorView.md)
- [`SetInspectorVisibility`](api/SetInspectorVisibility.md)
- [`IsInspectorVisible`](api/IsInspectorVisible.md)
- [`SetInspectorBounds`](api/SetInspectorBounds.md)
- [`HasAnyActiveFocus`](api/HasAnyActiveFocus.md)

## IVPrismaUI2

Extends `IVPrismaUI1`.

- [`RegisterConsoleCallback`](api/RegisterConsoleCallback.md)

## IVPrismaUI3

Extends `IVPrismaUI2`.

- [`RegisterTranslations`](api/RegisterTranslations.md)

## IVPrismaUI4

Extends `IVPrismaUI3`.

- [`BindUIEvent`](api/BindUIEvent.md)
- [`EnumerateViews`](api/EnumerateViews.md)

## IVPrismaUI5

Extends `IVPrismaUI4`. On-mesh rendering: bind a view's live texture onto in-world geometry.

- [`GetViewSRV`](api/GetViewSRV.md)
- [`SetViewOffscreen`](api/SetViewOffscreen.md)
- [`BindViewToGeometry`](api/BindViewToGeometry.md)
- [`BindViewToScreenTexture`](api/BindViewToScreenTexture.md)
- [`UnbindViewFromGeometry`](api/UnbindViewFromGeometry.md)

## IVPrismaUI6

Extends `IVPrismaUI5`. Vanilla UI suppression.

- [`SuppressHUDWidget`](api/SuppressHUDWidget.md)
- [`SuppressVanillaMenu`](api/SuppressVanillaMenu.md)
- [`CloseVanillaMenu`](api/CloseVanillaMenu.md)

## IVPrismaUI7

Extends `IVPrismaUI6`. Conditional menu suppression, and the vanilla multi-activate choice filter.

- [`SuppressVanillaMenuIf`](api/SuppressVanillaMenuIf.md)
- [`EnableActivateChoiceFilter`](api/EnableActivateChoiceFilter.md)
- [`SuppressActivateChoicePerk`](api/SuppressActivateChoicePerk.md)

## IVPrismaUI8

Extends `IVPrismaUI7`.

- [`EnumerateViewsEx`](api/EnumerateViewsEx.md)
- [`GetActivateChoiceLabel`](api/GetActivateChoiceLabel.md)
- [`TriggerActivateChoice`](api/TriggerActivateChoice.md)
- [`GetViewHealth`](api/GetViewHealth.md)
- [`SetViewOffscreenSize`](api/SetViewOffscreenSize.md)

## IVPrismaUI9

Extends `IVPrismaUI8`. Controller/keyboard button-prompt API, so every Prisma plugin gets
device-aware button prompts for free, without re-implementing gamepad/keyboard tracking per plugin.

The framework tracks whether the player is currently on keyboard/mouse or gamepad, and turns "which
button is `Activate`?" into a prompt token you hand to a shared shell-side renderer that draws real
button art, styled Xbox or PlayStation. Fallout 4 reads every pad as XInput (Xbox) natively -
PlayStation is purely a display re-style of the same canonical button, not different engine
behavior.

- [`IsUsingGamepad`](api/IsUsingGamepad.md)
- [`GetControllerStyle`](api/GetControllerStyle.md) / [`SetControllerStyle`](api/SetControllerStyle.md)
- [`NoteInputDevice`](api/NoteInputDevice.md)
- [`GetButtonPrompt`](api/GetButtonPrompt.md)
- [`GetGamepadButtonName`](api/GetGamepadButtonName.md)
- [`SetViewOwnsEscape`](api/SetViewOwnsEscape.md)
- [`SetViewOffscreenBackground`](api/SetViewOffscreenBackground.md)

### Known limitation

`SuppressHUDWidget` and `EnableActivateChoiceFilter` (V6/V7) only work on Old-Gen (1.10.163) right
now. The vtable addresses they hook are hardcoded and haven't been mapped for Next-Gen/AE yet, so
on those runtimes both calls just log a warning and do nothing instead of patching a guessed
address.

---

## Typical call sequence

```
F4SEPlugin_Load:
  F4SE::Init(a_f4se)
  messaging->RegisterListener(F4SEMessageHandler)

kGameDataReady:
  RequestPluginAPI<IVPrismaUI9>()     -> g_api
  [register key handler / event sink]

kPostLoadGame / kNewGame:
  g_api->CreateView("page.html", OnDomReady)   -> g_view
  g_api->RegisterConsoleCallback(g_view, ...)
  g_api->RegisterTranslations(g_view, "MyPlugin_F4")

OnDomReady (main game thread):
  g_api->RegisterJSListener(g_view, "fnName", callback)
  g_api->Invoke(g_view, "init()")

Toggle (key / event):
  if opening:
    g_api->Show(g_view)
    g_api->Focus(g_view, pauseGame, disableFocusMenu)
  if closing:
    g_api->Unfocus(g_view)
    g_api->Hide(g_view)

JSListenerCallback (main game thread - RE:: access is safe directly here):
  g_api->InteropCall(g_view, "result", data.c_str());
```

---

## Papyrus Bridge API (window.prisma)

### Overview

`window.prisma` is automatically injected by PrismaUI_F4 into every HTML view. It provides
read-only and write access to Papyrus globals and script properties without requiring C++ code in
your plugin.

**Available methods:**
- `await prisma.getGlobal(esp, formId)` - Read a `TESGlobal` form value
- `await prisma.getProperty(esp, formId, scriptName, propertyName)` - Read an `Auto` property from a
  Papyrus script
- `await prisma.setGlobal(esp, formId, value)` - Write a `TESGlobal` float value
- `await prisma.setProperty(esp, formId, scriptName, propertyName, value)` - Write a float, int, or
  bool property to the script instance attached to the form

In every method, `formId` is parsed as **hexadecimal**, and is the local form ID only - do not
include the 2-digit plugin/file-index byte. A form at `0x00801234` in your plugin is passed as
`"801234"` (or `"1234"` with leading zeros trimmed), not the full load-order-relative form ID.

### Under the hood

Writing to properties looks up the active script instance(s) attached to the form's handle in the
Papyrus VM, finds the backing variable by name, and updates it directly on the game thread.

### Callbacks/events limitation

Updating a property variable directly from F4SE/C++ does not run any Papyrus VM instructions (such
as a custom property `Set()` block in Papyrus), so the Papyrus script is not automatically notified
of the change unless it polls the property value, or another event is triggered. For workflows that
require immediate script execution when a setting changes, write to a global or property and have
the Papyrus script poll it periodically (using `RegisterForSingleUpdate`), or use MCM actions.

### Return values

Both read methods return **Promises** and handle errors gracefully:
- Returns a `number` on success (including `0.0`, which is a valid result)
- Returns `null` if the form/plugin is not loaded, the form doesn't exist, or the script/property
  name doesn't match
- Never throws - always guard with `if (val === null)`

### Example

```javascript
// Read a global
const val = await prisma.getGlobal('MyMod.esp', '800');
if (val !== null) {
    console.log('Global value:', val);
} else {
    console.log('Form not found or plugin not loaded');
}

// Read a quest property (most reliable host for properties)
const propVal = await prisma.getProperty('MyMod.esp', '801', 'MyQuestScript', 'CurrentPhase');
if (propVal !== null && propVal !== undefined) {
    console.log('Quest phase:', propVal);
}
```

### Timing

`window.prisma` is available immediately - no wait needed. However, `getProperty` calls may return
`null` if the Papyrus VM is not yet ready (e.g. if called before `kPostLoadGame`). For best results,
call property reads after the game has finished loading.
