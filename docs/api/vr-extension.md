# Fallout 4 VR extension (`IVPrismaUIVR1`)

> **Status: preview, not released, and not yet verified in a headset.**
>
> The FO4VR provider builds, links and exports correctly, and its spatial maths, pointer routing and
> resource policies pass a deterministic test suite. Nothing has yet been run on a real Fallout 4 VR
> install, because the development machine has neither the game nor VR hardware. Treat this header
> as a stable *shape* to write against, not as a shipped feature. Do not ship a mod that depends on
> it until VR support is announced as released.

VR support is a **separate provider DLL**, `PrismaUI_F4VR.dll`, built against CommonLibF4VR. It is
not a mode of the normal `PrismaUI_F4.dll`, because Fallout 4 VR needs a different CommonLib and a
different game executable.

Everything in the base API works the same on VR. The VR extension is **additive**: it adds spatial
presentation on top, through its own interface with its own version sequence, so the base V1 to V10
vtable is untouched.

## Requesting it

```cpp
#include "PrismaUI_F4_API.h"
#include "PrismaUI_F4VR_API.h"

// Base API exactly as on flat Fallout 4.
auto* ui = PRISMA_UI_API::RequestPluginAPI<PRISMA_UI_API::IVPrismaUI10>();

// VR extension. Returns nullptr on a non-VR provider, which is how you detect VR.
auto* vr = PRISMA_UI_VR_API::RequestPluginVRAPI<PRISMA_UI_VR_API::IVPrismaUIVR1>();
if (!vr) {
    // Flat Fallout 4, or an older provider. Fall back to normal screen-space views.
}
```

## Presentation modes

| Mode | Behaviour |
|---|---|
| `HeadLockedQuad` | Fixed relative to the headset. Pose and physical size are ignored. |
| `WorldBillboard` | Placed in the world, always turning to face the viewer. Orientation is ignored. |
| `WorldQuad` | Placed and oriented in the world exactly as given. |

A spatial view has **independent pixel and physical dimensions**: `pixelWidth`/`pixelHeight` decide
how much page you get, `physicalWidth`/`physicalHeight` decide how large it appears in the world.

## Submitting a placement

```cpp
PRISMA_UI_VR_API::SpatialUpdateV1 update{};
update.structSize       = sizeof(update);
update.coordinateSpace  = PRISMA_UI_VR_API::SpatialCoordinateSpace::GameWorld;
update.presentationMode = PRISMA_UI_VR_API::SpatialPresentationMode::WorldBillboard;
update.sequence         = ++mySequence;          // must increase; 0 is rejected
update.pose.position[0] = x;
update.pose.position[1] = y;
update.pose.position[2] = z;
update.pose.orientation[3] = 1.0f;               // identity quaternion
update.dimensions.pixelWidth     = 1024;
update.dimensions.pixelHeight    = 768;
update.dimensions.physicalWidth  = 60.0f;
update.dimensions.physicalHeight = 45.0f;

const auto result = vr->SubmitSpatialUpdate(view, &update);
```

Updates are **latest-only**: submitting again before the renderer has consumed the previous one
replaces it and returns `PendingUpdateReplaced`, which is a success, not an error. Poll
`GetSpatialState` and compare `appliedSequence` if you need to know what the renderer actually used.

## Pointer input

World-space pointing is submitted as a ray, and the framework converts a hit into ordinary mouse
events for that view's page, so existing HTML and JS need no changes.

```cpp
PRISMA_UI_VR_API::SpatialPointerUpdateV1 pointer{};
pointer.structSize   = sizeof(pointer);
pointer.flags        = PRISMA_UI_VR_API::SpatialPointerUpdate_Active;
pointer.buttonLevels = trigger ? PRISMA_UI_VR_API::SpatialPointerButton_Primary : 0;
pointer.sequence     = ++myPointerSequence;
pointer.maxDistance  = 400.0f;
// rayOrigin / rayDirection in world space
pointer.pointerSourceId = PRISMA_UI_VR_API::SpatialPointerSource_PhysicalRightController;

vr->SubmitSpatialPointerUpdate(view, &pointer);
```

`CancelSpatialPointer` releases any held button and clears hover, which matters when the controller
is holstered or the view is hidden mid-drag.

## Ask before you assume

`GetSpatialCapabilities` reports what this provider actually delivers: supported modes, feature bits,
maximum pixel dimensions, and how many spatial views and total pixels may be live at once. Check it
rather than assuming, because the feature bits are gated on what is genuinely available rather than
advertised unconditionally. `SpatialFeature_SceneDepthOcclusion` and
`SpatialFeature_NativeNetworkPolicy` in particular are only set when their backing support is
actually reachable.

## Network access policy

`CreateViewWithOptions` and `SetNetworkAccessPolicy` restrict what a view may reach.

> **Known limitation.** Under the CEF backend this is enforced by injecting a network restriction
> into the view's page. That is enough to keep an honest consumer in its lane, but it is **not a
> security boundary** against a hostile page, and `LocalOnly` is **one-way**: once set on a loaded
> page it cannot be lifted until the page reloads, while `GetNetworkAccessPolicy` will report the
> newer value. Do not rely on it to contain untrusted content.

## Results

Every spatial call returns `SpatialResult`. `Ok` and `PendingUpdateReplaced` are both success.
`Unsupported` means this provider is not the VR one. `NotReady` means the renderer has not yet
consumed anything for this view, which is normal for the first frames after a submission.
