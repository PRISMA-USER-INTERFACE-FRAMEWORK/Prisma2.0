---
id: what-is-prismaui
title: What is PrismaUI F4?
sidebar_label: What is PrismaUI F4?
sidebar_position: 1
---

# What is PrismaUI F4?

**PrismaUI F4 lets you build Fallout 4 mod UIs using HTML, CSS, and JavaScript, the same tools you'd use to build a website, and displays them in-game as a full-screen or windowed overlay.**

That's the whole idea. If you've ever opened DevTools in a browser, you already understand the mental model.

---

## Why does this exist? The Scaleform problem

Fallout 4's built-in menus (the Pip-Boy, inventory, terminal, everything) use **Scaleform**, a proprietary renderer based on Adobe Flash. Modifying those menus means decompiling SWF files with specialized tools and writing **ActionScript 2**, a language that was effectively dead by 2010 and has no modern tooling, no documentation community, and no future.

Most mod authors who tried it gave up. The barrier isn't just technical. It's that you have to learn a dead tech stack just to move a button three pixels to the left.

PrismaUI takes a different approach: it brings **Chromium** (CEF 147, the same browser engine inside VS Code, Electron, and Spotify) into Fallout 4 as a separate rendering layer. Your plugin's UI is just an HTML file that Chromium renders. You never touch Scaleform or ActionScript at all.

:::tip You already know enough
If you've built a simple website (even a static one) you have the front-end skills to build a PrismaUI mod. React, Vue, Svelte, Tailwind, vanilla JS, plain CSS: anything that ships as static files works. No proprietary SDK. No Flash. No dead languages.
:::

---

## How it works in three steps

1. **Write an HTML file** and drop it in your mod's `Data/PrismaUI_F4/views/` folder. Style it with CSS, wire up logic with JavaScript. Use whatever front-end tools you like.

2. **Load it from C++.** Your F4SE plugin calls `CreateView("my-ui.html")`. A hidden Chromium subprocess renders that page into a texture in the background, invisible for now.

3. **Show it when you need it.** Calling `Show()` + `Focus()` makes the texture appear on screen and routes keyboard and mouse input to your HTML. The framework handles cursor visibility, input blocking, and game pause automatically.

That's it. The HTML-to-screen pipeline is Chromium's problem. Your job is to write a web page and decide when it appears.

---

## What you get out of the box

**Working example plugin.** A complete, buildable F4SE plugin with all the C++ boilerplate already written. Clone it, build it, and you have a working UI in-game immediately. The example ships four tabs covering the Papyrus bridge, C++ bridge, event logging, and a full tutorial. Start from this instead of from scratch.

**Full modern web platform.** ES2020+ JavaScript, CSS Grid and Flexbox, Web Audio, WebGL: the complete Chromium feature set. You're not working in a sandbox; you get a real browser engine.

**C++ and JS bridge.** Call JavaScript functions from your C++ plugin, and register C++ callbacks that your JavaScript can fire. Two directions, low overhead, works across the thread boundary.

```cpp
// C++ calling into JS
g_api->InteropCall(view, "updateHealth", jsonPayload);

// JS calling into C++
g_api->RegisterJSListener(view, "onClose", [](const char*) {
    g_api->Hide(g_view);
});
```

**Papyrus bridge.** Read and write Papyrus globals, script properties, and actor values directly from JavaScript. No C++ glue required for simple data reads.

**3D model rendering.** Display any in-game item's 3D mesh inside a view. Useful for inventory previews, crafting UIs, or anything that needs to show the player what they're looking at.

**Vanilla UI suppression.** Hide specific HUD elements or vanilla menus to replace them cleanly with your own. No z-fighting with the original UI.

**Controller button prompts.** Get the correct button art for whatever input device the player is using (Xbox, PlayStation, or keyboard) so your UI fits the current control scheme.

**Input management.** When you call `Focus()`, the framework automatically shows the cursor, blocks game input from reaching the world, and pauses the game if you ask it to. You don't have to manage any of that yourself.

---

## What it is NOT

**It does not edit Scaleform SWF files.** PrismaUI renders on a separate layer above the game. However, it can suppress or hide specific vanilla HUD widgets and menus via the API, so you can replace them with your own HTML UI without touching a SWF. The suppression is done at runtime, not by patching game assets.

**It is not a visual editor.** You write HTML and CSS directly. There's a companion tool called **PrismaDesigner** that lets you preview your layout in real time without launching the game, but your source files are still plain code.

**It does not require special build tools for your HTML.** A text editor is enough. Drop your `.html`, `.css`, and `.js` files in the right folder and they work. No bundler required (though you can use one if you want).

---

## Who should use it

- Mod authors who want a custom inventory, crafting screen, map overlay, journal, or HUD replacement: essentially anything with a significant UI component.
- Anyone who already knows web development and wants to apply those skills to Fallout 4 modding without learning a dead tech stack.
- Authors who attempted Scaleform modding, got frustrated, and moved on. This is the alternative they were looking for.

---

## What you need to know coming in

You need two things, and neither requires deep expertise:

- **Basic C++.** Enough to write a simple F4SE plugin. If you can register a key listener or hook a game event, you have everything you need on the C++ side.
- **Basic HTML/CSS/JS.** If you've made a simple web page, you know enough to start.

You do **not** need to know Scaleform, ActionScript, Flash, or anything Flash-adjacent. That's the point.

---

## Ready?

[Getting Started](getting-started) walks you through creating your first PrismaUI view from scratch, from setting up your F4SE plugin to showing a working HTML page in-game.
