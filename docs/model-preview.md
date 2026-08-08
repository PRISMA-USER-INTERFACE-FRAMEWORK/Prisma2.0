---
id: model-preview
title: Model Preview (3D Rendering)
sidebar_label: Model Preview
sidebar_position: 11
---

# Model Preview (3D Rendering)

ModelPreview renders a live 3D mesh — a weapon, armor piece, world object, or any other form — directly inside a PrismaUI view. The model is rendered off-screen as a D3D11 texture and composited into the view region you specify. From the player's perspective it looks like a rotating 3D object embedded in your HTML UI.

The entire API is called from JavaScript. C++ creates the view normally; nothing extra is needed to enable ModelPreview.

---

## How It Works

When a view is created, the framework automatically wires up `window.prismaModelPreview` in that view's JS context. You call `show()` with a FormID, plugin name, form type, and a destination rectangle. The framework resolves the form, loads the mesh, renders it into a D3D11 sub-texture, and composites that texture over the specified region of your view on every frame. When you are done, call `hide()`.

Status events (loaded, failed, hidden) are delivered back to JS through `window.onModelPreviewStatus`.

---

## C++ Side: Nothing to Do

```cpp
// C++ creates the view normally. ModelPreview is wired up automatically.
g_view = g_api->CreateView("Interface/MyMod/inventory.html", OnDomReady);
g_api->Hide(g_view);
```

No extra API calls, no flags, no special view type. Every view gets `window.prismaModelPreview` for free.

---

## JS API

### `window.prismaModelPreview.show(args)`

Loads and renders a 3D model in a rectangular region of the view.

```js
window.prismaModelPreview.show({
    formId: <number>,       // decimal FormID of the form to render
    pluginName: "<string>", // ESP/ESM that owns the formId, e.g. "Fallout4.esm"
    formType: "<string>",   // one of the values listed below
    destLeft: <number>,     // destination rect in pixels (within this view)
    destTop: <number>,
    destRight: <number>,
    destBottom: <number>,
    rotation: <number>,     // optional: initial Y-axis rotation in degrees
    zoom: <number>,         // optional: zoom factor (1.0 = default fit)
});
```

All pixel coordinates are in view space — the same coordinate space as your HTML layout, with (0, 0) at the top-left of the view.

`rotation` and `zoom` are optional. Omitting them applies the framework defaults (no initial rotation offset, auto-fit zoom).

The `viewId` field is filled automatically by the framework when called from inside the view. Do not set it manually.

### `window.prismaModelPreview.hide(args)`

Stops rendering and removes all model previews for this view.

```js
window.prismaModelPreview.hide({});
```

### `window.onModelPreviewStatus`

The framework calls this function whenever the model's load state changes. Assign it before calling `show()`.

```js
window.onModelPreviewStatus = function(jsonStr) {
    const s = JSON.parse(jsonStr);
    // s.viewId     - the view this event belongs to
    // s.formId     - the formId that was requested
    // s.pluginName - the plugin that was requested
    // s.status     - "loading" | "loaded" | "failed" | "hidden"
    // s.error      - present (string) when status is "failed"
};
```

| Status | When it fires |
|--------|--------------|
| `"loading"` | The mesh lookup has begun; model is not yet visible |
| `"loaded"` | The model is rendering in the destination rect |
| `"failed"` | The form could not be resolved or the mesh could not be loaded |
| `"hidden"` | `hide()` was called and rendering has stopped |

---

## `formType` Values

`formType` tells the framework how to orient and pose the model.

| formType | Applies to | Behavior |
|----------|-----------|---------|
| `"WEAP"` | Weapons | Auto-posed on a virtual pedestal |
| `"ARMO"` | Armor, clothing | Auto-posed on a virtual pedestal |
| `"MISC"` | Misc items, junk, consumables | Auto-posed on a virtual pedestal |
| `"AMMO"` | Ammunition | Auto-posed on a virtual pedestal |
| `"STAT"` | Static world objects | Rendered in the form's authored upright orientation |
| `"FURN"` | Furniture, workbenches | Rendered in the form's authored upright orientation |
| `"WORLD"` | World objects (general) | Rendered in the form's full authored orientation |

When in doubt about a world object, use `"STAT"`. For inventory items, use the matching record type or fall back to `"MISC"`.

---

## Handling Load Failures

Not every model will load cleanly. Mods may reference meshes or materials not present in the active load order. Always assign `onModelPreviewStatus` and provide a fallback:

