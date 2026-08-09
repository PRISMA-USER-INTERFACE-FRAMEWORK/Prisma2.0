---
title: Saving & Validating
---

# Saving & Validating

## Check project

Run "Check project" before saving. It walks the whole behaviour and flags problems, including the
one that matters most: **a state with no generator**, which crashes the game on load rather than
on entering the state. The crash happens during an unconditional node walk while the graph
loads, not when the player reaches that part of the state machine. Affected states are named
directly in the results so you know exactly what to fix, and clicking a result jumps you straight
to the node on the canvas.

Other checks include unreachable-state warnings (a state nothing transitions into, sometimes
legitimate if something external sets it, so this is a warning, not a hard error) and repack
comparisons that catch drift between what you changed and what actually got written.

## Saving

Save writes your changes back to `.hkx` and keeps your original file as a `.bak` alongside it.
Most edits, such as changing a value, renaming something, or growing an array, are written
directly into the file's own bytes or appended to the end without moving anything that's already
there. Only a change that adds or removes objects, or lengthens an array of text, goes through a
repack step. Before that step overwrites anything, it reads back what it just produced and counts
the objects in it. If anything went missing on the way through, nothing is written, and you're
told what was lost instead of ending up with a silently broken file.

## Current status

Field-level edits are confirmed working in the game. A garage door whose sequence generator was
retargeted and given new timing values, edited entirely through this tool, sat open in-game with
no issues. **Structural edits, such as adding a state, removing one, or retargeting a transition,
are validated against the file format and Havok's own tooling, but have not yet been confirmed
loading in Fallout 4 itself.** Keep the `.bak` file, and treat structural changes as beta until
you've tested them in your own game.
