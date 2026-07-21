# PrismaUI_F4

**This is a beta release.** The CEF backend is new; see
[`docs/1.0-vs-2.0.md`](docs/1.0-vs-2.0.md) for what changed from Prisma UI F4 1.0 and its current
known limitations.

**PrismaUI_F4** is an F4SE plugin that embeds **CEF** (Chromium Embedded Framework - a real
Chromium, currently CEF 147) into Fallout 4. It lets mod authors create fully interactive
HTML/CSS/JavaScript overlays - menus, HUDs, settings panels, terminals - without touching
Scaleform or the game's native UI system. This framework is **CEF-only**: there is no Ultralight
dependency, SDK, or fallback path.

## How It Works

`PrismaUI_F4.dll` (the thin plugin-facing shim, `/MD`) loads `PrismaUI_F4_Host.dll` (`/MT`), which
brings up one shared CEF browser (the "shell") and composites its GPU shared-texture output onto
every rendered frame via a D3D11 `Present` hook. Every plugin's `CreateView` call becomes a
dynamically created `<iframe>` inside that one shared shell, rather than its own separate browser -
this is purely an internal detail; the plugin-facing API is unchanged. You write standard
HTML/CSS/JS with full modern browser support (video, audio, WebGL, current JS/CSS); the framework
handles rendering, input routing, focus management, and cursor visibility.

## Architecture

```
Fallout 4 process
├── F4SE
│   └── PrismaUI_F4.dll              ← thin shim (you never modify this)
│       └── PrismaUI_F4_Host.dll     ← real CEF integration, loaded from PrismaUI_F4_CEF/
│           ├── CEF shell browser    ← one shared browser; every view is an iframe inside it
│           ├── D3D11 Present hook   ← composites the shell's shared texture each frame
│           ├── FocusMenu            ← Scaleform menu that owns the cursor
│           └── Public API           ← IVPrismaUI1 .. IVPrismaUI9
│
└── YourPlugin.dll                   ← your F4SE plugin
    ├── PrismaUI_F4_API.h            ← single header, copy into your project
    └── main.cpp                     ← request API, create views, wire hotkeys
```

## Quick Start

1. Copy `PrismaUI_F4_API.h` into your plugin's `src/` folder.
2. Request the API on `kGameDataReady`:
   ```cpp
   auto* api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
   ```
3. Create a view (starts visible - hide it immediately):
   ```cpp
   PrismaView view = api->CreateView("mymenu.html", OnDomReady);
   api->Hide(view);  // views are visible by default
   ```
4. Place your HTML file at `Data/PrismaUI_F4/views/mymenu.html`.
5. Show, focus, hide from a key handler.

See `docs/` for the full walkthrough, complete API reference, HTML/JS integration guide, view
lifecycle rules, working examples, and current backend limitations. If you're upgrading a plugin
from Prisma UI F4 1.0, see [`docs/1.0-vs-2.0.md`](docs/1.0-vs-2.0.md) for what changed.

If you're using an AI assistant to help build a plugin, see [`mcp-server/`](mcp-server/) - an MCP
server that gives it live access to this API reference and a plugin-scaffolding tool.

## File Layout (installed)

```
Data/
├── F4SE/Plugins/
│   ├── PrismaUI_F4.dll
│   └── PrismaUI_F4_CEF/           ← CEF runtime: PrismaUI_F4_Host.dll,
│                                     PrismaUI_F4_CefSubprocess.exe, libcef.dll + siblings, locales/
└── PrismaUI_F4/
    ├── shell/                     ← the shared CEF shell page (built from shell/dist/)
    └── views/                     ← all HTML files from all consumer plugins land here
        ├── someOtherPlugin.html   (from another installed plugin)
        └── mymenu.html            (from your plugin)
```

MO2 merges every mod's `PrismaUI_F4/views/` folder into one virtual directory. View filenames must be unique across all mods.

## Building the Framework

Most modders never need to do this - you build your own plugin against the prebuilt
`PrismaUI_F4_API.h` (see [Building the Example Plugin](#building-the-example-plugin) below), not
the framework itself. This section is for anyone building `PrismaUI_F4.dll` from source.

PrismaUI_F4 uses **xmake** and a single DLL that targets all three current runtimes
(`CommonLibF4`'s `COMMONLIB_RUNTIMECOUNT=3` covers Old-Gen 1.10.163, Next-Gen 1.10.984, and AE
1.11.221 - the current game version - in one build, with no per-runtime choice to make). There's
no automated build script for the framework itself in this repository - build manually:

1. `cd shell && npm ci && npm run build` - produces the shell bundle every view is embedded into.
2. `xmake` - builds both `PrismaUI_F4.dll` and `PrismaUI_F4_Host.dll`.
3. Deploy `PrismaUI_F4.dll`, `PrismaUI_F4_Host.dll` + its `PrismaUI_F4_CEF/` runtime folder
   (`PrismaUI_F4_CefSubprocess.exe`, `libcef.dll` + siblings, `locales/`), and `shell/dist/*` to
   your Mod Organizer 2 mods folder.

## Building the Example Plugin

We provide a complete, working reference plugin in the [example-f4se-plugin/](example-f4se-plugin) directory that demonstrates standard integrations (bridges, console logging, view creation).

To build and deploy the example plugin:
1. Navigate to the `example-f4se-plugin/` directory.
2. Double-click the `build-and-deploy.bat` script inside that folder. It builds a single DLL that
   supports Old-Gen, Next-Gen, and AE (same `COMMONLIB_RUNTIMECOUNT=3` build as the framework
   itself) - there is no separate per-runtime choice to make.
3. Enter your Mod Organizer 2 mods path (or game data folder) when prompted to automatically install the compiled plugin DLL and the universal HTML/CSS/JS UI assets.
4. Mod authors can easily use this folder as a boilerplate/template to start building their own custom PrismaUI mods.

## Requirements

- Fallout 4 runtime (Old-Gen 1.10.163, Next-Gen 1.10.984, or AE 1.11.221 - the current game version)
- F4SE
- C++23 compiler (MSVC 2022 recommended)
- xmake 3.0+

## Credits and License

This project is a Fallout 4 (F4SE) conversion of the original **Prisma UI** framework by
**StarkMP**, forked and maintained by NomadsReach with StarkMP's permission. The original
SKSE/Skyrim framework lives at https://github.com/PrismaUI-SKSE/framework.

This software is distributed under the **Prisma UI License** (see [LICENSE.md](LICENSE.md)).
It is NOT MIT and NOT open source. In short:

- You may use it for non-commercial or commercial purposes.
- You may study it and modify it for private use.
- You may redistribute the original version only if this license is included without modification.
- You may NOT publicly distribute a modified version without written permission from the author.

### CEF / Chromium dependency

This framework embeds **CEF** (Chromium Embedded Framework, currently CEF 147). CEF and Chromium
are separately licensed under the BSD 3-Clause license (Copyright Marshall A. Greenblatt and
Google Inc.); the full text is in [`CEF-LICENSE.txt`](CEF-LICENSE.txt) in this repository, and
the same file also ships alongside the CEF runtime inside `PrismaUI_F4_CEF/`.
