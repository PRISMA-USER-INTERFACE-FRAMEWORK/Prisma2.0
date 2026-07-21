# PrismaUI Example Plugin

This is a complete, ready-to-compile example of a Fallout 4 F4SE plugin that uses the PrismaUI framework to render an HTML/JS/CSS interface in-game.

## Old-Gen, Next-Gen, and AE: One Build

Fallout 4 has three current runtimes: Old-Gen (1.10.163), Next-Gen (1.10.984), and AE (1.11.221,
the current game version). Rather than compiling a separate DLL per runtime, this plugin uses
CommonLibF4's `COMMONLIB_RUNTIMECOUNT=3` build, which targets all three from a single compiled DLL
- there is no separate build step or choice to make.

Your UI files (`.html`, `.css`, `.js`) are universal regardless of runtime and only need to be
written once.

### How to Compile

1. Double-click the `build-and-deploy.bat` file in this directory.
2. It builds the single universal DLL via `xmake`, then prompts for a deployment path (your Mod
   Organizer 2 mods folder or game data folder) and installs the DLL and view files there.

### Publishing to NexusMods

Since this is a single DLL that already covers Old-Gen, Next-Gen, and AE, you only need to
upload one file - no FOMOD installer or version-detection logic is required for the plugin DLL
itself.

## File Structure

```
example-f4se-plugin/
├── src/
│   ├── main.cpp - Plugin entry point and initialization
│   ├── keyhandler/ - Input event handling
│   └── PCH.h - Precompiled header
├── view/ - Your HTML/JS/CSS frontend
├── build-and-deploy.bat - Automated build/deploy script
└── xmake.lua - Build configuration
```

## Integration with PrismaUI_F4

This plugin requires the PrismaUI_F4 framework to be installed:
- Framework DLL: `PrismaUI_F4.dll`
- Framework dependencies: `PrismaUI_F4_CEF/` (contains `PrismaUI_F4_Host.dll`, `PrismaUI_F4_CefSubprocess.exe`, `libcef.dll` + siblings, `locales/`)

Make sure you have deployed the framework before loading your plugin in-game.
