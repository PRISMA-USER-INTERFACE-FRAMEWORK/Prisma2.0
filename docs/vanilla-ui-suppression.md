---
id: vanilla-ui-suppression
title: Vanilla UI Suppression
sidebar_label: Vanilla UI Suppression
sidebar_position: 8
---

# Vanilla UI Suppression

PrismaUI F4 exposes APIs to hide or close vanilla Scaleform menus, suppress individual HUD
widgets, and intercept the activate-choice button strip ("E) Take / Field Dress / ...").
These are the tools for making your replacement UI take over from the game's own screens.

---

## Menu suppression vs. menu closing

There are three distinct operations and they are not interchangeable:

| Method | What it does | Menu fires events? | Persistent? |
|---|---|---|---|
| `SuppressVanillaMenu` | Hides the Scaleform movie | Yes | Yes, survives close/reopen |
| `CloseVanillaMenu` | Sends `kHide`, actually closes the menu | Yes (close event fires) | No |
| `SuppressVanillaMenuIf` | Registers a predicate; if it returns true when the menu opens, force-closes it | Yes (open event fires, then close fires) | While predicate is registered |

**Suppress** means the Scaleform movie is invisible but the menu is still technically open. The
game still fires `MenuOpenCloseEvent` for both the open and close transitions. Code that listens
to those events, including other framework internals, like the Prisma Dock, continues to work.
Use `IsMenuSuppressed` in your own `MenuOpenCloseEvent` listener to skip logic that should only
run when the vanilla UI is actually visible.

**Close** discards the menu from the menu stack. Use it when you need the menu gone immediately
rather than hidden, for example, to ensure vanilla ContainerMenu is not consuming input while your
replacement is open.

