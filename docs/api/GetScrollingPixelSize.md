# `GetScrollingPixelSize`

**Since:** `IVPrismaUI1`

```cpp
virtual int GetScrollingPixelSize(PrismaView view) noexcept = 0;
```

Returns the number of pixels scrolled per mouse wheel tick. Default: 28 px.

> **Not yet implemented** in the current CEF backend. Always returns 0 and logs "not yet implemented".

## See also

[`SetScrollingPixelSize`](SetScrollingPixelSize.md).
