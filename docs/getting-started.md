# Getting Started with PrismaUI_F4

This guide walks you from a completely empty machine to a working F4SE plugin that opens an
HTML overlay when you press a key. It assumes no prior experience setting up an F4SE/xmake
project - if you've done this before, skip to [Step 2](#step-2-clone-the-example-plugin-fastest-path).

By the end, pressing **F4** in-game will pop up a small green terminal-style box with a title and
a message. That's it - a minimal starting point you then build your real UI on top of.

**Using Claude or another AI assistant to help write your plugin?** Install
[`prisma-mcp`](../mcp-server/) first - it gives your assistant live, always-current access to
every API method's real signature and docs instead of it guessing from training data. This is
the recommended way to build a PrismaUI plugin with AI assistance.

---

## Step 0: Install what you need

Do these once. You only need to repeat this setup on a new machine.

1. **Visual Studio 2022** (the free Community edition is fine) -
   https://visualstudio.microsoft.com/downloads/
   - During install, check the **"Desktop development with C++"** workload. Nothing else in this
     guide needs any other workload.
   - If Visual Studio is already installed but you're not sure the C++ workload is there: open
     the **Visual Studio Installer** app (search your Start menu for it), click **Modify** on
     your VS2022 install, and check "Desktop development with C++" if it isn't already checked.

2. **Git for Windows** - https://git-scm.com/download/win
   - You need this to pull `CommonLibF4` as a submodule. If `git --version` already works in a
     terminal, you have it.

3. **xmake 3.0+** - https://xmake.io/#/guide/installation
   - Follow the Windows install instructions on that page (a PowerShell one-liner at the time of
     writing). After installing, open a **new** terminal window and run:
     ```
     xmake --version
     ```
     If that prints a version number, you're set. If it says the command isn't recognized, close
     and reopen your terminal (or restart your machine) - xmake's installer updates your PATH,
     which existing terminal windows don't pick up automatically.

4. **PrismaUI_F4 itself, installed in your Fallout 4 modlist.** This is the actual framework mod
   (`PrismaUI_F4.dll`, `PrismaUI_F4_Host.dll`, and the `PrismaUI_F4_CEF/` runtime folder) - install
   it through Mod Organizer 2 (or Vortex) like any other mod, the same way your players will. You
   are building a plugin *against* this framework, not building the framework itself.
   - PrismaUI_F4 is CEF-backed (Chromium Embedded Framework, currently CEF 147) - there is no
     Ultralight dependency. If you have an old install with `AppCore.dll`/`Ultralight.dll`/etc.
     under `Data/PrismaUI_F4/libs/`, that's from an incompatible older build - replace it with a
     current one rather than mixing files from both.

You do **not** need to install CommonLibF4 separately right now - it gets pulled in as a git
submodule in the next step, whichever path you take.

---

## Step 1: Two ways to start

