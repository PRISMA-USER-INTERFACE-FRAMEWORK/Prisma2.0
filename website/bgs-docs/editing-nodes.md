---
title: Editing Nodes
---

# Editing Nodes

## The properties panel

Click any node, in either the Tree or Graph view, and every field it has appears in the
properties panel beside the canvas: one text box per field, for animation name, mode, playback
speed, crop times, start time, flags, weight, ids, all of it. Double-click a node to jump straight
into its first field.

Type a new value, tab out, and the change is staged. A field the file leaves empty, like an
unset `animationBundleName`, is shown as an empty box rather than hidden, so you can give it a
value if you need to.

## Adding nodes

1. Select an existing node in the graph. This determines what the new node attaches to.
2. Type a name for the new node.
3. Press one of the add buttons (clip, blender, modifier, or selector). The toolbar tells you
   which slot on the selected node the new object will fill before you press it.

If nothing is selected, the new node is created unattached rather than silently discarded.
Unattached nodes get their own column so they don't disappear on you.

## Templates

Select a node (and everything it owns) and choose "Save as template" to reuse that shape in
another file later. A template carries the event and variable names of the file it came from, so
when you go to apply it elsewhere, the tool tells you whether it actually fits the file you have
open before you commit to anything.

## Deleting nodes

Delete refuses to remove a node while anything else still points at it, and tells you what's
still referencing it, so you can't accidentally break a reference chain without knowing.

Once you've made the changes you want, [Saving & Validating](saving-and-validating) covers how to
check and write them back to `.hkx`.
