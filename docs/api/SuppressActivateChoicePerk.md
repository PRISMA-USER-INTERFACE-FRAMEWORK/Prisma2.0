# `SuppressActivateChoicePerk`

**Since:** `IVPrismaUI7`

```cpp
virtual void SuppressActivateChoicePerk(uint32_t perkFormID, bool suppress) noexcept = 0;
```

Drops or restores one specific perk's entry from the vanilla multi-activate row, by that perk's
full runtime FormID.

## Parameters

- `perkFormID` - The runtime FormID of the perk whose activate-choice entry should be affected (for
  example, the vanilla "Transfer" perk).
- `suppress` - `true` to drop that perk's entry, `false` to restore it.

## Requires

`EnableActivateChoiceFilter(true, ...)` to be active - this call only affects choices that filter is
already capturing.

## See also

`EnableActivateChoiceFilter`.
