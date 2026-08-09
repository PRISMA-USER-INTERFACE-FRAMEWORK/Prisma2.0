---
title: Tree & Graph View
---

# Tree & Graph View

Every open file gives you two ways to see the same data.

## Tree view

Lists every object in the file by nesting, showing:

- The Havok class of each row (`hkbClipGenerator`, `hkbStateMachine`, `hkbBlenderGenerator`, and
  so on).
- The animation a clip node points at, if it has one.
- The object's file offset, for when you need to cross-reference against raw bytes.

## Graph view

The same objects, laid out as a node canvas instead of a list:

- Nodes are arranged in columns by depth from the root, so you can see how far something is from
  the top of the graph at a glance.
- Edges are drawn from the file's real reference fields and labelled with the field that owns
  them. An edge always tells you *why* it exists, not just that two nodes are connected.
- Nodes are coloured by class family, so states, generators, and modifiers are visually distinct.
- Clip nodes show their animation path and any non-default playback speed directly on the node,
  so you don't need to open the properties panel just to see what a clip plays.

## Finding what you need

Type into the filter box to narrow the tree or graph by name, class, or animation. This is
useful once you're working in a file with hundreds of objects.

## Highlighting one state's paths

Right-click a node and choose "Highlight the paths of..." to see just that node's routes through
the graph. Every unrelated wire and node drops to half opacity. This is the difference between
a readable graph and a few hundred overlapping wires when you're trying to trace one specific
state machine transition. Press Escape, or right-click again, to clear it.

Once you've found the node you want to change, head to [Editing Nodes](editing-nodes).