**SuppressIf** is for conditional suppression. The predicate is called on every open; return
`true` to force-close the menu, `false` to leave it alone. This is the right tool when your
replacement only takes over under certain conditions (e.g., only suppress ExamineConfirmMenu when
your plugin's examine view is already visible).

```cpp
// Permanently hide PipboyMenu while your plugin is active.
// The menu events still fire, you can listen to them to show/hide your own view.
g_api->SuppressVanillaMenu("PipboyMenu", true);

// Undo suppression (e.g. on plugin unload or game exit):
g_api->SuppressVanillaMenu("PipboyMenu", false);

// Check suppression state inside a MenuOpenCloseEvent sink:
if (!g_api->IsMenuSuppressed("ContainerMenu")) {
    // vanilla UI is visible; skip your custom logic
}

// Close ContainerMenu immediately (sends kHide):
g_api->CloseVanillaMenu("ContainerMenu");

// Only close ExamineConfirmMenu when your examine view is active:
g_api->SuppressVanillaMenuIf("ExamineConfirmMenu", []() -> bool {
    return g_examineViewOpen;  // your own flag
});
```

`SuppressVanillaMenuIf` uses a raw function pointer (`bool (*)()`), not `std::function`. Use a
static or free function, or a captureless lambda.

---

## Discovering vanilla menu names

Menu names are not documented in any fixed list, they are runtime Scaleform strings that vary by
game version and installed mods. The framework logs each menu name the first time it opens in a
session:

```
[PrismaUI] VanillaMenuSink: first open, 'ContainerMenu'
[PrismaUI] VanillaMenuSink: first open, 'ExamineConfirmMenu'
```

Run the game with the plugin active, open the vanilla menus you want to replace, then check the
F4SE log (or PrismaUI's own log) to collect the exact strings. Pass those strings verbatim to
`SuppressVanillaMenu` and friends, the comparison is case-sensitive.

---

## HUD widget suppression

`SuppressHUDWidget` patches vtable slot 7 (`CanBeVisible`) on a named HUD widget class so it
always returns `false`. The widget stops rendering immediately and does not reappear until you call
`SuppressHUDWidget(className, false)`.

**OG runtime only.** The vtable RVAs are specific to the 1.10.163 executable. On NG/AE the call
logs a warning and returns `false` without patching anything.

```cpp
virtual bool SuppressHUDWidget(const char* className, bool suppress) noexcept = 0;
```

### Supported class names

The following class names are recognised by the framework's widget table:

```
HUDQuestVaultBoy          HUDObjectiveUpdates       HUDQuestUpdates
HUDTutorialText           HUDExperienceMeter        HUDMessages
HUDEnemyHealthMeter       HUDStealthMeter           FlashVaultBoyCondition
ExplosiveIndicators       DirectionalHitIndicators  HUDCrosshair
HUDRollover               FlashHitIndicator         HUDQuickContainer
HUDRadiationMeter         HUDLocationText           HUDPlayerHealthMeter
HUDCompass                HUDSubtitleText           HUDPerkVaultBoy
HUDCriticalMeter          HUDFlashLightWidget       HUDActionPointMeter
HUDActiveEffectsDisplay   HUDAmmoCounter            HUDExplosiveAmmoCounter
HUDPowerArmorLowBatterWarningText                   HUDFatigueWarning
HUDFloatingQuestMarkers
```

Class names not in this table are rejected; the method returns `false`.

```cpp
// Hide the vanilla compass and crosshair for a full-screen HUD replacement:
g_api->SuppressHUDWidget("HUDCompass", true);
g_api->SuppressHUDWidget("HUDCrosshair", true);

// Restore them when your HUD is torn down:
g_api->SuppressHUDWidget("HUDCompass", false);
g_api->SuppressHUDWidget("HUDCrosshair", false);
```

---

## Activate choice filter

When the player aims at a container or NPC, the game shows a button strip like
`E) Take  Q) Field Dress  ...`. The activate-choice filter intercepts that strip so your plugin
can read each button label and fire individual choices programmatically, without the vanilla UI
appearing.

**OG runtime only.** On NG/AE these methods log a warning and return without doing anything.

```cpp
// Enable/disable the filter.
// dropDefaultTake=true removes the "Take" button from the vanilla strip.
virtual void EnableActivateChoiceFilter(bool enable, bool dropDefaultTake) noexcept = 0;

// Read the label at buttonIndex (0..3). Returns false if the index is out of range
// or the filter is not active.
virtual bool GetActivateChoiceLabel(uint32_t buttonIndex, char* outBuffer, size_t bufferSize) noexcept = 0;

// Fire the choice at buttonIndex. Call soon after GetActivateChoiceLabel.
virtual bool TriggerActivateChoice(uint32_t buttonIndex) noexcept = 0;
```

### Example, replacing "E) Field Dress" with a custom UI

The plugin wants to show its own skinning/harvesting screen instead of the vanilla field-dress
prompt. It enables the filter so the game's activate strip is hidden, reads the available choices
when the player presses the activation key, and, if one of them is a field-dress action, opens
the custom view instead of triggering it directly.

```cpp
// On plugin startup / game load:
g_api->EnableActivateChoiceFilter(true, false);  // keep "Take", suppress the strip UI

// In your activation key handler (runs on the game thread):
static void OnActivationKeyDown()
{
    char label[256];
    for (uint32_t i = 0; i < 4; ++i) {
        if (!g_api->GetActivateChoiceLabel(i, label, sizeof(label)))
            break;

        // "Field Dress" is localised, match against your translated string or a known prefix
        if (std::string_view(label).starts_with("Field Dress")) {
            // Show your custom skinning view instead
            g_api->Show(g_skinningView);
            g_api->Focus(g_skinningView, true, false);
            g_pendingChoiceIndex = i;  // remember which button to fire on confirm
            return;
        }
    }

    // No match, fall through to default "Take" (button index 0)
    g_api->TriggerActivateChoice(0);
}

// Inside your skinning view's "onConfirm" JS listener, fires when the player confirms:
static void OnSkinningConfirm(const char*)
{
    g_api->Unfocus(g_skinningView);
    g_api->Hide(g_skinningView);
    g_api->TriggerActivateChoice(g_pendingChoiceIndex);
}
```

Do not cache the result of `GetActivateChoiceLabel` across frames. The captured button data is
only valid for the current activation context; fire `TriggerActivateChoice` in the same game tick
or in a listener that runs before the context changes.

---

## Complete example plugin

A minimal F4SE plugin that hides the vanilla HUD compass, stealth meter, and experience meter, and
suppresses ContainerMenu in favour of a custom container view.

```cpp
#include "PrismaUI_F4_API.h"  // copy into your src/

static PRISMA_UI_API::IVPrismaUI2* g_api = nullptr;
static PrismaView g_containerView = 0;
static bool g_containerOpen = false;

static void OnContainerDomReady(PrismaView view)
{
    g_api->RegisterJSListener(view, "onClose", [](const char*) {
        g_api->Unfocus(g_containerView);
        g_api->Hide(g_containerView);
        g_containerOpen = false;
    });
    g_api->Invoke(view, "init()");
}

static void OnF4SEMessage(F4SE::MessagingInterface::Message* msg)
{
    switch (msg->type) {
    case F4SE::MessagingInterface::kGameDataReady:
        g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
        break;

    case F4SE::MessagingInterface::kPostLoadGame:
    case F4SE::MessagingInterface::kNewGame:
        if (!g_api) break;

        // Create container view once per game load
        if (g_containerView == 0) {
            g_containerView = g_api->CreateView(
                "Interface/MyPlugin/container.html", OnContainerDomReady);
            g_api->Hide(g_containerView);
        }

        // Suppress the vanilla ContainerMenu entirely
        g_api->SuppressVanillaMenu("ContainerMenu", true);

        // Suppress specific HUD widgets (OG only, safe to call on NG, just no-ops)
        g_api->SuppressHUDWidget("HUDCompass", true);
        g_api->SuppressHUDWidget("HUDStealthMeter", true);
        g_api->SuppressHUDWidget("HUDExperienceMeter", true);
        break;
    }
}

// Register a MenuOpenCloseEvent sink via CommonLibF4 to react to container opens:
class MenuSink : public RE::BSTEventSink<RE::MenuOpenCloseEvent>
{
public:
    RE::BSEventNotifyControl ProcessEvent(
        const RE::MenuOpenCloseEvent& evt,
        RE::BSTEventSource<RE::MenuOpenCloseEvent>*) override
    {
        if (evt.menuName == "ContainerMenu" && evt.opening) {
            // Vanilla menu opened but is suppressed, show our view instead
            if (!g_containerOpen && g_api && g_containerView != 0
                && g_api->IsMenuSuppressed("ContainerMenu"))
            {
                g_containerOpen = true;
                g_api->Show(g_containerView);
                g_api->Focus(g_containerView, true, false);
            }
        }
        return RE::BSEventNotifyControl::kContinue;
    }
} g_menuSink;

extern "C" __declspec(dllexport) bool F4SEPlugin_Load(const F4SE::LoadInterface* f4se)
{
    F4SE::Init(f4se);
    F4SE::GetMessagingInterface()->RegisterListener(OnF4SEMessage);

    auto* ui = RE::UI::GetSingleton();
    if (ui) ui->GetEventSource<RE::MenuOpenCloseEvent>()->AddEventSink(&g_menuSink);

    return true;
}
```

---

## Caveats

**Events still fire after suppression.** `SuppressVanillaMenu` hides the movie; it does not
prevent `MenuOpenCloseEvent` from being dispatched. If any other code, vanilla, another F4SE
plugin, or framework internals, listens to that event and takes action based on it, they will
still receive it. Design your `MenuOpenCloseEvent` sink accordingly: check
`IsMenuSuppressed` before assuming the vanilla UI is visible.

**OG-only restrictions.** `SuppressHUDWidget` and `EnableActivateChoiceFilter` /
`GetActivateChoiceLabel` / `TriggerActivateChoice` are only functional on the OG (1.10.163)
runtime. On NG/AE they warn and return without doing anything. If your plugin targets both
runtimes, guard these calls with a runtime check or simply call them unconditionally and accept
the no-op on NG.

**SuppressVanillaMenu is not a lock.** Nothing prevents the game from opening the menu again
after you call `SuppressVanillaMenu`. The suppression persists for the lifetime of the setting, so
future opens are also hidden, but other code can call `SuppressVanillaMenu(name, false)` and undo
your suppression. Coordinate between plugins if multiple consumers might be toggling the same menu.

**CloseVanillaMenu fires the close event.** Your `MenuOpenCloseEvent` sink will receive an
`opening == false` event after `CloseVanillaMenu`. If your sink uses that event to show your own
view, make sure you do not accidentally re-open your replacement in response to a close you
triggered yourself.
