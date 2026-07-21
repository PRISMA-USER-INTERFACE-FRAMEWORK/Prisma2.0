# `SetInspectorVisibility`

**Since:** `IVPrismaUI1`

```cpp
virtual void SetInspectorVisibility(PrismaView view, bool visible) noexcept = 0;
```

Shows or hides the DevTools inspector for a view previously set up with `CreateInspectorView`.

DevTools opens in your **external** browser, not as an in-game overlay. Requires
`[DevTools] bEnabled=1` in the framework's own ini; otherwise this call warns and no-ops.

## See also

`CreateInspectorView`, `IsInspectorVisible`, `SetInspectorBounds`.
