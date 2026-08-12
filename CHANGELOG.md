# Changelog

PrismaUI_F4 release history. Newest first.

---

<details open>
<summary><strong>2026-08-11</strong></summary>

### Framework

- Completed a larger CEF hardening pass. Plugin views now have stronger origin isolation, local file
  and network access is tighter, native messages are validated at the sender, and callbacks are
  scoped to the view that owns them.
- `Invoke(..., callback)` now finishes cleanly on success, JavaScript errors, invalid or destroyed
  views, and timeouts instead of leaving callbacks hanging.
- Host DLL loading no longer changes the process-wide DLL search path. Prisma now uses scoped
  `LoadLibraryExW` flags so Chromium's DLL directory does not leak into other F4SE plugins.
- Tightened renderer, audio, startup, and shutdown handling around several failure paths that could
  leave the framework half-initialized.

### Dock and input

- Fixed Dock mouse handling over the PauseMenu. The Dock can receive mouse input without taking over
  the whole game window.
- The Prisma cursor now draws above interactive Dock controls and gives control back cleanly when the
  cursor leaves the Dock.
- Fixed the shell blocking its own Dock and boot pages during their initial load.
- Forwarded Win32 input now continues through the window subclass chain instead of starving another
  plugin just because Prisma has focus.

### Linux and Proton

- External HTTPS links now open through the desktop browser instead of staying inside CEF. Windows
  uses the normal shell path. Proton tries the desktop portal first and keeps `winebrowser.exe` as a
  fallback.
- The Proton Dock link path has been verified to reach the configured desktop browser. Whether the
  browser is brought to the foreground can still depend on the desktop environment's focus policy.

### Fallout 4 VR

- Pause maintenance and stuck-pause recovery now run from the VR frame path as well as flat Fallout 4.
- VR is still a preview while the remaining headset and controller behavior is tested.

</details>

---

<details>
<summary><strong>2026-08-10</strong></summary>

### Overlay input

- Added `FocusOverlay()` and `SetInputRegions()` for overlays that only need part of the screen.
  Mouse input goes to Prisma inside registered UI regions while transparent or outside areas fall
  through to Fallout.
- Existing `Focus()` behavior is unchanged and still provides full input capture.
- Added `PrismaCapability::InputRegions` and `PrismaUI_F4_GetCapabilities()` so plugins can check
  support instead of assuming a framework version has it.

</details>

---

<details>
<summary><strong>2026-08-09</strong></summary>

### SDK

- Fixed the C++ SDK provider lookup on Fallout 4 VR. The header now finds `PrismaUI_F4VR.dll` as
  well as the flat `PrismaUI_F4.dll`. Papyrus users were not affected. No interface, method, or
  vtable slot changed. ([#23](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/23))
- SDK headers now ship in `Developer/` and are copied directly from source during packaging so the
  public header cannot quietly fall behind the framework again.

### Fallout 4 VR

- PrismaUI_F4VR ran in a real headset for the first time. The guarded Fallout 4 VR 1.2.72 stereo
  hook installed correctly.
- Fixed a VR startup bug where the flat compositor check stopped CEF before it could initialize.
- Flat Fallout 4 and Fallout 4 VR are packaged separately now. They target different runtimes and
  should not be installed together.

### Release packaging

- Release builds now verify the correct flat or VR DLL, binary hashes, source freshness, required CEF
  files, and export surface before a zip is written.

</details>

---

<details>
<summary><strong>2026-08-08</strong></summary>

### Input and focus

- Controller input routed to a focused Prisma view is now marked handled so the same button is not
  intentionally passed to the menu underneath it. The remaining controller-specific regression
  checks are still being worked through.
- Fixed cursor constraints carrying over from screens such as the Pip-Boy and leaving parts of the
  screen unclickable.
- `Focus()` no longer reports success before CEF is ready and then silently discards the player's
  input.
- Fixed Alt+F4 while a Prisma view holds focus.
- Fixed scroll-wheel coordinates and double-scaling on mesh-bound views such as Pip-Boy and terminal
  screens.
- Fixed rebinding a view to another mesh reporting success without actually updating the screen.

### Stability

- Fixed a freeze when using a workshop crafting bench.
- Fixed a crash where a view texture could be released while the engine was still drawing the mesh
  using it.

### View health

- `GetViewHealth` and `RegisterViewErrorSink` are now wired into real framework state instead of
  always looking healthy.
- Added reporting for load failures, JavaScript errors, DOM-ready timeouts, and an unresponsive
  renderer.
- HTTP error pages such as a missing view file are now routed into the load-failure path instead of
  being treated as a normal healthy page.
- Fixed a startup deadlock when a plugin called `CreateView` during `kGameDataReady`.

### API

IVPrismaUI10 added:

- `SetViewRole` / `GetViewRole`
- `GetFocusedView`
- `IsAnyPanelVisible`

Existing numbered interfaces remain unchanged. New API is added through a new interface version so
plugins built against older versions keep working.

### Linux and Proton

- Added the software rendering fallback required for Wine and Proton when Chromium cannot use the
  normal Windows accelerated path.
- Fixed the Proton crash caused by Chromium background update services trying to use Windows services
  that do not exist under Wine.

### SDK and tooling

- Added `check_api_prefix.py` to catch SDK headers that do not match the framework's interface layout.
- Added `PrismaUI_F4VR_API.h` for the VR extension.
- `prisma-mcp` is available as a separate package so AI tools can read the current Prisma API docs
  instead of working from stale context.
- Added the proper CEF license text, removed leftover Ultralight references, and kept original
  authorship credit.

### Known issues

- Some users have reported `pauseGame: true` not pausing on 1.11.221. Tracked in
  [#1](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/1).
- Mouse interaction can still be easy to configure incorrectly. See
  [#7](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/7) and
  [#2](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/2).
- Fallout 4 VR is still preview quality and needs wider headset testing.

</details>

---

<details>
<summary><strong>2.0 beta (2025, initial public release)</strong></summary>

The first public PrismaUI 2.0 release replaced Ultralight with CEF 147 and moved the framework to the
current Host + CEF architecture. It also introduced numbered API interfaces, JS interop, focus and
input management, offscreen mesh rendering, and the shared shell used to host Prisma views.

</details>
