---
title: Getting Started
---

# Getting Started

Behavior Graph Studio is a standalone desktop editor. It runs outside Fallout 4, on your PC.
You use it to open and edit the game's Havok behaviour files, then load the result in-game the
same way you would any other mod.

## Requirements

- Windows 64-bit or Linux x64 (both are supported natively, the same build works on either).
- No separate installation of Havok Content Tools, and no Java for the majority of edits
  (changing values, renaming things, growing arrays). Java is only needed for structural edits
  that add or remove objects, and the tool tells you if it can't find a Java runtime when that
  matters.

## Download and run

1. Download the latest release from [Nexus Mods](https://www.nexusmods.com/fallout4/mods/107691)
   or grab a build from [GitHub](https://github.com/NomadsReach/BehaviorGraphStudio).
2. Extract it anywhere on disk. It's a self-contained build, not something you install into your
   Fallout 4 folder.
3. Run `BehaviourGraphStudio.exe` (Windows) or the Linux binary. No installer, no setup wizard.

## Opening a file

You have two ways to open a behaviour:

- **From disk**: point it at any `.hkx` behaviour, character, or project file you already have
  extracted (for example, one from a mod you're building).
- **From archive**: use "From archive..." to read a file straight out of a Bethesda `.ba2`
  without unpacking it yourself. Every vanilla behaviour ships inside
  `Fallout4 - Animations.ba2`. Type a few words like "dogmeat behavior" to filter its index down
  to what you want. A file opened this way is a **read-only** copy in a temporary folder, so Save
  is disabled, and the window tells you where the copy landed if you want to move it somewhere of
  your own to actually edit it.

Once a file is open, head to [Tree & Graph View](tree-and-graph-view) to see what's inside it.
