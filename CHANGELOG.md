# Changelog

What's changed in **PrismaUI_F4**, newest first. Each release is a dropdown — click a section to
expand it.

This file starts partway through 2.0's life, so the early 2.0.x point releases aren't broken out
individually. Everything below has landed since the 2.0 beta went public.

---

## 2026-08-08 — input, reliability & API polish

The current beta update. Gamepad input no longer leaks through to the game, the view-health API
actually reports now, and there's tooling to keep your copy of the API header honest. Full detail
in the dropdowns below.

<details open>
<summary><strong>🎮 Input, focus &amp; cursor</strong></summary>

- **Gamepad buttons no longer double up on the game.** When a controller drove a focused Prisma
  view, the same button press was *also* reaching whatever was underneath. The sharp case: a view
  open over the pause menu, where the D-pad moved the pause menu's own selection while you
  navigated the view, and **A** could fire its highlighted entry — Load Game, or Quit to Desktop.
  A routed pad button is now consumed on the menu chain, so it goes to your view and nowhere else.
  Ordinary gameplay input is untouched.
- **The mouse was stuck in a smaller box.** If anything else had confined the cursor earlier in
  the session — the Pip-Boy being the usual culprit — we inherited that box instead of resetting
  to the full screen, so clicks near the edges went nowhere. Now cleared on every `Focus()` call,
  not just the first of the session.
- **Alt+F4 stopped working while a view held input capture.** Fixed twice, honestly. The first fix
  depended on plugin load order, which nobody can rely on, so it's now a framework-level keyboard
  hook that works no matter what else is installed.
- Escape-key ownership, input routing and mesh binding all got fixes from a full pass over that
  code.

</details>

<details open>
<summary><strong>🩺 View health &amp; reliability</strong></summary>

- **`GetViewHealth` and `RegisterViewErrorSink` actually report now.** They were in the API but
  wired to nothing — a view's health never left "live," even when its page failed to load. They
  now report load failures, JavaScript errors, DOM-ready timeouts, and an unresponsive renderer.
- **A view pointed at a missing HTML file used to look like it loaded fine.** A 404 came back as a
  "successful" empty page, reached DOM-ready, and reported healthy. It's now correctly flagged as a
  load failure, so a typo in a view path is something you can actually detect instead of chasing a
  blank overlay.
- **`CreateView()` could hang the game at startup.** If your plugin called it during
  `kGameDataReady`, it waited on framework init that was itself queued behind your plugin on the
  same thread — a self-deadlock. It now brings the backend up on the calling thread, so it just
  works wherever you call it from.

</details>

<details>
<summary><strong>🧩 New &amp; updated API</strong></summary>

`IVPrismaUI10` adds:

- `SetViewRole` / `GetViewRole` — tag a view as a panel, HUD widget, or overlay.
- `GetFocusedView` — ask which view currently has focus.
- `IsAnyPanelVisible` — one call to check whether any panel-role view is up, so your plugin can
  decide whether it's safe to open its own panel.

Two things worth knowing when you adopt roles:

- **An undeclared view is invisible to `IsAnyPanelVisible`.** `kUnspecified` (the default) is never
  counted, which is correct — but it means a panel that never calls `SetViewRole` won't be seen by
  other plugins' checks, and they'll open on top of it. The framework now logs a one-time warning
  if a view takes focus while still undeclared, so this is easy to catch. **Give any view that
  takes input a role.**
- **`SetViewOffscreenSize` is also your per-view performance lever.** On the software render path
  (Linux/Proton) a view's cost tracks its pixel area, so a mesh-bound view that animates can be
  rendered smaller and stretched over the same surface to trade a little sharpness for frame time.

Earlier in 2.0, `IVPrismaUI9` added per-view offscreen backgrounds — what lets a view bound to a
mesh composite over the geometry properly instead of blacking it out.

New interface versions are always added as a **new** numbered interface; existing ones never
change, so your plugin won't break when you update.

</details>

<details>
<summary><strong>🐧 Linux &amp; Proton</strong></summary>

- **Views used to come out completely blank under wine and Proton.** Chromium was starting fine and
  the pages were loading — it just never handed us a frame, because the fast GPU path it uses on
  Windows has no equivalent there. There's now a software fallback that kicks in automatically, so
  views actually render.
- **Fixed a crash a minute or two into play on Proton.** Chromium was quietly starting its own
  background updater, which tries to use a Windows download service that doesn't really exist there,
  and it took the game down with it. Those background services are off now — they were never wanted
  in a game overlay on any platform.

Windows is untouched by both of these; same path as before.

</details>

<details>
<summary><strong>🥽 Fallout 4 VR (preview)</strong></summary>

There's now a separate VR build, `PrismaUI_F4VR.dll`, for Fallout 4 VR 1.2.72 with F4SEVR. Your
plugin asks for it with `RequestPluginVRAPI` alongside the normal `RequestPluginAPI`, so the base
V1–V10 API you already use works exactly the same in VR.

What it adds: a view can be placed in the world instead of on a flat screen — head-locked so it
follows you, a billboard that turns to face you, or a fixed quad you walk up to. Pointing at it
with a motion controller drives the same mouse events a normal view gets, so existing pages work
without a rewrite.

> [!WARNING]
> **Treat this as a preview and don't ship against it yet.** It builds, it links, and the geometry
> and pointer maths pass their tests, but nobody has run it in a headset yet. A few pieces are
> knowingly switched off in the VR build — mostly the ones that reach into the flat game's UI, so
> vanilla menu suppression and 3D model previews aren't there. The API may still move.

If you own FO4VR and want to try it, I'd genuinely like the reports.

</details>

<details>
<summary><strong>🛠️ SDK &amp; tooling</strong></summary>

- **`check_api_prefix.py`** — a small script to check your copy of `PrismaUI_F4_API.h` against this
  repo's before you build. The API is called by vtable slot, so a header that's out of sync can
  make a call land on the *wrong function* with no error. Run it and it tells you plainly if a slot
  would shift. (`python3 scripts/check_api_prefix.py path/to/your/PrismaUI_F4_API.h`)
- **The header now documents which interfaces are closed.** Once an interface has a newer one
  deriving from it, appending to it would shift every later slot — so it's marked closed, and new
  methods only ever go in a new interface.
- **Fixed a real trap in this repo.** The header the README tells you to copy was stale and stopped
  at V9, while the copy inside the example plugin had V10. Both are in sync now.
- Added `PrismaUI_F4VR_API.h` for the VR extension, plus a preview doc.
- **`prisma-mcp`** shipped — an MCP server so an AI assistant reads the real, current API instead
  of guessing. There's a one-click bundle for Claude Desktop; if you're building with an assistant,
  install this first.
- Licensing cleaned up: proper CEF BSD text included, leftover Ultralight obligations removed (there
  is no Ultralight in 2.0), and original authorship credited.

</details>

<details>
<summary><strong>⚠️ Known issues</strong></summary>

- **Pause may still not work for some people.** At least one report of `pauseGame: true` not pausing
  on 1.11.221 with nothing else installed. Not reproduced or confirmed yet. Tracked in
  [#1](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/1).
- **Mouse interaction is still fiddly to get right from scratch.** More than one author has hit this.
  If you're stuck, check
  [#7](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/7) and
  [#2](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/2) before starting over.
- **VR is unverified in a headset**, as above.
- The gamepad-consume and view-health fixes above are new this update; if a controller or a view's
  health reporting behaves oddly, open an issue — those paths are freshly changed.

</details>
