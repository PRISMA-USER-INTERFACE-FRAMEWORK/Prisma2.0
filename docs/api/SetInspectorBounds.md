# `SetInspectorBounds`

**Since:** `IVPrismaUI1`

```cpp
virtual void SetInspectorBounds(
    PrismaView view,
    float topLeftX,
    float topLeftY,
    unsigned int width,
    unsigned int height
) noexcept = 0;
```

Historically positioned and sized an in-game inspector overlay. **This is a no-op** under the
current backend: DevTools opens in your external browser instead of an in-game overlay, so position
and size parameters have nothing to apply to. The call is kept for source compatibility and does
not need to be removed from existing code, but it has no effect.

## See also

`CreateInspectorView`, `SetInspectorVisibility`.
