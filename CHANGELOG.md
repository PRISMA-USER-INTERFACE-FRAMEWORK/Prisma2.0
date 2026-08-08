# Changelog

PrismaUI_F4 release history, newest first. Click a date to expand it.

---

<details open>
<summary><strong>2026-08-08</strong></summary>

### Input and focus

- **Gamepad buttons no longer pass through to the game while a view has focus.** When a controller
  drove a focused Prisma view, the same button press was reaching whatever was underneath it as well.
  The sharp case was a view open over the pause menu, where D-pad moved the pause menu's own
  selection and A could fire its highlighted entry, including Load Game or Quit to Desktop. A routed
  button is now consumed on the menu chain so it goes to your view and nowhere else. Ordinary
  gameplay input (outside a focused view) is untouched.

- **The cursor was constrained to a smaller box after certain screens.** If anything confined the
  cursor earlier in the session (the Pip-Boy is the most common cause), that constraint was inherited
  instead of being reset to the full screen, so clicks near the edges went nowhere. Cleared on every
  Focus call now, not just the first of the session.

- **Alt+F4 stopped working while a view held input capture.** Fixed at the framework level so it
  works regardless of plugin load order.

- General cleanup pass over escape-key ownership, input routing, and mesh-view input binding.

### View health and reliability

- **GetViewHealth and RegisterViewErrorSink actually report now.** Both methods were present in the
  API but wired to nothing; a view's health status never left "live" regardless of what happened to
  its page. They now report load failures, JavaScript errors, DOM-ready timeouts, and an unresponsive
  renderer.

- **A missing HTML file used to look like a successful load.** A 404 from a bad view path came back
  as a successful empty page, reached DOM-ready, and reported healthy. It is now correctly flagged as
  a load failure.

- **CreateView could deadlock the game at startup** if called during kGameDataReady, because it
  waited on framework init that was itself queued behind the calling plugin on the same thread.
  Fixed; it brings the backend up on the calling thread when needed.

### New API (IVPrismaUI10)

- `SetViewRole` / `GetViewRole` -- tag a view as a panel, HUD widget, or overlay.
- `GetFocusedView` -- returns which view currently holds focus.
- `IsAnyPanelVisible` -- one call to check whether any panel-role view is currently visible,
  so a plugin can decide whether it is safe to open its own panel on top.

Two things to know when adopting roles:

An undeclared view is invisible to `IsAnyPanelVisible`. `kUnspecified` (the default) is never
counted. A panel that never calls `SetViewRole` will not be seen by other plugins' checks and they
will open on top of it. The framework now logs a one-time warning if a view takes focus while still
undeclared. Give any view that takes input a role.

`SetViewOffscreenSize` doubles as a per-view performance lever on the software render path
(Linux and Proton). A mesh-bound view rendered at lower resolution and stretched over the same
surface trades sharpness for frame time. The tradeoff is yours to tune.

New interface versions are always added as a new numbered interface. Existing ones never change,
so a plugin built against V9 keeps working after updating to the V10 header.

### Linux and Proton

- **Views rendered as a solid blank under Wine and Proton.** Chromium was starting and the pages
  were loading; it just never produced a frame because the GPU path it uses on Windows has no
  equivalent there. A software fallback now kicks in automatically.

- **Fixed a crash one to two minutes into play on Proton.** Chromium was starting a background
  updater that tried to reach a Windows download service that does not exist under Proton, and it
  took the game process down with it. Those background services are disabled; they were never
  appropriate inside a game overlay on any platform.

Windows is unaffected by both changes.

### Fallout 4 VR (preview)

A separate VR build, `PrismaUI_F4VR.dll`, targets Fallout 4 VR 1.2.72 with F4SEVR. Plugins
request it with `RequestPluginVRAPI` alongside the normal `RequestPluginAPI`, so the V1-V10 API
you already use works identically in VR.

What the VR build adds: a view can be placed in the world instead of on the flat screen, either
head-locked, billboard-facing, or as a fixed quad. Pointing at it with a motion controller
produces the same mouse events a normal view receives, so existing pages work without modification.

> [!WARNING]
> This is a preview build. It compiles, links, and the geometry and pointer math pass their tests,
> but it has not been run in a headset. A few subsystems are intentionally disabled in the VR
> build, mainly those that reach into the flat game's UI, so vanilla menu suppression and 3D model
> previews are not available. The API may still change.

### SDK and tooling

- **check_api_prefix.py** checks your local copy of `PrismaUI_F4_API.h` against this repo's before
  you build. The API is called by vtable slot, so a header that is out of sync can silently route a
  call to the wrong function. Run it with
  `python3 scripts/check_api_prefix.py path/to/your/PrismaUI_F4_API.h`.

- The header now marks which interfaces are closed. Once an interface has a newer one deriving from
  it, appending methods would shift every later slot. Closed interfaces are annotated and new methods
  go into a new interface only.

- The header included with the example plugin was ahead of the one listed in the README. Both are
  now in sync at V10.

- Added `PrismaUI_F4VR_API.h` for the VR extension, and a preview doc alongside it.

- **prisma-mcp** ships as a separate package -- an MCP server so an AI assistant can read the
  current API reference directly rather than guessing from old context. One-click bundle for Claude
  Desktop is included.

- Licensing: proper CEF BSD text added, leftover Ultralight references removed (there is no
  Ultralight in 2.0), and original authorship credited.

### Known issues

- **Pause may not work for some users.** At least one report of `pauseGame: true` not pausing on
  1.11.221 with nothing else installed. Not reproduced yet. Tracked in
  [#1](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/1).

- **Mouse interaction is difficult to configure from scratch.** Several plugin authors have hit this.
  Check [#7](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/7) and
  [#2](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/2) before starting over.

- **VR is unverified in a headset**, as noted above.

- The gamepad-consume and view-health changes are new this release. If either behaves unexpectedly
  in your setup, open an issue.

</details>

---

<details>
<summary><strong>2.0 beta (2025, initial public release)</strong></summary>

The initial public release of the 2.0 series. Replaced the Ultralight renderer with CEF 147.
Rewrote the host-process architecture, introduced the numbered interface versioning model, and
shipped the initial V1-V9 API surface covering view creation, focus and input management, JS
interop, offscreen mesh rendering, and the shell page that hosts all views in a single shared
Chromium browser.

Early point releases in this cycle are not individually documented here.

</details>