```js
var previewContainer = document.getElementById('preview');
var fallbackImg = document.getElementById('preview-fallback');

window.onModelPreviewStatus = function(jsonStr) {
    const s = JSON.parse(jsonStr);

    if (s.status === 'loaded') {
        // model is rendering — make sure the HTML region is visible
        previewContainer.style.visibility = 'visible';
        fallbackImg.style.display = 'none';
    } else if (s.status === 'failed') {
        // show a static placeholder instead
        previewContainer.style.visibility = 'hidden';
        fallbackImg.style.display = 'block';
        console.warn('ModelPreview failed for formId ' + s.formId + ': ' + s.error);
    } else if (s.status === 'hidden') {
        previewContainer.style.visibility = 'hidden';
    }
};
```

**Material fallback:** If a `.BGSM` material file cannot be loaded (for example, a mod-added material not included in its BA2 archive), the framework logs a warning and renders the model with a fallback material. This is non-fatal — the model still appears. The `onModelPreviewStatus` callback will fire `"loaded"`, not `"failed"`.

---

## Performance Notes

- **VRAM cost is real.** Each active model preview holds a D3D11 texture. The framework monitors VRAM on a 30-second baseline tick and at view creation, but it does not enforce a hard limit on your behalf. Keeping previews hidden when the view is not visible is important.

- **Call `hide()` when the view closes.** If your view is hidden but still alive in the background (the normal pattern), an active `show()` keeps rendering. Always call `hide()` in your close/unfocus path.

- **Keep destination rects reasonably sized.** A 300&times;300 pixel preview costs far less than a 1000&times;1000 one. For item previews in an inventory list, 250&ndash;350 px on a side is a practical ceiling.

- **Avoid showing many previews simultaneously.** The typical pattern is one preview at a time, updated as the user selects different items. Showing a dozen previews at once is not a tested use case.

---

## Complete Example: Inventory Screen with 3D Item Preview

The following is a realistic inventory screen that renders the selected item in 3D in the right-hand panel. The list is populated by C++ via `InteropCall`; item selection triggers `prismaModelPreview.show()`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 100vw; height: 100vh;
    background: transparent;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .inventory-panel {
    display: flex;
    width: 900px;
    height: 560px;
    background: rgba(8, 8, 6, 0.94);
    border: 1px solid #3d3208;
    color: #f59e0b;
  }

  /* Left column: item list */
  .item-list {
    width: 340px;
    border-right: 1px solid #3d3208;
    overflow-y: auto;
    padding: 12px 0;
  }

  .item-row {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
  }
  .item-row:hover  { background: rgba(245, 158, 11, 0.12); }
  .item-row.active { background: rgba(245, 158, 11, 0.22); }

  /* Right column: detail + 3D preview */
  .item-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 16px;
  }

  .item-name {
    font-size: 20px;
    font-weight: bold;
    border-bottom: 1px solid #3d3208;
    padding-bottom: 12px;
  }

  /* The preview region must match the pixel coords passed to show() */
  .preview-region {
    position: relative;
    width: 300px;
    height: 300px;
    border: 1px solid #3d3208;
    align-self: center;
  }

  .preview-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b5a28;
    font-size: 13px;
    display: none; /* shown on failure */
  }
</style>
</head>
<body>

<div class="inventory-panel">
  <div class="item-list" id="itemList">
    <!-- populated by C++ via InteropCall("loadItems", json) -->
  </div>

  <div class="item-detail">
    <div class="item-name" id="itemName">Select an item</div>

    <div class="preview-region" id="previewRegion">
      <div class="preview-fallback" id="previewFallback">
        No preview available
      </div>
    </div>
  </div>
</div>

