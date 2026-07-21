# `RegisterTranslations`

**Since:** `IVPrismaUI3`

```cpp
virtual void RegisterTranslations(
    PrismaView view,
    const char* pluginName
) noexcept = 0;
```

Loads a translation file and injects `window.L10N` and `window.t()` into the view's JavaScript
context on every page load.

## Parameters

- `view` - Target view handle.
- `pluginName` - Your plugin's base name without extension, e.g. `"MyPlugin_F4"`.

## Translation file location

`Data\Interface\Translations\<pluginName>_<lang>.txt`, where `<lang>` matches the game's current
language setting (e.g. `en`, `de`, `fr`).

## Call timing

Call once, after `CreateView`. Translations are re-injected automatically on every subsequent page
load, so you do not need to call this again for the same view.

## In JS

```javascript
// window.t() returns the translated string for a key, or the key itself if not found
document.getElementById('title').textContent = t('ui.title');

// window.L10N is the raw object of all key/value pairs
console.log(L10N['ui.title']);
```

## Translation file format

One entry per line, key and value separated by a tab:

```
ui.title	My Plugin
ui.close	Close
ui.settings	Settings
```
