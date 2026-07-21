# `EnableActivateChoiceFilter`

**Since:** `IVPrismaUI7`

```cpp
virtual void EnableActivateChoiceFilter(bool enable, bool dropDefaultTake) noexcept = 0;
```

Filters the vanilla multi-activate row on lootable corpses and containers - the
`"E) TAKE  R) TRANSFER  Space) FIELD DRESS"` prompt row.

## Parameters

- `enable` - Turns the filter on or off.
- `dropDefaultTake` - If `true`, also removes button 0, the reference's default "Take" choice.

## How it works

Hooks `ActivateChoiceListener::PopulateData`. Only applies to lootable references, so doors,
terminals, and NPCs (in the non-lootable sense) are left alone.

## Diagnostics

The first run logs each choice's parent-perk FormID to the framework's log file, so you can
identify which perk-added choices you want to remove with `SuppressActivateChoicePerk`. Perk-added
choices are kept by default unless you explicitly suppress their FormID.

## Compatibility

Hooks an OG-only (1.10.163) address; no-ops on Next-Gen/AE.

## See also

`SuppressActivateChoicePerk`, `GetActivateChoiceLabel` (V8), `TriggerActivateChoice` (V8).
