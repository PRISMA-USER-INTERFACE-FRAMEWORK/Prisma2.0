---
title: Symbols & Variables
---

# Symbols & Variables

## The Symbols tab

Lists every variable and event in the behaviour, with its index, type, initial value, and
everywhere it's referenced. From here you can:

- **Add** a new variable or event.
- **Rename** an existing one.
- **Retype** or change a variable's initial value.
- **Bound** a variable, giving it a min and max (see below).

None of this needs a Java runtime. Names are written by appending to the file's existing name
table rather than rewriting it, which works even on files where the array was already close to
full.

## Setting bounds

"Set bounds" gives a variable a minimum and maximum, extending the file's `variableBounds` array
to reach it if the array stops short, which it usually does. Of the 531 vanilla behaviour files,
that array is empty in 224 of them and shorter than the variable list in another 87. The entries
added in between are written as `0` to `0`, which is exactly what the file already means by "no
bound," so extending the array doesn't change the meaning of any variable that already had an
entry.

## Removing a symbol

Removing a variable or event renumbers every reference to symbols above it automatically, so
indices stay consistent throughout the file.

## Inspecting event usage

Expand an event in the Symbols tab to see what the file actually does with it: where it's raised,
where it's listened for, or where it's written with no established direction, each entry naming
the class and member responsible.

## The Chain tab

Shows the full chain for the open file: project to character to behaviour to skeleton to
animations, including what's missing along the way and the skeleton's bone list. Useful for
confirming a behaviour actually has everything it needs before you start editing it.

Ready to write your changes back to disk? See [Saving & Validating](saving-and-validating).
