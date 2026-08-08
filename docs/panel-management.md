---
id: panel-management
title: Panel Management
sidebar_label: Panel Management
sidebar_position: 12
---

Panel management answers the question every multi-mod setup eventually hits: *"Is another Prisma UI
already open? Should I hold off?"*

Requires **IVPrismaUI10** (`RequestPluginAPI<IVPrismaUI10>()`).

---

## ViewRole

Every view has a role that tells the framework what kind of UI it is.

```cpp
enum class ViewRole : uint32_t {
    kUnspecified = 0,  // default, never counted as an interactive panel
    kWidget = 1,       // passive always-on overlay (HUD element); never blocks anything
    kPanel = 2,        // interactive panel that occupies the screen and takes input
};
```

| Role | Use for | Counts as "in the way"? |
|------|---------|------------------------|
| `kUnspecified` | Anything you haven't declared yet | No, never |
| `kWidget` | HUD overlays, compass, health bars | No, passive by definition |
| `kPanel` | Inventory, crafting, terminal, MCM | Yes, if visible or focused |

**Declare a role on any view that takes input.** A view that calls `Focus()` without a declared role
logs a one-time warning and is invisible to every other plugin's `IsAnyPanelVisible` check.

---

## Declaring and reading roles

```cpp
// In OnDomReady or immediately after CreateView:
g_api->SetViewRole(g_view, PRISMA_UI_API::ViewRole::kPanel);

// Read it back:
auto role = g_api->GetViewRole(g_view);
```

HUD views that are always visible but never focused:

```cpp
g_api->SetViewRole(g_hud, PRISMA_UI_API::ViewRole::kWidget);
```

---

## `IsAnyPanelVisible`

Returns `true` if any view **other than `ignoreView`** is currently focused or is declared `kPanel`
and not hidden. Passive `kWidget` views and undeclared views never contribute.

```cpp
// Before opening your panel, don't open over another mod's panel.
if (g_api->IsAnyPanelVisible(g_view)) {
    return;  // another interactive panel is already up
}
g_api->Show(g_view);
g_api->Focus(g_view, true, false);
```

Pass `0` for `ignoreView` to include every view:

```cpp
// Is anything at all open?
bool busy = g_api->IsAnyPanelVisible(0);
```

---

## `GetFocusedView`

Returns the view that currently holds framework focus, or `0` if no view is focused.
`HasAnyActiveFocus()` (V1) tells you yes/no; `GetFocusedView()` tells you which.

```cpp
PrismaView focused = g_api->GetFocusedView();
if (focused != 0 && focused != g_my_view) {
    logger::info("another plugin has focus: {}", focused);
}
```

Useful for debugging focus order and for mods that need to close a specific view before opening
their own.

---

## Complete example: cooperative panel open

```cpp
static PRISMA_UI_API::IVPrismaUI10* g_api = nullptr;
static PrismaView g_view = 0;

// kGameDataReady
g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI10>();

// kPostLoadGame / kNewGame
if (g_api && g_view == 0) {
    g_view = g_api->CreateView("Interface/MyMod/panel.html", OnDomReady);
    g_api->SetViewRole(g_view, PRISMA_UI_API::ViewRole::kPanel);
    g_api->SetViewOwnsEscape(g_view, true);   // V9 Escape handled in JS
    g_api->Hide(g_view);
}

// Hotkey / game event, open the panel
void OpenPanel() {
    if (!g_api || !g_api->IsValid(g_view)) return;

    // Yield to any other plugin that's already showing a panel.
    if (g_api->IsAnyPanelVisible(g_view)) {
        logger::info("deferring, another panel is visible");
        return;
    }

    g_api->Show(g_view);
    g_api->Focus(g_view, /*pauseGame=*/true, /*disableFocusMenu=*/false);
}

// JS calls window.onClose → this listener
void OnClose(const char*) {
    g_api->Unfocus(g_view);
    g_api->Hide(g_view);
}
```

---

## Why undeclared views are invisible to `IsAnyPanelVisible`

`EnumerateViews` reports every view, including passive HUD widgets that are always on screen. A
naive "is any view visible and not hidden?" check would return `true` permanently on any setup
running a HUD mod, making `IsAnyPanelVisible` useless. Declaring `kWidget` or `kPanel` is the
opt-in that lets the framework distinguish "overlay that lives in the background" from "menu that
blocks the player."

If you forget to declare a role on a panel, `IsAnyPanelVisible` returns `false` while your panel
is open. Other mods then open over it because they think nothing is blocking. The framework logs a
warning to `PrismaUI_F4.log` the first time a view calls `Focus()` while still `kUnspecified`.
