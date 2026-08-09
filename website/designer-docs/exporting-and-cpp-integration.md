---
id: exporting-and-cpp-integration
title: Exporting HTML and C++ Integration
sidebar_position: 6
description: Export a self-contained PrismaUI F4 view and load it from an F4SE plugin.
---

# Exporting HTML and C++ Integration

Click **Export HTML** to open the generated view. You can copy it to the
clipboard or click **Download** to save `prisma-view.html`. **Export All** writes
every view in the current project.

## What the export contains

The output is a single HTML file compatible with PrismaUI F4's CEF renderer:

- Element positions are absolute pixel coordinates.
- Colors, fonts, borders, and shadows are inline styles.
- Images are embedded as base64 data URLs.
- Compass and Stat Bar elements include their own canvas and draw functions.
- Buttons with listener names include `data-prisma-call` metadata and JavaScript
  stubs.
- Visual scripting is compiled into a script block in the same file.

There is no separate CSS, JavaScript, image, or Node runtime dependency for an
exported view.

## Install the view in a mod

Place the downloaded file under the PrismaUI views directory. For example:

```text
Data/PrismaUI_F4/views/Interface/MyPlugin/menu.html
```

Use the path relative to the views root when creating the view:

```cpp
PrismaView view = api->CreateView(
    "Interface/MyPlugin/menu.html",
    [api](PrismaView v) {
        api->RegisterJSListener(v, "onCloseMenu", [api, v](const char*) {
            api->Unfocus(v);
            api->Hide(v);
        });
        api->Invoke(v, "init()");
    });

api->Hide(view);
```

The important lifecycle rule is to create the view on `kPostLoadGame` or
`kNewGame`, register listeners in the DOM-ready callback, and invoke JavaScript
only after the DOM is ready.

## Button listeners

For every listener name set in the Designer, register the same name in C++:

```cpp
api->RegisterJSListener(view, "onConfirm", [](const char* payload) {
    // Read payload and update game state here.
});
```

The exported page only provides the browser-side stub. It cannot access game
state on its own. Your plugin owns the listener implementation.

## Transparency

Set the Canvas Settings background to `transparent` when the view should float
over the game world. A solid canvas background creates a full-screen opaque
layer, even if the visible components occupy only a small part of the design.

For live game rendering and the Bridge's exact limitations, see [Live Game
Preview with PrismaDesignerBridge](./live-game-preview).
