# `CreateInspectorView`

**Since:** `IVPrismaUI1`

```cpp
virtual void CreateInspectorView(PrismaView view) noexcept = 0;
```

Attaches a Chrome DevTools inspector to the view. Call once, before using the other inspector
methods (`SetInspectorVisibility`, `IsInspectorVisible`, `SetInspectorBounds`).

**Do not ship this call in released mods.** It is a development aid only.

## See also

`SetInspectorVisibility`, `IsInspectorVisible`, `SetInspectorBounds`.
