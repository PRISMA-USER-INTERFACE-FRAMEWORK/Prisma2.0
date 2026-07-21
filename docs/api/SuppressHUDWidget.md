# `SuppressHUDWidget`

**Since:** `IVPrismaUI6`

```cpp
virtual bool SuppressHUDWidget(const char* className, bool suppress) noexcept = 0;
```

Hides or restores a vanilla HUD widget by its class name, e.g. `"HUDCompass"`,
`"HUDAmmoCounter"`, `"HUDPlayerHealthMeter"`.

## Parameters

- `className` - The widget's class name.
- `suppress` - `true` to hide, `false` to restore.

## How it works

Patches the widget's own `CanBeVisible()` vtable slot rather than setting `_visible` on its
Scaleform movie directly - setting `_visible` alone loses the race against the widget's own per-tick
visibility update, so it would flicker back on.

## Returns

`false` for an unknown class name.

## Persistence

Survives HUDMenu rebuilds and save loads on its own - you do not need to reapply this after a load.

## Known limitation

Requires hardcoded engine addresses that are currently only known for the Old-Gen (1.10.163) game
version. Logs a warning and no-ops on Next-Gen/AE.

## See also

`SuppressVanillaMenu` - the equivalent for a full menu instead of one HUD widget.
