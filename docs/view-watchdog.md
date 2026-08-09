---
id: view-watchdog
title: View Health & Watchdog
sidebar_label: View Health & Watchdog
sidebar_position: 9
---

The PrismaUI F4 framework tracks the health of every view it manages through a background watchdog that runs without any setup from plugin authors. This page describes what the watchdog monitors, the complete health state machine, how to query view health from your plugin, and the recovery patterns for each failure mode.

## What the Watchdog Does

When you call `CreateView`, the framework immediately begins watching that view. Internally it tracks three things:

- **Load progression**, did the iframe mount and fire `OnDomReady` within the allowed window?
- **Liveness**, is the page still responding to periodic heartbeat pings sent by the framework?
- **JS error accumulation**, how many uncaught exceptions or `console.error` calls has the page produced?

None of this requires any code from you. The watchdog updates the view's health state as these signals arrive, and `GetViewHealth` lets you read that state at any time.

## The Health State Machine

All states are values of `PRISMA_UI_API::ViewHealth`:

```cpp
enum class ViewHealth : int {
    kUnknown        = -1,
    kCreating       =  0,
    kDomReady       =  1,
    kLive           =  2,
    kLoadFailed     =  3,
    kDomReadyTimeout =  4,
    kUnresponsive   =  5,
    kJsError        =  6,
};
```

### kUnknown (-1)

Returned when CEF is not running, or when the handle you passed is not recognised by the framework (invalid or already destroyed). You will also see this briefly at process startup before CEF has initialised.

**What to do:** Verify you are calling after `kGameDataReady` and that `IsValid(view)` returns true before querying health.

### kCreating (0)

`CreateView` has been called. The framework has issued the iframe mount, but `OnDomReady` has not fired yet. This is the expected transient state immediately after view creation while the page is loading and scripts are executing.

**What to do:** Nothing. Wait for the state to advance to `kDomReady` or `kLive`. If your plugin needs to know the page is ready before acting, wait for `kDomReady` rather than polling `kCreating`.

### kDomReady (1)

`OnDomReady` has fired. Your `OnDomReadyCallback` has been (or is about to be) dispatched on the main game thread. Registered JS listeners are available and `Invoke` / `InteropCall` can be called safely.

**What to do:** Nothing special. This state may briefly precede `kLive` on the first successful ping cycle. Treat it the same as `kLive` in any health check.

### kLive (2)

The view is healthy and responding to the framework's liveness pings. This is the normal operating state for a view that has loaded and is interactive.

**What to do:** Nothing. This is the target state.

### kLoadFailed (3)

The HTML file could not be loaded. Common causes: the path passed to `CreateView` was wrong, the file is missing from the MO2 mod folder, or an asset the page depends on (script, stylesheet) produced a network error that aborted the load.

This state is terminal for the current view handle, the page will not recover on its own.

**What to do:** Destroy the view and recreate it. Before recreating, verify the HTML path. If the path is correct the file is genuinely missing from disk; check your deploy step.

### kDomReadyTimeout (4)

The page started loading (the network request succeeded) but `OnDomReady` never fired within the watchdog's timeout window. The most common causes are a script that throws during initialisation, an infinite loop in top-level JS, or a page that hung waiting for a resource that never arrived.

Like `kLoadFailed`, this state is terminal for the current view handle.

