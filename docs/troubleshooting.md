---
id: troubleshooting
title: Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 99
---

# Troubleshooting

Common failure modes, grouped by symptom. Most problems leave a clear trace in the log -- check it first before digging into code.

:::tip Check the log first
**`Documents\My Games\Fallout4\F4SE\PrismaUI_F4.log`**

Every API error, wrong path, and null return is logged there with a reason. Search for `[ERROR]` and `[WARN]` lines. If the symptom matches something below but the fix isn't obvious, the log will usually name the exact cause.
:::

---

## Nothing appears on screen

- **PrismaUI_F4.dll is not installed or not in the right place.** It must be in the `F4SE/plugins/` folder where F4SE can find it. If you use MO2, confirm the framework mod is enabled and above your plugin in the left pane. Check the log -- if the DLL never loaded, nothing else will work.

- **`RequestPluginAPI` returned null.** This means the framework DLL was not loaded yet when you called it. You must call `RequestPluginAPI<IVPrismaUI2>()` in the `kGameDataReady` handler, not in `F4SEPlugin_Load`. Calling it too early always returns null.

- **The HTML file is in the wrong location.** Files must live under `Data/PrismaUI_F4/views/`. The path you pass to `CreateView` must be relative to that root -- for example `"Interface/MyMod/ui.html"`, not an absolute path and not prefixed with `Data/`.

- **`Show()` was never called.** `CreateView` does not show the view. You must call `Show(view)` explicitly. If you call `Hide(view)` immediately after creating the view (a common pattern for pre-loading), make sure something later calls `Show(view)` again.

- **`Hide()` was called and never undone.** If you call `Hide(view)` in a listener or cleanup path, verify that the next open attempt calls `Show(view)` before `Focus(view)`.

- **The view was never created for this save.** `CreateView` should be called on `kPostLoadGame` and `kNewGame`. If neither fires (for example, due to an event registration bug), the view handle will be zero and all subsequent API calls on it will silently do nothing.

---

## The UI appears but input does not work

- **`Focus()` was never called.** `Show()` makes the view visible but does not route input to it. For any panel that needs keyboard or mouse interaction, call `Focus(view)` after `Show(view)`.

- **Another plugin currently has focus.** Only one view can have focus at a time. Call `HasAnyActiveFocus()` to check whether something else is holding focus. If it is, you may need to sequence your plugin's open logic to wait.

- **`disableFocusMenu=true` was set without handling Escape in JS.** When the focus menu is disabled, the game's default Escape handling is suppressed. You must call the appropriate close listener from JS yourself (for example, listening for `keydown` with `key === "Escape"` and calling `window.onClose()`).

---

## The close button or JS listener does nothing

- **Name mismatch between C++ and JS.** The string passed to `RegisterJSListener("name", ...)` in C++ and the function called as `window.name()` in JS must match exactly, including case. `"onClose"` and `"onclose"` are different names.

- **`RegisterJSListener` was called before the DOM was ready.** Listeners must be registered inside the `OnDomReadyCallback`, not before it fires. If you call `RegisterJSListener` from `kPostLoadGame` directly (outside the callback), the call arrives before the page exists and the listener is never wired up.

- **A JS error is silently swallowing the event.** If your listener function throws an uncaught exception, the C++ callback never runs. Enable DevTools (see below) and check the browser console for red errors that coincide with the button press.

---

## The game crashes on load or during gameplay

- **`RequestPluginAPI` return value was not null-checked.** If the framework is not installed, `RequestPluginAPI<IVPrismaUI2>()` returns null. Any subsequent call through that pointer is an immediate crash. Always check the pointer before using it and log a clear error if it is null.

- **Framework DLL version mismatch.** If your plugin was compiled against a newer version of `PrismaUI_F4_API.h` than the DLL the player has installed, runtime dispatch will call into the wrong vtable slot. The log will usually show a version line on startup -- compare it against the version your plugin expects.

---

## The UI appears but looks wrong or unstyled

- **CSS or JS paths in the HTML are wrong.** Paths are resolved relative to the views root (`Data/PrismaUI_F4/views/`), not relative to the HTML file's own location. Use either a root-relative path like `/views/Interface/MyMod/style.css` or a document-relative path like `./style.css`. A bare `style.css` with no prefix may resolve incorrectly depending on the base URL.

- **External fonts or CDN resources are blocked.** The CEF renderer runs with a network sandbox. `fonts.googleapis.com` is whitelisted; most other external CDN domains are not. If your HTML loads a font or script from an external URL that is not whitelisted, it will silently fail to load. Bundle fonts and scripts locally under your views folder instead.

---

## DevTools / inspector will not open

- **The DevTools feature must be explicitly enabled.** Open `Data/PrismaUI_F4/PrismaUI_F4.ini` and set:

  ```ini
  [DevTools]
  bEnabled=1
  ```

  Without this, the inspector API exists but does nothing.

- **You must call the inspector API after enabling.** Once the INI flag is set, call `CreateInspectorView(view)` and then `SetInspectorVisibility(view, true)`. The inspector does not open in-game -- it opens in your external default browser using Chrome's remote debugging protocol.

- **Restart after changing the INI.** Changes to `PrismaUI_F4.ini` are read at startup. A game restart is required for `bEnabled=1` to take effect.

---

## 3D model preview shows nothing

- **The FormID is wrong or the form is not loaded.** Double-check the FormID in your code and confirm the plugin that defines it is present in the player's load order. An invalid FormID produces a silent failure, not a crash.

- **FormType mismatch.** The type string must match the record type of the form. Use `"WEAP"` for weapons, `"ARMO"` for armor, `"MISC"` for misc items, and so on. Passing the wrong type causes the lookup to fail silently.

- **`show()` was called before the view was ready.** Do not call the model preview's JS `show()` function at page load time. Call it from inside a listener or after a DOM-ready signal confirms the view is live.

---

## Input leaks through to the game while the UI is open

- **The view is shown but not focused.** A view that is visible but unfocused does not block game input -- this is intentional for HUD widgets that need to be non-interactive overlays. If your panel needs to capture all input and block game controls, pair every `Show(view)` call with a `Focus(view)` call.

---

## Vanilla HUD widget suppression is not working

- **`SuppressHUDWidget` is OG runtime only.** It only works on runtime 1.10.163. On Next-Gen (NG) and AE runtimes it logs a warning and does nothing. If you need to hide a widget on NG, you will need a different approach.

- **The class name is wrong.** The suppression API matches on the exact Scaleform class name. On the first HUD open, `PrismaUI_F4.log` logs the list of supported class names. Compare your string against that list.
