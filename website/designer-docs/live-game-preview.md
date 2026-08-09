---
id: live-game-preview
title: Live Game Preview with PrismaDesignerBridge
sidebar_position: 7
description: Preview a Prisma Designer layout inside a running Fallout 4 game.
---

# Live Game Preview with PrismaDesignerBridge

PrismaDesignerBridge is an optional F4SE companion plugin. It connects the
browser editor to a running Fallout 4 game so you can preview the current view
without restarting the game.

## Setup

1. Build or download the Bridge from the `PrismaDesignerBridge/` directory in
   the Prisma Designer repository.
2. Install the Bridge DLL as an F4SE plugin in the Fallout 4 Data directory.
3. Start Fallout 4 with PrismaUI F4 and the Bridge enabled.
4. Open Prisma Designer in Chrome or Edge.
5. Click **Game** or **Send to Game** in the top toolbar.

The editor connects automatically when the Bridge's WebSocket endpoint is
available. The game-state feed can populate bindings such as HP, AP, Rads,
Level, and Caps while the preview is open.

## What the preview verifies

The Bridge creates or replaces a PrismaUI view and sends the current exported
layout to it. This is useful for checking:

- screen resolution and scale
- element positions and z-order
- colors, fonts, borders, and transparency
- canvas rendering for Compass and Stat Bar components
- live values supplied through supported bindings

Click **Send to Game** after editing to hot-reload the current design without
relaunching Fallout 4.

## Important limitation

The Bridge preview verifies render and layout only. The Bridge does not register
your plugin's C++ listeners. A button in the preview can call the exported stub,
but it will stop there unless your own plugin has registered that listener.

To verify real interaction, export the view, place it under your plugin's
`Data/PrismaUI_F4/views/Interface/` directory, load it with `CreateView`, and
register the listeners from the **C++ Code** tab. This is the authoritative
check for game-side behavior.

If the Bridge cannot connect, continue working in the browser. The editor's
normal export workflow does not depend on a running game. See [Validation,
Project Files, and Troubleshooting](./validation-project-files-and-troubleshooting)
for diagnostic steps.