**What to do:** Destroy the view and recreate it. If the problem recurs, attach `RegisterConsoleCallback` to capture the JS error that caused the hang (see [Surfacing JS Errors](#surfacing-js-errors-with-kJsError) below).

### kUnresponsive (5)

The view was previously `kLive` but has stopped responding to heartbeat pings. This usually means the CEF subprocess crashed or the renderer process was killed by the OS.

**What to do:** Log the event at error level. Optionally notify the user. You may attempt to destroy and recreate the view, but if the CEF subprocess itself has crashed, recreating will likely fail or also go unresponsive, check CEF crash logs before retrying.

### kJsError (6)

The view is still alive and responding to pings, but it has accumulated uncaught JS exceptions or `console.error` calls above the framework's threshold. The page continues to function; this state is a flag, not a failure.

**What to do:** This state is most useful during development. Attach `RegisterConsoleCallback` to see exactly what is being logged. In a release build you can log the state and continue, since the page is still interactive.

## Querying View Health

### The API

```cpp
virtual ViewHealth GetViewHealth(PrismaView view) noexcept = 0;
```

`GetViewHealth` is thread-safe. You may call it from any thread, the game update thread, an F4SE task, or a background thread, without additional locking. It is a non-blocking read of an atomic state value.

### When to Poll

`GetViewHealth` is intended for polling from a game update loop or from a periodic F4SE message handler. It is not an event callback; the framework does not push health change notifications. A reasonable polling cadence is once per game update frame, or less frequently if your plugin only needs to detect failures rather than react to every transition.

Do not spin-poll from a background thread waiting for `kLive`, check health in your existing update path and act only when the state changes to a terminal failure value.

### Checking Validity First

Always guard against an invalid handle before polling health:

```cpp
if (!g_view || !g_api->IsValid(g_view)) {
    // view not yet created or already destroyed
    return;
}
const auto health = g_api->GetViewHealth(g_view);
```

An invalid handle passed to `GetViewHealth` returns `kUnknown`; it does not crash. The guard is still good practice because you may want to distinguish "view not created yet" from "view created but CEF not ready."

## Recovery Patterns

### kLoadFailed and kDomReadyTimeout

Both states mean the current view handle is dead. Destroy it and schedule a recreate:

```cpp
g_api->Destroy(g_view);
g_view = 0;
ScheduleViewRecreate();
```

`ScheduleViewRecreate` should set a flag that your `kPostLoadGame` handler (or a delayed task) checks to call `CreateView` again. Do not call `CreateView` immediately inside the update loop, defer it to the next safe window.

If `kLoadFailed` recurs, the HTML file is missing. Add a log message that prints the path so you can diagnose the deploy issue.

If `kDomReadyTimeout` recurs, the page is crashing during initialisation. Enable `RegisterConsoleCallback` temporarily to capture the exception before it kills the page.

### kUnresponsive

Log at error level. A single unresponsive event can be transient (the renderer process was briefly overloaded), but repeated failures indicate a subprocess crash:

```cpp
logger::error("[MyPlugin] view unresponsive CEF subprocess may have crashed");
// Optionally destroy and attempt recreate after a delay, but do not loop.
```

Do not create an automatic retry loop for `kUnresponsive` without a maximum attempt count. If CEF is crashing, retrying indefinitely makes the problem worse.

### kJsError

Non-fatal. Log it and continue. In development builds, also enable console capture:

```cpp
case PRISMA_UI_API::ViewHealth::kJsError:
    logger::warn("[MyPlugin] view has accumulated JS errors, check console output");
    break;
```

## Surfacing JS Errors with kJsError {#surfacing-js-errors-with-kjserror}

`RegisterConsoleCallback` is the companion to `kJsError`. Register it inside your `OnDomReadyCallback` to forward every JS `console.*` call and uncaught exception to your plugin's logger:

```cpp
g_api->RegisterConsoleCallback(g_view, [](PrismaView, auto level, const char* msg) {
    logger::info("[MyPlugin JS] {}", msg);
});
```

The `level` parameter reflects the console severity (`log`, `warn`, `error`). You can filter on it if you only want errors:

```cpp
g_api->RegisterConsoleCallback(g_view, [](PrismaView, auto level, const char* msg) {
    if (static_cast<int>(level) >= /* error threshold */ 2) {
        logger::warn("[MyPlugin JS error] {}", msg);
    }
});
```

All console callbacks are dispatched on the main game thread, matching the same threading guarantee as JS listener callbacks. `RE::*` access inside them is safe.

## Complete Example: Robust Plugin With Health Monitoring

The following is a copy-paste starting point for a plugin that creates a view on load, polls health on every game update, and recovers from all failure states.

```cpp
#include "PrismaUI_F4_API.h"

namespace {
    PRISMA_UI_API::IVPrismaUI2* g_api = nullptr;
    PRISMA_UI_API::PrismaView   g_view = 0;
    bool                        g_recreatePending = false;

    void CreateMyView() {
        if (!g_api) return;

        g_view = g_api->CreateView("Interface/MyPlugin/main.html",
            [](PRISMA_UI_API::PrismaView view) {
                // OnDomReady, safe to register listeners and invoke JS.
                g_api->RegisterJSListener(view, "onClose",
                    [](const char*) {
                        g_api->Unfocus(g_view);
                        g_api->Hide(g_view);
                    });

                g_api->RegisterConsoleCallback(view,
                    [](PRISMA_UI_API::PrismaView, auto /*level*/, const char* msg) {
                        logger::info("[MyPlugin JS] {}", msg);
                    });

                g_api->Invoke(view, "init()");
            });

        g_api->Hide(g_view);
        g_recreatePending = false;
    }

    void ScheduleViewRecreate() {
        // Set a flag; the next kPostLoadGame or update iteration will call CreateMyView.
        g_recreatePending = true;
        logger::info("[MyPlugin] view recreate scheduled");
    }

    void OnGameUpdate() {
        if (!g_api) return;

        // If a recreate was requested and we have no live view, create it now.
        if (g_recreatePending && !g_view) {
            CreateMyView();
            return;
        }

        if (!g_view || !g_api->IsValid(g_view)) return;

        using VH = PRISMA_UI_API::ViewHealth;
        const auto health = g_api->GetViewHealth(g_view);

        switch (health) {
            case VH::kLive:
            case VH::kDomReady:
                // Normal, nothing to do.
                break;

            case VH::kCreating:
                // Still loading, wait.
                break;

            case VH::kLoadFailed:
                logger::warn("[MyPlugin] view load failed, check HTML path, scheduling recreate");
                g_api->Destroy(g_view);
                g_view = 0;
                ScheduleViewRecreate();
                break;

            case VH::kDomReadyTimeout:
                logger::warn("[MyPlugin] view DomReady timed out, page may have crashed, "
                             "scheduling recreate (health={})", static_cast<int>(health));
                g_api->Destroy(g_view);
                g_view = 0;
                ScheduleViewRecreate();
                break;

            case VH::kUnresponsive:
                logger::error("[MyPlugin] view unresponsive CEF subprocess may have crashed");
                // Do not auto-recreate in a loop; leave it for the user to reload the game.
                break;

            case VH::kJsError:
                // Non-fatal. Console callback above already logs individual errors.
                logger::warn("[MyPlugin] view flagged for accumulated JS errors");
                break;

            case VH::kUnknown:
            default:
                // CEF not ready or handle invalid; nothing actionable.
                break;
        }
    }
}

// F4SE message handler
void OnF4SEMessage(F4SE::MessagingInterface::Message* msg) {
    switch (msg->type) {
        case F4SE::MessagingInterface::kGameDataReady:
            g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
            break;

        case F4SE::MessagingInterface::kPostLoadGame:
        case F4SE::MessagingInterface::kNewGame:
            // Destroy any stale view from a previous session before recreating.
            if (g_view && g_api->IsValid(g_view)) {
                g_api->Destroy(g_view);
                g_view = 0;
            }
            CreateMyView();
            break;

        default:
            break;
    }
}
```

### Key points in the example

- `CreateView` is called from `kPostLoadGame` and `kNewGame`, not from `kGameDataReady`. See [view-lifecycle](view-lifecycle.md) for why this matters.
- The existing view is destroyed before recreating on each load, preventing a handle leak if the user loads a save without quitting first.
- `RegisterConsoleCallback` is set up inside `OnDomReadyCallback`, which is the only safe place to register listeners.
- `kUnresponsive` does not trigger an automatic recreate. CEF subprocess crashes are not self-healing; alerting and waiting for a game reload is the safer choice.
- `ScheduleViewRecreate` uses a flag rather than calling `CreateView` directly from the update loop to avoid re-entering `CreateView` while the framework is still cleaning up the previous view.
