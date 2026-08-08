---
id: networking
title: Networking
sidebar_label: Networking
sidebar_position: 10
---

# Networking

Every PrismaUI view runs inside a **network sandbox**. The sandbox is enforced by two separate
mechanisms — a JavaScript wrapper script and a CSP meta tag injected into `document.head` — and
applies automatically to every view, without any opt-in required from your plugin.

This page covers what the sandbox blocks, what it allows, how to debug blocked requests, and the
correct pattern for plugins that need real-time or WebSocket-like communication.

---

## What the Sandbox Blocks

The following APIs are **removed entirely** (set to `undefined`) in the sandbox script, before any
of your page's JavaScript runs:

| API | Status |
|-----|--------|
| `WebSocket` | Removed — `typeof WebSocket === 'undefined'` |
| `EventSource` | Removed |
| `Worker` | Removed |
| `SharedWorker` | Removed |
| `navigator.sendBeacon` | Returns `false` |
| `navigator.serviceWorker` | Removed |

`fetch()` and `XMLHttpRequest` are **not removed** but are **wrapped**. Calls to non-whitelisted
hosts are intercepted at the JS layer and rejected before any network packet is sent.

---

## The Default Whitelist

Cross-origin `https://` requests are allowed only to the following domains. Subdomains are
included where the entry itself is a bare domain.

| Domain | Typical use |
|--------|-------------|
| `static.wikia.nocookie.net` | Fandom/wiki image CDN |
| `cdn.jsdelivr.net` | JavaScript library CDN |
| `fonts.googleapis.com` | Google Fonts CSS delivery |
| `youtube.com` | YouTube embeds and player |
| `youtu.be` | YouTube short links |
| `googlevideo.com` | YouTube video stream CDN |
| `nexusmods.com` | Nexus Mods API or content |

These domains cover the most common plugin use-cases: loading a Google Font, embedding a
YouTube video, pulling a library from jsDelivr, or making read-only Nexus Mods API calls.

If your plugin needs a domain not on this list, the only supported path is the C++ bridge
pattern described below — your C++ code makes the request and pushes the result into the view
via `InteropCall`.

---

## What IS Allowed

### Same-origin and the `prisma:` scheme

Every view loads under the `prisma:` scheme. Requests to other resources within that same scheme
are always allowed without any whitelist check. This means:

- Relative `fetch()` calls from your HTML page to other files under `PrismaUI_F4/views/` work.
- Images, fonts, and scripts referenced by relative path in your HTML work without restriction.

### Whitelisted HTTPS

`fetch()` and `XMLHttpRequest` to any domain in the whitelist over `https://` are allowed. The
CSP also permits `img-src`, `font-src`, `script-src`, and `style-src` from those domains, and
`frame-src` includes `youtube.com` so `<iframe>` YouTube embeds work.

### Summary

| Request type | Allowed |
|---|---|
| Same-origin (`prisma:` → `prisma:`) | Yes |
| `https://` to whitelisted domain | Yes |
| `http://` (plaintext) | No |
| `https://` to non-whitelisted domain | No |
| WebSocket (`ws://`, `wss://`) | No — API removed |
| Localhost / LAN / private ranges | No — private network guard |

---

## The Private Network Guard

In addition to the whitelist, a separate script enforces a private-network block. The following
ranges are rejected at the JS layer even if someone managed to add them to the whitelist:

- `localhost` (any form)
- `127.x.x.x`
- `10.x.x.x`
- `172.16.x.x` through `172.31.x.x`
- `192.168.x.x`
- `169.254.x.x` (link-local)

This guard prevents a malicious or compromised plugin HTML file from using the game process as a
pivot to reach the player's local network or router. It is not configurable and cannot be
bypassed from JavaScript.

---

## Debugging Blocked Requests

When `fetch()` or `XMLHttpRequest` is blocked by the sandbox, the framework calls:

```js
window.__prismaNative('networkBlocked', '<reason>:<url>')
```

where `<reason>` is either `whitelist` or `privatenet`.

`window.__prismaNative` is the same channel used for all native callbacks. To observe these events
from C++, register a listener named `__prismaNative` after the DOM is ready:

```cpp
static void OnDomReady(PrismaView view)
{
    g_api->RegisterJSListener(view, "__prismaNative", [](const char* payload) {
        // payload format: "<eventName>:<data>"
        std::string s(payload);
        if (s.rfind("networkBlocked:", 0) == 0) {
            logger::warn("[PrismaUI] Network blocked: {}", s.substr(15));
        }
    });
}
```

You can also intercept it on the JS side during development:

```js
const _origNative = window.__prismaNative;
window.__prismaNative = function(event, data) {
    if (event === 'networkBlocked') {
        console.warn('[sandbox] blocked:', data);
    }
    if (_origNative) _origNative(event, data);
};
```

Place this override early in your HTML — before any `fetch()` calls — so the wrapper is in place
when the sandbox tries to fire it.

---

## Real-time Communication: The C++ Bridge Pattern

Because `WebSocket` is removed, any plugin that needs a persistent connection or server push must
open that connection in C++ and relay data into the view via `InteropCall`.

