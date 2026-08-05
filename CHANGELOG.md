# Changelog

What's changed in PrismaUI_F4. Newest first.

This file starts partway through 2.0's life, so the early 2.0.x point releases aren't broken out
individually. Everything below has landed since the 2.0 beta went public.

## Unreleased

### Fallout 4 VR support (preview)

There's now a separate VR build of the framework, `PrismaUI_F4VR.dll`, for Fallout 4 VR 1.2.72
with F4SEVR. Your plugin asks for it with `RequestPluginVRAPI` alongside the normal
`RequestPluginAPI`, so the base V1 to V10 API you already use works exactly the same in VR.

What it adds on top: a view can be placed in the world instead of on a flat screen. Head locked so
it follows you, a billboard that turns to face you, or a fixed quad you walk up to. Pointing at it
with a motion controller drives the same mouse events a normal view gets, so existing pages work
without a rewrite.

**Treat this as a preview and don't ship against it yet.** It builds, it links, the geometry and
pointer maths pass their tests, but nobody has actually run it in a headset. I don't own a VR rig,
so I can't confirm it draws a single pixel in game. Some pieces are knowingly switched off in the
VR build too, mostly the ones that reach into the flat game's UI, so vanilla menu suppression and
3D model previews aren't there yet. The API is documented as a preview for the same reason, it may
still move.

If you own FO4VR and want to try it, I'd genuinely like the reports.

### Linux and Proton

Views used to come out completely blank under wine and Proton. Chromium was starting fine and the
pages were loading, it just never handed us a frame, because the fast GPU path it uses on Windows
has no equivalent there. There's now a software fallback that kicks in automatically when that
happens, so views actually render.

Also fixed a crash a minute or two into play on Proton. Chromium was quietly starting its own
background updater, which tries to use a Windows download service that doesn't really exist there,
and it took the game down with it. Those background services are off now. They were never wanted
in a game overlay on any platform.

Windows is untouched by both of these. Same path as before.

### Focus, cursor and input fixes

- **The mouse was stuck in a smaller box.** If anything else had confined the cursor earlier in
  the session, the Pip-Boy being the usual culprit, we inherited that box instead of resetting to
  the full screen, so clicks near the edges went nowhere. Now cleared on every `Focus()` call, not
  just the first one of the session.
- **`Focus(view, pauseGame: true)` didn't pause anything.** The menu that holds the pause state
  had stopped being registered, so the flag had nothing to act on. Rebuilt as its own dedicated
  menu that only does that one job. See the known issues below, this one isn't fully closed.
- **Alt+F4 stopped working while a view had input capture.** Fixed twice, honestly. The first fix
  depended on plugin load order, which isn't something anyone can rely on, so it's now a
  framework-level keyboard hook that works no matter what else is installed.
- **`CreateView()` could hang the game at startup.** If your plugin called it during
  `kGameDataReady`, it was waiting on framework init that was itself queued behind your plugin on
  the same thread. Classic self-deadlock. It now brings the backend up on the calling thread
  instead, so it just works wherever you call it from.
- Escape key ownership, input routing and mesh binding all got fixes from a full pass over that
  code.

### New API

`IVPrismaUI10` adds:

- `SetViewRole` / `GetViewRole`, tag a view as a panel, HUD or overlay
- `GetFocusedView`, ask which view currently has focus
- `IsAnyPanelVisible`, one call to check whether any panel-role view is up

Earlier in 2.0, `IVPrismaUI9` added per-view offscreen backgrounds, which is what lets a view
bound to a mesh composite over the geometry properly instead of blacking it out.

New interface versions are always added as a new numbered interface. Existing ones never change,
so your plugin won't break when you update.

### SDK and tooling

- **Fixed a real trap in this repo.** The header the README tells you to copy, `src/PrismaUI_F4_API.h`,
  was stale and stopped at V9, while the copy inside the example plugin had V10. So the docs
  described methods the header you'd actually copied didn't have. Both are in sync now.
- Added `PrismaUI_F4VR_API.h` for the VR extension, plus a preview doc for it.
- `prisma-mcp` shipped, an MCP server so an AI assistant reads the real current API instead of
  guessing at it. There's a one-click bundle for Claude Desktop. If you're building with an
  assistant, install this first.
- Licensing cleaned up. Proper CEF BSD text included, the leftover Ultralight obligations removed
  since there's no Ultralight in 2.0 at all, and original authorship credited properly.

### Known issues

- **Pause may still not work for some people.** At least one report of `pauseGame: true` not
  pausing on 1.11.221 with nothing else installed. I haven't reproduced or confirmed the Next Gen
  angle yet, so don't assume that's the cause. Tracked in
  [#1](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/1).
- **Mouse interaction is still tricky to get right from scratch.** More than one author has hit
  this. If you're stuck, check
  [#7](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/7) and
  [#2](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0/issues/2) before starting
  over, and open an issue if neither helps.
- VR is unverified in a headset, as above.