<script>
  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  var items = [];
  var activeIndex = -1;

  // The destination rect in view-space pixels.
  // Compute this from the layout, or measure the element at load time.
  // Here we measure it after the DOM settles.
  var previewRect = { left: 0, top: 0, right: 0, bottom: 0 };

  function computePreviewRect() {
    var el = document.getElementById('previewRegion');
    var r = el.getBoundingClientRect();
    previewRect = {
      left:   Math.round(r.left),
      top:    Math.round(r.top),
      right:  Math.round(r.right),
      bottom: Math.round(r.bottom),
    };
  }

  // ------------------------------------------------------------------
  // ModelPreview status handler — assign before calling show()
  // ------------------------------------------------------------------
  window.onModelPreviewStatus = function(jsonStr) {
    var s = JSON.parse(jsonStr);
    var fallback = document.getElementById('previewFallback');

    if (s.status === 'loaded') {
      fallback.style.display = 'none';
    } else if (s.status === 'failed') {
      fallback.style.display = 'flex';
      console.warn('ModelPreview failed: ' + (s.error || 'unknown'));
    } else if (s.status === 'hidden') {
      fallback.style.display = 'none';
    }
  };

  // ------------------------------------------------------------------
  // Show a model preview for the given item
  // ------------------------------------------------------------------
  function showPreview(item) {
    if (!item || !item.formId) {
      window.prismaModelPreview.hide({});
      return;
    }

    window.prismaModelPreview.show({
      formId:     item.formId,       // decimal FormID
      pluginName: item.pluginName,   // e.g. "Fallout4.esm" or "MyMod.esp"
      formType:   item.formType || 'MISC',
      destLeft:   previewRect.left,
      destTop:    previewRect.top,
      destRight:  previewRect.right,
      destBottom: previewRect.bottom,
      rotation:   30,                // slight initial angle looks good for items
    });
  }

  // ------------------------------------------------------------------
  // Item selection
  // ------------------------------------------------------------------
  function selectItem(index) {
    activeIndex = index;

    // Update list highlight
    var rows = document.querySelectorAll('.item-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('active', i === index);
    }

    var item = items[index];
    document.getElementById('itemName').textContent = item ? item.name : '';
    showPreview(item);
  }

  // ------------------------------------------------------------------
  // C++ → JS: populate the item list
  // Called from C++ via: api->InteropCall(view, "loadItems", jsonStr)
  // jsonStr: [{ name, formId, pluginName, formType }, ...]
  // ------------------------------------------------------------------
  function loadItems(jsonStr) {
    items = JSON.parse(jsonStr);
    var list = document.getElementById('itemList');
    list.innerHTML = '';

    items.forEach(function(item, i) {
      var row = document.createElement('div');
      row.className = 'item-row';
      row.textContent = item.name;
      row.addEventListener('click', function() { selectItem(i); });
      list.appendChild(row);
    });

    // Auto-select first item if list is non-empty
    if (items.length > 0) {
      selectItem(0);
    }
  }

  // ------------------------------------------------------------------
  // C++ → JS: clear everything when the menu closes
  // ------------------------------------------------------------------
  function onMenuClose() {
    window.prismaModelPreview.hide({});
    activeIndex = -1;
    document.getElementById('itemList').innerHTML = '';
    document.getElementById('itemName').textContent = 'Select an item';
  }

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  window.addEventListener('load', function() {
    computePreviewRect();
    console.log('inventory ready, preview rect:', JSON.stringify(previewRect));
  });
</script>
</body>
</html>
```

**Matching C++ side** (in your `OnDomReady` callback):

```cpp
static void OnDomReady(PrismaView view)
{
    // Register the close listener so JS can dismiss the menu
    g_api->RegisterJSListener(view, "requestClose", [](const char*) {
        g_api->Unfocus(g_view);
        g_api->Hide(g_view);
    });

    // When the menu opens, push the item list
    // (You would call this from your open-menu path, not here,
    //  but the InteropCall shape is the same.)
}

// Somewhere in your open-menu path:
static void OpenInventory()
{
    if (!g_api || !g_api->IsValid(g_view)) return;

    // Build item array JSON
    nlohmann::json items = nlohmann::json::array();
    for (auto& entry : BuildItemList()) {
        items.push_back({
            { "name",       entry.name },
            { "formId",     entry.formId },
            { "pluginName", entry.pluginName },
            { "formType",   entry.formType },
        });
    }

    g_api->Show(g_view);
    g_api->Focus(g_view, /*pauseGame=*/true, /*disableFocusMenu=*/false);
    g_api->InteropCall(g_view, "loadItems", items.dump().c_str());
}
```

---

## Hiding the Preview When the View Closes

A hidden view still renders its model preview unless you explicitly stop it. In your close path, call `hide()` before or alongside `Unfocus`/`Hide`:

```js
// In your close handler (called by a C++ JSListener, or a button click)
function closeInventory() {
    window.prismaModelPreview.hide({});
    requestClose(); // the C++ JSListener that calls Unfocus + Hide
}
```

---

## Placement Tips

- Measure the destination rect from the DOM (`getBoundingClientRect()`) rather than hard-coding pixel values. Layout shifts at different resolutions will misalign a hard-coded rect.
- The preview is a D3D11 texture overlay — it composites on top of everything in the view, including HTML elements. Do not place HTML content over the destination rect; it will be obscured.
- If you want a border or label around the preview, position those HTML elements just outside the rect, not inside it.
