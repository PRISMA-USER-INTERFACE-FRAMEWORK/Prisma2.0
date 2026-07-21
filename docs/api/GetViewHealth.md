# `GetViewHealth`

**Since:** `IVPrismaUI8`

```cpp
virtual ViewHealth GetViewHealth(PrismaView view) noexcept = 0;
```

Returns a richer health state for a view than plain `IsValid`.

## Returns

A `ViewHealth` value:

| Value | Meaning |
|---|---|
| `kUnknown` | The browser backend isn't active, or `view` is not a currently-known handle. |
| `kCreating` | `CreateView` issued; the page is still mounting. |
| `kDomReady` | `OnDomReady` fired. |
| `kLive` | Healthy and interactive. |
| `kLoadFailed` | The page/frame failed to load. |
| `kDomReadyTimeout` | `OnDomReady` never fired within the watchdog window. |
| `kUnresponsive` | The view has missed liveness pings. |
| `kJsError` | Accumulating uncaught exceptions or console errors - not fatal on its own, but flagged. |

## Use case

Detecting a stuck or broken view (e.g. one that never finished loading) so you can surface a
diagnostic to the player or log it, rather than a view silently sitting blank.

## See also

`IsValid` - a plain existence check, if you don't need this level of detail.
