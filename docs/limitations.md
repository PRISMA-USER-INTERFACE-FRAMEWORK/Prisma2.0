---
title: 'Limitations'
---
# Limitations

PrismaUI F4 is powered by **CEF** (Chromium Embedded Framework, currently CEF 147) - a real,
full Chromium engine, not an embedded-WebKit approximation. There is no Ultralight code path.
The following applies to all views regardless of what you build.

---

## Media

**Video and audio work.** The `<video>`/`<audio>` elements and the Web Audio API are functional.
Sources are subject to the framework's network/media whitelist (`connect-src`/`media-src`) -
`file:`/`data:`/`blob:` (local/self-hosted media) plus these remote domains and their subdomains:
`static.wikia.nocookie.net`, `cdn.jsdelivr.net`, `fonts.googleapis.com`, `youtube.com`, `youtu.be`,
`googlevideo.com`, `nexusmods.com`. Arbitrary open-internet media/scripts/images beyond this list
are blocked. Autoplay follows Chromium's normal autoplay policy (playback may start muted without
a user gesture, matching any Chromium-based embedder) unless the framework overrides it.

**WebGL works.** CEF exposes the standard `getContext('webgl')`/`getContext('webgl2')` contexts
via Chromium's GPU pipeline; no flag disables it in this framework's CEF configuration.

---

## Rendering

Views are composited via CEF's **GPU shared-texture path** (`OnAcceleratedPaint`), not a CPU
pixel-buffer blit - the framework logs an error if the CPU `OnPaint` path is ever hit instead,
since that would mean the GPU path failed to come up. There is no explicit FPS cap configured.
Heavy CSS effects (`box-shadow`, `backdrop-filter`, large blurs) are not free, but general
performance advice for any GPU-composited Chromium surface applies here - avoid stacking many
expensive filters on elements that redraw every frame.

---

## JavaScript

Full modern JS via V8/Chromium (CEF 147) - current-spec JavaScript, not a restricted subset.

---

## CSS Frameworks

CEF 147's Chromium engine supports the modern CSS features **TailwindCSS v4** relies on
(`@property`, cascade layers, etc.), so either Tailwind v3 or v4 works.

---

## Shared shell (new in the CEF architecture)

Every view is an `<iframe>` inside one shared CEF browser (the "shell"), not its own independent
browser instance. This is invisible to plugin code - `CreateView`/`Show`/`Hide`/`Focus`/`Destroy`
and friends behave the same. One surface point still no-ops for the CEF backend:
`GetScrollingPixelSize`/`SetScrollingPixelSize` logs "not yet implemented" and returns 0.
`SetInspectorBounds` is also a no-op, but deliberately - see the Inspector section of
[view-lifecycle.md](view-lifecycle.md#inspector). Everything else on the V1-V9 surface, including
the on-mesh texture-handoff group (`GetViewSRV`/`SetViewOffscreen`/`BindViewToGeometry`/
`BindViewToScreenTexture`/`UnbindViewFromGeometry`), is implemented and in active use.

---

## Multiple Views

The API supports multiple views per plugin. Under CEF each view is an iframe inside the shared
shell rather than its own browser - they still don't share JS/DOM state with each other (standard
iframe isolation), but they do share the shell's single composited texture.

Where possible, prefer a **single view** that manages its own routing and page state internally (React Router, Vue Router, etc.). Multiple views are fine for genuinely separate surfaces like a persistent HUD alongside a toggle menu, but avoid creating many views for screens that could be JS routes inside one page.

---

## Event Handling Quirks

### Right-click / contextmenu

The `contextmenu` DOM event does not fire correctly. Implement right-click detection manually:

```javascript
window.addEventListener('mousedown', (event) => {
  if (event.button === 2) {
    const contextMenuEvent = new MouseEvent('contextmenu', {
      ...event,
      view: window,
      bubbles: true,
      cancelable: true,
      screenX: event.pageX,
      screenY: event.pageY,
      clientX: event.pageX,
      clientY: event.pageY,
    });
    event.target?.dispatchEvent(contextMenuEvent);
  }
});
```

### Blocking specific keys from inputs

Numpad keys and other game-bound keys may type characters into focused `<input>` elements. Block them with a combined `keydown` + `beforeinput` listener:

```javascript
const BLOCKED_KEY_CODES = [
  96, 97, 98, 99, 100, // Numpad 0-4
  101, 102, 103, 104, 105, // Numpad 5-9
];

let lastKeyCode = null;

window.addEventListener('keydown', (e) => {
  lastKeyCode = e.keyCode;
}, { capture: true });

window.addEventListener('beforeinput', (e) => {
  if (lastKeyCode !== null && BLOCKED_KEY_CODES.includes(lastKeyCode)) {
    e.preventDefault();
  }
}, { capture: true });
```

---

## Custom Cursor

Replace the default system cursor with a custom PNG image when any PrismaUI view has focus. Place your file at:

```
Data/PrismaUI_F4/misc/cursor.png
```

In MO2, inside your mod folder:

```
mods/MyPlugin_F4/
└── PrismaUI_F4/
    └── misc/
        └── cursor.png
```

No code changes required. PrismaUI F4 automatically uses the file when a view is focused. Use a PNG that is visible against varying in-game backgrounds.

---

## PrismaUI_F4.dll / PrismaUI_F4_Host.dll ABI mismatch

**Symptom:** every `CreateView` call blocks for several seconds and views never appear ("froze
after load"); the F4SE log or `PrismaUI_F4_Host.dll`'s own log mentions an ABI version mismatch.

**Cause:** `PrismaUI_F4.dll` (the thin plugin-facing shim) and `PrismaUI_F4_Host.dll` (the real CEF
integration) talk over a versioned POD C-ABI (`CefHostABI.h`). If the two DLLs come from different
builds - e.g. only one of them got redeployed - the ABI version check fails and every operation
degrades to a bounded-polling timeout instead of working.

**Fix:** always rebuild and redeploy `PrismaUI_F4.dll` and `PrismaUI_F4_Host.dll` together (plus
the `PrismaUI_F4_CEF/` runtime folder and `shell/dist/`) - never mix a Host DLL from one build
with a shim DLL from another.