This is the same approach used by FalloutChat: C++ owns the socket, receives messages on a
networking thread, dispatches to the main thread, and calls `InteropCall` to push JSON into the
JS side.

### Threading rule

`InteropCall` and `Invoke` must be called from the **main game thread**. Your networking thread
must dispatch back via `F4SE::GetTaskInterface()->AddTask` before touching either.

### C++ side

```cpp
static PRISMA_UI_API::IVPrismaUI2* g_api = nullptr;
static PrismaView g_view = 0;

// Called from your networking thread when data arrives
void OnDataReceived(const std::string& jsonPayload)
{
    // Marshal to the main game thread before calling any PrismaUI API
    F4SE::GetTaskInterface()->AddTask([jsonPayload]() {
        if (g_view && g_api && g_api->IsValid(g_view)) {
            g_api->InteropCall(g_view, "onData", jsonPayload.c_str());
        }
    });
}
```

### JS side

```js
// Called by the framework when C++ calls InteropCall(view, "onData", json)
window.onData = function(json) {
    const data = JSON.parse(json);
    updateUI(data);
};
```

`InteropCall` calls `window.<fnName>(arg)` — the function must exist on `window` by the time the
call arrives. Register it during page initialisation, not lazily.

---

## Complete Example: C++ HTTP Polling

The pattern below polls a remote HTTPS endpoint on a background thread and pushes each result into
a view. It uses `libcurl` (or any HTTP library you link) for the actual HTTP work; only the
PrismaUI-facing part is shown.

### Plugin setup

```cpp
#include "PrismaUI_F4_API.h"
#include <thread>
#include <atomic>
#include <string>

static PRISMA_UI_API::IVPrismaUI2* g_api   = nullptr;
static PrismaView                   g_view  = 0;
static std::atomic<bool>            g_running{ false };
static std::thread                  g_pollThread;

// Forward declarations
static std::string HttpGet(const char* url);  // your HTTP implementation

static void PollThread()
{
    while (g_running) {
        std::string response = HttpGet("https://nexusmods.com/api/v1/your-endpoint");

        if (!response.empty()) {
            // Must NOT call PrismaUI APIs here — wrong thread
            F4SE::GetTaskInterface()->AddTask([response]() {
                if (g_view && g_api && g_api->IsValid(g_view)) {
                    g_api->InteropCall(g_view, "onPollResult", response.c_str());
                }
            });
        }

        std::this_thread::sleep_for(std::chrono::seconds(30));
    }
}
```

### Message handler

```cpp
static void OnMessage(F4SE::MessagingInterface::Message* msg)
{
    switch (msg->type) {
    case F4SE::MessagingInterface::kGameDataReady:
        g_api = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI2>();
        break;

    case F4SE::MessagingInterface::kPostLoadGame:
    case F4SE::MessagingInterface::kNewGame:
        if (g_view == 0 && g_api) {
            g_view = g_api->CreateView("Interface/MyPlugin/main.html", [](PrismaView view) {
                // DOM ready — register the native callback for debugging
                g_api->RegisterJSListener(view, "__prismaNative", [](const char* payload) {
                    std::string s(payload);
                    if (s.rfind("networkBlocked:", 0) == 0) {
                        logger::warn("[MyPlugin] Network blocked: {}", s.substr(15));
                    }
                });
                g_api->RegisterJSListener(view, "onClose", [](const char*) {
                    g_api->Unfocus(g_view);
                    g_api->Hide(g_view);
                });
                g_api->Invoke(view, "init()");
            });
            g_api->Hide(g_view);

            // Start the polling thread
            if (!g_running.exchange(true)) {
                g_pollThread = std::thread(PollThread);
                g_pollThread.detach();
            }
        }
        break;
    }
}
```

### JS side

```js
// main.html

window.init = function() {
    console.log('UI ready, waiting for poll results');
};

window.onPollResult = function(json) {
    let data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        console.error('Bad JSON from C++:', e);
        return;
    }
    renderResults(data);
};

function renderResults(data) {
    // update DOM with data
}
```

### Key points

- `HttpGet` runs on a dedicated thread — never block the game thread for network I/O.
- Always check `g_api->IsValid(g_view)` inside the `AddTask` lambda; the view may have been
  destroyed between the time the task was queued and when it runs.
- Stop the polling thread in your plugin's cleanup path (game unload / process exit) by clearing
  `g_running` and joining or detaching `g_pollThread` appropriately.
- The response you push to JS must be valid JSON if JS will call `JSON.parse` on it. Validate or
  sanitize the raw HTTP response in C++ before forwarding it.

---

## Summary

- The sandbox blocks WebSocket, EventSource, Worker, SharedWorker, and `sendBeacon` by removing
  their globals before your JS runs.
- `fetch()` and XHR are wrapped — only `prisma:` same-origin and whitelisted `https://` domains
  are permitted.
- Private/local IP ranges are blocked separately as a guard against SSRF via plugin UI.
- When a request is blocked the framework fires `window.__prismaNative('networkBlocked', ...)`,
  which you can intercept by registering a `__prismaNative` JS listener from C++.
- For real-time data or WebSocket-style communication: open the connection in C++, receive on a
  background thread, dispatch to the main thread via `AddTask`, then push into the view with
  `InteropCall`.
