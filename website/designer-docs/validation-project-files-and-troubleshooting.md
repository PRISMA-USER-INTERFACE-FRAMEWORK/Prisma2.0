---
id: validation-project-files-and-troubleshooting
title: Validation, Project Files, and Troubleshooting
sidebar_position: 8
description: Save reusable projects, understand validation findings, and diagnose common issues.
---

# Validation, Project Files, and Troubleshooting

Prisma Designer validates the project on canvas mutations and reports findings
that could make an export silently wrong. Findings are visible and actionable,
but validation does not prevent you from exporting. A broken export that you
can inspect is easier to diagnose than a tool that refuses to run.

## Save a project

Use **Save** or **Ctrl+S** to download a `.prisma` project. Older releases may
also open a legacy `.json` single-view project. A project stores the canvas,
elements, properties, themes, bindings, and visual scripting graph so you can
reopen and continue editing it.

Use **Open** to load the project and **New** to clear the current canvas after
the confirmation prompt. Keep the project file as the source of truth; the
exported HTML is the runtime artifact and is not intended to be the editable
project format.

## Validation findings

Run through the validation panel before shipping. Pay special attention to:

- duplicate generated names or listener names
- elements placed outside the intended canvas
- invalid or incomplete visual scripting connections
- missing values needed by a widget or binding
- a solid background when transparency was intended

Validation reports problems instead of silently rewriting the export. Fix the
source element or graph node, then inspect the finding again before downloading
the HTML.

## Common issues

### The exported view is blank

Check the path first. The file must be under
`Data/PrismaUI_F4/views/Interface/` and the string passed to `CreateView` must
be relative to the views root, such as
`Interface/MyPlugin/menu.html`. Confirm that the PrismaUI framework is loaded
and that the view is created after `kPostLoadGame` or `kNewGame`.

### Buttons do not do anything

The exported HTML provides a browser stub, not a game callback. Confirm that
the listener name in the Button properties exactly matches the name passed to
`RegisterJSListener` in your plugin. Register the listener from the DOM-ready
callback and test the exported view from the plugin, not only from Bridge
preview.

### The game world is hidden behind a dark rectangle

Set the canvas background to `transparent` in Canvas Settings and export again.
The canvas background is copied into the HTML body style.

### The Bridge preview will not connect

Confirm Fallout 4 is running with PrismaUI F4 and PrismaDesignerBridge enabled.
The browser editor still works without the Bridge, so use export and plugin
loading to continue checking the design while connection issues are resolved.

### A preset appears in the wrong place

The **Main Menu**, **Tactical HUD**, and **Inventory Screen** presets use literal
full-canvas coordinates. Start with a new canvas at the preset's target
resolution. Smaller component groups center around the current cursor position.

## Working on Prisma Designer

For development of the Designer itself, use its provided server rather than
`python -m http.server`:

```bash
python3 tools/dev-server.py
```

The repository includes tests for logic compilation, export scope, generated
names, and presets. Run them from the Prisma Designer directory:

```bash
node tests/logic-compile.test.js
node tests/export-scope.test.js
node tests/generated-names.test.js
node tests/presets.test.js
```

The Designer is a static application, so normal users do not need Node, Python,
or a build step. Return to [Getting Started](./getting-started) when you are
ready to create another view.
