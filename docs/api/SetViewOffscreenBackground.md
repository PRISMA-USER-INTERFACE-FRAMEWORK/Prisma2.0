# `SetViewOffscreenBackground`

**Since:** `IVPrismaUI9`

```cpp
virtual void SetViewOffscreenBackground(PrismaView view, uint32_t argb) noexcept = 0;
```

Sets the background of a view's **offscreen** browser (see `SetViewOffscreen`, V5), as ARGB.

## Parameters

- `view` - Target view handle.
- `argb` - Background color. Default `0xFF000000` (opaque black). Pass `0` for a fully transparent
  browser.

## Why this matters

Pass `0` so a mesh-bound page can composite **over** the geometry it is bound to, instead of
replacing that material wholesale. Without this, every pixel the page does not paint arrives at
alpha 255, and the page renders as a solid black quad over whatever it's bound to.

## Call order

**Must be called before `SetViewOffscreen(view, true)`.** The browser's background is fixed at
creation time; the page cannot undo it later with CSS, since its own transparency only takes effect
after the browser (and its opaque backing) already exists. Calling this on a view whose offscreen
browser already exists only takes effect the *next* time that view goes offscreen, and the
framework logs an error to flag the mistake.

## Why the default is opaque, not transparent

Existing on-mesh views (for example, a Pip-Boy-style screen) render against that black backing. A
transparent default would let the underlying mesh show through every on-mesh view that hasn't been
updated to expect it. Opt in per view.

## Compatibility

Requires a current `PrismaUI_F4.dll` build - see the compatibility note in
[api-reference.md](../api-reference.md#interface-versions).

## See also

`SetViewOffscreen`, `BindViewToGeometry`, `BindViewToScreenTexture`.
