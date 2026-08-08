---
id: quick-start
title: Quick Start
sidebar_label: Quick Start
sidebar_position: 2
---

# Quick Start

This guide takes you from "F4SE plugin that compiles" to "panel on screen" in six steps. End state: pressing F6 in-game opens a dark panel that says **Hello from PrismaUI** with an **[X]** button that closes it and unpauses the game.

Prerequisites:
- An F4SE plugin that already compiles (xmake or cmake, doesn't matter)
- PrismaUI F4 installed and active in your MO2 modlist
- Basic C++ familiarity

---

## Step 1 — Copy the API header

PrismaUI has **no link-time dependency**. There is nothing to add to your `xmake.lua` or `CMakeLists.txt`. The entire integration surface is one header you drop into your project.

**Where to get it:**
- From the framework source: `Framework/PrismaUI_F4_OG/src/PrismaUI_F4_API.h`
- Or from the Nexus download: inside the `SDK/` folder in the optional files archive

**What to do:**

1. Copy `PrismaUI_F4_API.h` into your plugin's `src/` folder.
2. Add one include to your main `.cpp`:

```cpp
#include "PrismaUI_F4_API.h"
```

That's it. No linker flags. No additional libraries. The header resolves the API at runtime via `GetProcAddress` against the running `PrismaUI_F4.dll`.

---

## Step 2 — Request the API

Declare two globals at the top of your main `.cpp`:

```cpp
static PRISMA_UI_API::IVPrismaUI2* g_api  = nullptr;
static PrismaView                   g_view = 0;
```

Then, in your F4SE message handler, acquire the API pointer on `kGameDataReady`:

```cpp
static void F4SEMessageHandler(F4SE::MessagingInterface::Message* msg)
{
    switch (msg->type) {

    case F4SE::MessagingInterface::kGameDataReady:
        g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
        if (!g_api) {
            REX::CRITICAL("PrismaUI_F4 not found — is it installed and active in MO2?");
        }
        break;

    // ... other cases below
    }
}
```

**Why `kGameDataReady` and not `F4SEPlugin_Load`?**
PrismaUI_F4.dll may not be loaded yet when `F4SEPlugin_Load` runs — F4SE loads plugins in an undefined order. By `kGameDataReady`, all F4SE plugins are fully initialised and `GetModuleHandleW("PrismaUI_F4.dll")` is guaranteed to succeed. Calling `RequestPluginAPI` earlier returns null every time.

---

## Step 3 — Create the view

Add handlers for `kPostLoadGame` and `kNewGame` in the same message handler. Create the view there, register your close listener inside `OnDomReady`, then hide the view immediately:

```cpp
    case F4SE::MessagingInterface::kPostLoadGame:
    case F4SE::MessagingInterface::kNewGame:
        if (g_api && (g_view == 0 || !g_api->IsValid(g_view))) {
            g_view = g_api->CreateView("Interface/MyMod/hello.html",
                [](PrismaView v) {
                    // OnDomReady — the HTML is loaded and JS is running.
                    // Register listeners HERE, not before.
                    g_api->RegisterJSListener(v, "close", [](const char*) {
                        g_api->Unfocus(g_view);
                        g_api->Hide(g_view);
                    });
                });
            g_api->Hide(g_view);  // Views start visible — hide immediately.
        }
        break;
```

Key points:
- **`RegisterJSListener` must be called inside `OnDomReady`**, not before it. The DOM doesn't exist yet before that callback fires.
- The `"close"` string is the JS function name. Your HTML will call `window.close()` to trigger it.
- `Hide` after `CreateView` is not optional — views are visible by default, so if you skip this your panel will flash on screen every time a save loads.
- The `g_view == 0 || !g_api->IsValid(g_view)` guard prevents creating a second view if the player loads another save in the same session.

---

## Step 4 — Toggle it open with F6

Add a toggle function and wire it to F6. The cleanest approach is the `BSInputEventUser` pattern from the example plugin (copy `keyhandler/` from `example-f4se-plugin/src/` if you want the full helper), but a direct approach also works. Here is the toggle function:

```cpp
static void TogglePanel()
{
    if (!g_api || !g_api->IsValid(g_view)) return;

    if (g_api->IsHidden(g_view)) {
        g_api->Show(g_view);
        g_api->Focus(g_view, /*pauseGame=*/true);
    } else {
        g_api->Unfocus(g_view);
        g_api->Hide(g_view);
    }
}
```

Wire it to F6 in `kGameDataReady` using the `KeyHandler` from the example plugin:

```cpp
    case F4SE::MessagingInterface::kGameDataReady:
        g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
        if (!g_api) { REX::CRITICAL("PrismaUI not found"); break; }

        KeyHandler::RegisterSink();
        KeyHandler::GetSingleton()->Register(
            0x40,  // F6 DirectInput scan code
            KeyEventType::KEY_DOWN,
            TogglePanel);
        break;
```

`Focus(view, true)` pauses the game while the panel is open. When the [X] button fires the `"close"` listener, `Unfocus` releases the pause and returns control to the player.

---

## Step 5 — The HTML file

Create this file at:

```
Data/PrismaUI_F4/views/Interface/MyMod/hello.html
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: sans-serif;
    }

    .panel {
      background: #1a1a1a;
      color: #ffffff;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 32px 40px;
      min-width: 320px;
      text-align: center;
      position: relative;
    }

    .panel h1 {
      font-size: 1.4rem;
      font-weight: 400;
      letter-spacing: 0.05em;
    }

    .close-btn {
      position: absolute;
      top: 10px;
      right: 14px;
      background: none;
      border: none;
      color: #aaa;
      font-size: 1.1rem;
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover { color: #fff; }
  </style>
</head>
<body>
  <div class="panel">
    <button class="close-btn" onclick="window.close()">&#x2715;</button>
    <h1>Hello from PrismaUI</h1>
  </div>
</body>
</html>
```

`window.close()` calls the JS listener you registered in Step 3. No external scripts, no CDN fonts — everything is inline so it loads instantly.

---

## Step 6 — Deploy and test

1. **Copy the HTML** to your MO2 mod folder for your plugin:

   ```
   <MO2>\mods\<YourMod>\Data\PrismaUI_F4\views\Interface\MyMod\hello.html
   ```

2. **Build your DLL** and deploy it as usual.

3. **Load a save.** Press **F6**.

Expected result:
- The panel appears in the centre of the screen.
- The game pauses (your cursor should be active).
- Clicking **[X]** closes the panel and unpauses the game.
- Pressing F6 again reopens it.

---

:::info Troubleshooting

**Nothing appears when I press F6**
Open `%USERPROFILE%\Documents\My Games\Fallout4\F4SE\PrismaUI_F4.log`. Look for lines with `[error]` or `failed`. Common causes: the HTML path passed to `CreateView` doesn't match where you put the file; the MO2 mod is not active; PrismaUI_F4 is not installed.

**Panel opens but [X] does nothing**
The JS function name in `RegisterJSListener` and the function called in HTML must match exactly. You registered `"close"` in C++, so the HTML must call `window.close()`. If you renamed one but not the other, the click silently goes nowhere.

**Game crashes on load (or on F6)**
`RequestPluginAPI` returned null and you didn't check it. `g_api` is null, so the first call through it crashes. Confirm PrismaUI_F4.dll is in `F4SE/plugins/` and shows up in the F4SE log as loaded. Also confirm you are calling `RequestPluginAPI` on `kGameDataReady`, not in `F4SEPlugin_Load`.

**Panel appears but the game does not pause**
`Focus` was called without `pauseGame = true`, or it was called before the view was shown. Call `Show` before `Focus`.

:::

---

## What's next

- **Send data to your panel:** call `g_api->InteropCall(g_view, "fnName", jsonString)` from C++ to call `window.fnName(arg)` in JS. Good for updating values while the panel is open.
- **Receive data from JS:** add more `RegisterJSListener` calls inside `OnDomReady` for each event your HTML needs to send back.
- **Console debugging:** register a `ConsoleMessageCallback` (see `IVPrismaUI2::RegisterConsoleCallback`) to mirror JS `console.log` output into `PrismaUI_F4.log`.
- **Full API reference:** see [API Reference](api/index.md) for every method, and [View Lifecycle](view-lifecycle.md) for timing rules when doing more complex work.