- **[Step 2: clone the example plugin](#step-2-clone-the-example-plugin-fastest-path)** -
  recommended for almost everyone. You get a project that's already known to build and already
  demonstrates the framework's main features, and you rename/edit it into your own plugin.
- **[Step 6: build a project from scratch, file by file](#step-6-building-from-scratch-file-by-file)** -
  useful once you understand the pieces and want to see exactly what each file does, or if you
  want the smallest possible starting point instead of the full example plugin's feature set.

Most people should do Step 2 once, get it building and showing up in-game, and only read Step 6
afterward as reference for what each file is actually doing.

---

## Step 2: Clone the Example Plugin (Fastest Path)

1. Copy the `example-f4se-plugin/` folder (from this repository) somewhere outside this repo -
   this becomes your own project. Rename the folder to your plugin's name, e.g. `MyPlugin_F4/`.
2. Open `xmake.lua` inside it and change the `target("PrismaUI-F4-Example")` name and the
   `add_rules("commonlibf4.plugin", { name = ... })` name to your plugin's name. Keep them
   identical to each other.
3. Rename `src/main.cpp`'s references to the example view path
   (`"PrismaUI-F4-Example/index.html"`) to match your own plugin name, and replace the contents
   of `view/index.html` with your own UI - the example's is a full tabbed demo panel, more than
   you need as a starting point.
4. Follow [Step 4: build it](#step-4-build-it) below using this folder.

This gets you to a working, deployable plugin fastest, because you're editing something that
already compiles rather than typing every file from scratch and debugging typos along the way.

---

## Step 3: Understand the project layout

Whichever path you took, a PrismaUI plugin project looks like this:

```text
MyPlugin_F4/
├── src/
│   ├── PCH.h
│   ├── main.cpp
│   └── PrismaUI_F4_API.h       ← copy from PrismaUI_F4 framework
├── view/                       ← Your HTML/CSS/JS files
│   └── index.html
├── xmake.lua                   ← Your build configuration
└── build-and-deploy.bat        ← The build script
```

The `view/` folder name is just this guide's convention - your project's source-side layout can be
anything (`html-views.md` uses `assets/views/` in its examples). What matters is only the
*deployed* location, which is always `Data/PrismaUI_F4/views/` in the installed mod - your deploy
script is responsible for copying your source folder there.

---

## Step 4: Build it

From your project folder, in a terminal:

```
xmake f -c
xmake
```

- `xmake f -c` configures the project (downloads/builds CommonLibF4 the first time - this can take
  several minutes on a first run, since it's compiling a dependency, not just your plugin).
- `xmake` does the actual build.

**What success looks like:** the second command ends with something like
`build ok, spent Ns` and a file now exists at `build\windows\x64\release\<YourPluginName>.dll`
(if you renamed things from the example plugin in Step 2, use whatever name you gave the target).

**If it fails**, see [Troubleshooting](#troubleshooting) below before assuming something in this
guide is wrong - the vast majority of first-build failures are one of the causes listed there.

If your project has a `build-and-deploy.bat` (the example plugin does, and Step 6's from-scratch
walkthrough builds one too), running that script does the same build plus deployment in one step -
see Step 5.

---

## Step 5: Deploy and test in-game

1. If you have a `build-and-deploy.bat`, run it - it builds and then asks for a deployment path.
   Otherwise, manually copy:
   - `build\windows\x64\release\<YourPluginName>.dll` → `<MO2 mod folder>\F4SE\plugins\<YourPluginName>.dll`
   - your `view/` folder's contents → `<MO2 mod folder>\PrismaUI_F4\views\<YourPluginName>\`
2. **Important:** never delete a mod folder wholesale to "start fresh." MO2 mod folders can
   contain files not tracked by your build. Always copy individual files in, never clear the
   folder first.
3. Enable the mod in MO2, launch the game, load into a save (or start a new game), and press
   whatever hotkey you wired up (**F4** if you're following Step 6's example verbatim).
4. If nothing happens, open `%USERPROFILE%\Documents\My Games\Fallout4\F4SE\<YourPluginName>.log`
   and check it exists and has recent timestamps - this confirms F4SE loaded your DLL at all. See
   [Troubleshooting](#troubleshooting) if the log is missing entirely, or if it exists but the
   view never appears.

---

## Step 6: Building from scratch, file by file

This section exists so you understand what each file does. If you followed Step 2, you already
have equivalents of all of these inside the example plugin - read this as reference, not as
something you also need to type out.

### xmake.lua

```lua
-- MyPlugin_F4/xmake.lua
includes("lib/commonlibf4") -- Path to your CommonLibF4 submodule

target("MyPlugin_F4")
    set_kind("shared")
    set_languages("c++23")
    set_filename("MyPlugin_F4.dll")

    add_rules("commonlibf4.plugin", {
        name    = "MyPlugin_F4",
        author  = "YourName",
        version = "1.0.0"
    })

    add_includedirs("src")
    add_files("src/**.cpp")
    set_pcxxheader("src/PCH.h")
    add_defines("WIN32_LEAN_AND_MEAN", "NOMINMAX")

    if is_plat("windows") then
        add_cxflags("/permissive-", "/wd4200", "/wd4201", "/wd4324")
        add_syslinks("Version", "Ole32", "OleAut32", "User32", "bcrypt", "crypt32")
    end
```

This references `lib/commonlibf4` as a submodule, but doesn't create it for you. Add it once,
from your project's root, in a terminal:

```
git init
git submodule add https://github.com/Dear-Modding-FO4/CommonLibF4.git lib/commonlibf4
git submodule update --init --recursive
```

(If your project isn't a git repository yet, `git init` first, as shown above. If it already is,
skip that line.)

### build-and-deploy.bat

CommonLibF4's `COMMONLIB_RUNTIMECOUNT=3` build covers Old-Gen (1.10.163), Next-Gen (1.10.984), and
AE (1.11.221, the current game version) from a single compiled DLL - there is no per-runtime
build to choose between. A simple deploy script just needs to build once and copy the output:

```bat
@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Building MyPlugin_F4...
echo ========================================
echo.

xmake f -c
xmake
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
set /p DEPLOY_PATH="Enter deployment path (e.g., MO2 Mods folder): "
copy /Y "build\windows\x64\release\MyPlugin_F4.dll" "!DEPLOY_PATH!\F4SE\plugins\MyPlugin_F4.dll"
xcopy /Y /E "view\*" "!DEPLOY_PATH!\PrismaUI_F4\views\MyPlugin_F4\"
echo Deployment Complete!
pause
```

### PCH.h

```cpp
#pragma once

#include <RE/Fallout.h>
#include <F4SE/F4SE.h>
#include <F4SE/Impl/WinAPI.h>

#include <spdlog/spdlog.h>

namespace logger = F4SE::log;

using namespace std::literals;
```

### main.cpp

Your C++ file handles initializing F4SE and loading your UI view when the game is ready.

The example below requests `IVPrismaUI3` - the API is additive and backward-compatible, and V3's
methods still work unchanged today, but the interface has since grown through `IVPrismaUI9` (on-mesh
rendering, HUD/menu suppression, controller support, and more). Request the lowest version that has
the methods you need; see `api-reference.md` for the full current surface.

This guide's own key-press-to-toggle needs a hotkey input sink, which is boilerplate you write
once and reuse - it isn't part of `PrismaUI_F4_API.h` itself. Rather than repeat that boilerplate
here, use the ready-made `KeyHandler` shipped in `example-f4se-plugin/src/keyhandler/` (copy those
two files into your own project's `src/keyhandler/`); the code below assumes it's already in place.

```cpp
#include "PrismaUI_F4_API.h"
#include "keyhandler/keyhandler.h"
#include <spdlog/sinks/basic_file_sink.h>

static PRISMA_UI_API::IVPrismaUI3* g_api  = nullptr;
static PrismaView                   g_view = 0;
static bool                         g_visible = false;

static void OnDomReady(PrismaView /*view*/)
{
    logger::info("MyPlugin: DOM ready");
}

static void Toggle()
{
    if (!g_api || !g_api->IsValid(g_view)) return;
    g_visible = !g_visible;
    if (g_visible) {
        g_api->Show(g_view);
        g_api->Focus(g_view, /*pauseGame=*/false);
    } else {
        g_api->Unfocus(g_view);
        g_api->Hide(g_view);
    }
}

static void F4SEMessageHandler(F4SE::MessagingInterface::Message* msg)
{
    if (!msg) return;
    switch (msg->type) {
    case F4SE::MessagingInterface::kGameDataReady:
        g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI3>();
        if (!g_api) { logger::error("MyPlugin: PrismaUI V3 not found"); return; }
        KeyHandler::RegisterSink();
        [[maybe_unused]] auto _ = KeyHandler::GetSingleton()->Register(
            static_cast<uint32_t>(RE::BS_BUTTON_CODE::kF4), KeyEventType::KEY_DOWN, Toggle);
        break;
    case F4SE::MessagingInterface::kPostLoadGame:
    case F4SE::MessagingInterface::kNewGame:
        if (g_api && g_view == 0) {
            g_view = g_api->CreateView("MyPlugin_F4/index.html", OnDomReady);
            g_api->Hide(g_view);   // views start visible - hide until the player opens it
            g_api->RegisterConsoleCallback(g_view,
                [](PrismaView, PRISMA_UI_API::ConsoleMessageLevel, const char* msg) {
                    logger::info("[JS] {}", msg);
                });
        }
        break;
    }
}

F4SE_PLUGIN_LOAD(const F4SE::LoadInterface* a_intfc)
{
    F4SE::Init(a_intfc);
    const auto* messaging = F4SE::GetMessagingInterface();
    if (!messaging) return false;
    messaging->RegisterListener(F4SEMessageHandler);
    return true;
}
```

Press **F4** in-game to toggle the view.

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:100vw; height:100vh; background:rgba(0,0,0,0.75);
    display:flex; align-items:center; justify-content:center;
    font-family:'Courier New',monospace; color:#00ff41;
  }
  .panel {
    background:#000; border:1px solid #00661a;
    padding:32px 40px; text-align:center;
  }
  h1 { font-size:20px; letter-spacing:3px; margin-bottom:16px; }
  p  { font-size:12px; color:#009921; }
</style>
</head>
<body>
<div class="panel">
  <h1 id="title">MY MENU</h1>
  <p id="msg">Press the key to close</p>
</div>
<script>
  console.log('mymenu loaded');
</script>
</body>
</html>
```

---

## Load Order

PrismaUI_F4 must be loaded before your plugin. Request the API during F4SE's `kGameDataReady`
message, which fires after all plugins are initialized - not to be confused with the separate
`kPostLoadGame`/`kNewGame` messages used in `main.cpp` above, which are savegame-load events that
fire much later and are when you actually call `CreateView`.

---

## Debugging

Logs: `%USERPROFILE%\Documents\My Games\Fallout4\F4SE\MyPlugin_F4.log`

Register `RegisterConsoleCallback` to see JS `console.*` output in your log. This is the primary JS debugging tool.

For DOM inspection during development:

```cpp
#ifdef PRISMA_DEBUG
api->CreateInspectorView(g_view);
api->SetInspectorBounds(g_view, 10.0f, 10.0f, 900, 560);
api->SetInspectorVisibility(g_view, true);
#endif
```

Remove all `CreateInspectorView` calls before releasing.

---

## Troubleshooting

**`xmake` isn't recognized as a command.** Close and reopen your terminal (or restart your
machine) after installing xmake - its installer updates PATH, which already-open terminals don't
see.

**`xmake f -c` fails looking for CommonLibF4 / complains about a missing submodule.** You either
haven't run `git submodule add`/`git submodule update --init` yet (see the `xmake.lua` section
above), or you cloned an existing project without its submodules. From the project root:
```
git submodule update --init --recursive
```

**Build fails with a compiler/toolset error, or can't find `cl.exe`/MSVC.** Visual Studio 2022's
"Desktop development with C++" workload isn't installed, or xmake picked a different compiler.
Open the Visual Studio Installer, Modify your VS2022 install, and confirm that workload is
checked. Then close and reopen your terminal.

**The DLL builds, but nothing happens in-game and there's no log file at all** under
`Documents\My Games\Fallout4\F4SE\<YourPluginName>.log` - F4SE never loaded your plugin. Check:
- The DLL is actually at `<mod folder>\F4SE\plugins\<YourPluginName>.dll` (not `Plugins`, not the
  mod's root folder - MO2 is case-insensitive here but the path itself has to be right).
- The mod is enabled in MO2's left panel.
- F4SE itself is installed and you're launching the game through its loader, not vanilla
  `Fallout4.exe` directly.
- Check `Documents\My Games\Fallout4\F4SE\f4se.log` (F4SE's own log, not your plugin's) for a
  line naming your DLL - if F4SE tried and failed to load it, the reason is usually there.

**Your log file exists and shows your plugin loading, but the view never appears in-game.**
- Confirm `PrismaUI_F4.log` (also under `Documents\My Games\Fallout4\F4SE\`) shows PrismaUI_F4
  itself loaded - if that log is missing, the framework isn't installed/enabled.
- Confirm your view's HTML actually deployed to
  `<mod folder>\PrismaUI_F4\views\<YourPluginName>\index.html` (or whatever path you passed to
  `CreateView`) - `CreateView` fails silently (returns `0`) if the file isn't found, and
  `RequestPluginAPI` returning null (logged as an error if you check for it, per the example
  above) means PrismaUI_F4 wasn't found at all.
- Double-check the hotkey code you registered - `RE::BS_BUTTON_CODE::kF4` is F4; if you copied
  this guide's `main.cpp` verbatim, that's the key to press.
