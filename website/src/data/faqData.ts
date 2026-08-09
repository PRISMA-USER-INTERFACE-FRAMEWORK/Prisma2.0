// FAQ entries for the site-wide FaqWidget. Answers are plain text (short, no markdown
// rendering) with an optional link to the doc page that covers the topic in full.
export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  link?: string; // doc id, resolved with useBaseUrl in the widget
  linkLabel?: string;
};

export const FAQ_DATA: FaqEntry[] = [
  {
    id: 'what-is-prismaui',
    question: 'What is PrismaUI F4?',
    answer:
      'A framework that lets you build Fallout 4 mod UIs using HTML, CSS, and JavaScript instead of Scaleform/ActionScript. It renders your page with real Chromium (CEF 147) as an overlay inside the game.',
    keywords: ['what', 'prismaui', 'framework', 'about', 'overview'],
    link: '/docs/what-is-prismaui',
    linkLabel: 'What is PrismaUI F4?',
  },
  {
    id: 'scaleform-editing',
    question: 'Does PrismaUI edit or replace Scaleform menus?',
    answer:
      'No, it does not edit SWF files. It renders on a separate layer above the game. It can suppress or hide specific vanilla HUD widgets and menus at runtime via the API, so you can replace them with your own HTML UI without touching a SWF.',
    keywords: ['scaleform', 'swf', 'actionscript', 'replace', 'edit', 'vanilla menu'],
    link: '/docs/vanilla-ui-suppression',
    linkLabel: 'Vanilla UI suppression',
  },
  {
    id: 'actionscript-needed',
    question: 'Do I need to know ActionScript or Scaleform?',
    answer:
      'No. You never touch ActionScript or SWF files. If you know basic HTML, CSS, and JavaScript, and can write a simple F4SE plugin in C++, you have everything you need.',
    keywords: ['actionscript', 'scaleform', 'learn', 'need to know', 'requirements'],
    link: '/docs/what-is-prismaui',
    linkLabel: 'What is PrismaUI F4?',
  },
  {
    id: 'where-to-start',
    question: 'Where do I start?',
    answer:
      'New to F4SE plugin development: start at Getting Started, which walks through the whole setup from scratch. Already have a working F4SE plugin: jump straight to Quick Start for a 6-step integration.',
    keywords: ['start', 'begin', 'tutorial', 'setup', 'new'],
    link: '/docs/getting-started',
    linkLabel: 'Getting Started',
  },
  {
    id: 'example-plugin',
    question: 'Is there a working example plugin?',
    answer:
      'Yes. The framework ships with a complete, buildable F4SE example plugin covering the C++ bridge, the Papyrus bridge, event logging, and a full in-app tutorial. Clone it, build it, and you have a working UI in-game immediately.',
    keywords: ['example', 'sample', 'demo', 'plugin', 'reference'],
    link: '/docs/what-is-prismaui',
    linkLabel: 'What is PrismaUI F4?',
  },
  {
    id: 'web-frameworks',
    question: 'What web frameworks can I use?',
    answer:
      'Any of them. Vanilla JS, React, Vue, Svelte, whatever you like, as long as it ships as static HTML, CSS, and JS files. No special build pipeline is required.',
    keywords: ['react', 'vue', 'svelte', 'framework', 'javascript', 'web stack'],
    link: '/docs/modern-frameworks',
    linkLabel: 'Modern frameworks',
  },
  {
    id: 'nothing-appears',
    question: 'My UI does not appear on screen. What do I check?',
    answer:
      'Confirm PrismaUI_F4.dll is installed in F4SE/plugins/ and loads (check the log). Make sure RequestPluginAPI is called in kGameDataReady, not F4SEPlugin_Load. Confirm your HTML file path is relative to Data/PrismaUI_F4/views/. And remember CreateView does not show the view, you must call Show(view) yourself.',
    keywords: ['nothing appears', 'blank', 'not showing', 'invisible', 'view not visible'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'input-not-working',
    question: 'The UI appears but input does not work',
    answer:
      'Show() makes a view visible but does not route input to it. Call Focus(view) after Show(view) for any panel that needs keyboard or mouse interaction. Also check HasAnyActiveFocus(), only one view can hold focus at a time.',
    keywords: ['input', 'keyboard', 'mouse', 'not working', 'focus', 'click'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'listener-does-nothing',
    question: 'My close button or JS listener does nothing',
    answer:
      'Check for a name mismatch, RegisterJSListener("name", ...) in C++ must match window.name() in JS exactly, including case. Also confirm the listener was registered inside OnDomReadyCallback, not before it fires. A silently thrown JS error can also swallow the event, check DevTools.',
    keywords: ['listener', 'button', 'not firing', 'jslistener', 'callback'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'game-crashes',
    question: 'The game crashes on load or during gameplay',
    answer:
      'The most common cause is not null-checking the return of RequestPluginAPI, if the framework is not installed it returns null and any call through that pointer crashes. Also check for a version mismatch between the API header your plugin was built against and the installed framework DLL.',
    keywords: ['crash', 'ctd', 'freeze', 'null pointer'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'looks-unstyled',
    question: 'My UI looks wrong or unstyled',
    answer:
      'CSS and JS paths in your HTML are resolved relative to the views root (Data/PrismaUI_F4/views/), not relative to the HTML file itself. Use a root-relative or document-relative path. Also check that any external fonts or CDN resources are on the network whitelist, most external domains are blocked by the sandbox.',
    keywords: ['unstyled', 'css not loading', 'looks wrong', 'broken layout'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'devtools-wont-open',
    question: 'DevTools will not open',
    answer:
      'Enable it first in PrismaUI_F4.ini under [DevTools] with bEnabled=1, then restart the game. Then call CreateInspectorView(view) followed by SetInspectorVisibility(view, true). The inspector opens in your external default browser, not in-game.',
    keywords: ['devtools', 'inspector', 'debug', 'console'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'model-preview-blank',
    question: '3D model preview shows nothing',
    answer:
      'Double-check the FormID is correct and its plugin is present in the load order. Confirm the formType string matches the record type (WEAP, ARMO, MISC, AMMO, STAT, FURN, WORLD). And do not call the JS show() function at page load, call it from a listener or after DOM-ready.',
    keywords: ['3d model', 'model preview', 'blank', 'weapon preview', 'item preview'],
    link: '/docs/model-preview',
    linkLabel: 'Model Preview',
  },
  {
    id: 'input-leaks',
    question: 'Input leaks through to the game while my UI is open',
    answer:
      'A view that is visible but not focused does not block game input, that is intentional for HUD widgets meant to be non-interactive overlays. If your panel should capture all input, pair every Show(view) call with a Focus(view) call.',
    keywords: ['input leak', 'still moving', 'not blocking input', 'focus'],
    link: '/docs/troubleshooting',
    linkLabel: 'Troubleshooting',
  },
  {
    id: 'hud-suppression-not-working',
    question: 'Vanilla HUD widget suppression is not working',
    answer:
      'SuppressHUDWidget only works on the Old-Gen (OG) runtime 1.10.163, on Next-Gen and AE it logs a warning and does nothing. Also confirm the class name matches exactly, the supported list is logged to PrismaUI_F4.log the first time the HUD opens.',
    keywords: ['hud suppression', 'suppress hud', 'hide widget', 'og ng ae'],
    link: '/docs/vanilla-ui-suppression',
    linkLabel: 'Vanilla UI suppression',
  },
  {
    id: 'cpp-js-communication',
    question: 'How do C++ and JS talk to each other?',
    answer:
      'Three ways: InteropCall for high-frequency C++-to-JS calls, Invoke for one-shot JS evaluation or reads, and RegisterJSListener to let JS call back into C++. All are documented with signatures in the API reference.',
    keywords: ['interop', 'communication', 'bridge', 'invoke', 'js listener', 'c++ to js'],
    link: '/docs/api-reference',
    linkLabel: 'API Reference',
  },
  {
    id: 'papyrus-bridge',
    question: 'Can I read or write Papyrus data from JavaScript?',
    answer:
      'Yes, the Papyrus bridge lets you read and write Papyrus globals, script properties, and actor values directly from JavaScript, no C++ glue required for simple data reads.',
    keywords: ['papyrus', 'globals', 'script properties', 'actor values'],
    link: '/docs/papyrus-bridge',
    linkLabel: 'Papyrus bridge',
  },
  {
    id: 'game-versions',
    question: 'Does PrismaUI support Next-Gen and AE?',
    answer:
      'Yes, CommonLibF4 supports OG, NG, and AE runtimes. A few specific APIs (like SuppressHUDWidget) are OG-only and log a warning on other runtimes, check the relevant doc page for per-feature notes.',
    keywords: ['next-gen', 'ng', 'ae', 'og', 'runtime', 'game version'],
    link: '/docs/1.0-vs-2.0',
    linkLabel: '1.0 vs 2.0',
  },
  {
    id: 'networking-allowed',
    question: 'Can my UI make network requests?',
    answer:
      'Fetch and XHR work but are sandboxed. WebSocket, Worker, and EventSource are blocked outright. Only a whitelist of domains is reachable (things like fonts.googleapis.com, nexusmods.com, youtube.com), and private/local network addresses are always blocked.',
    keywords: ['network', 'fetch', 'websocket', 'xhr', 'cdn', 'sandbox'],
    link: '/docs/networking',
    linkLabel: 'Networking',
  },
  {
    id: 'view-health',
    question: 'How do I detect if a view crashed or failed to load?',
    answer:
      'Every view has a ViewHealth state (Creating, DomReady, Live, LoadFailed, DomReadyTimeout, Unresponsive, JsError). Poll or listen for these to detect and recover from failures instead of assuming a view stays healthy forever.',
    keywords: ['view health', 'watchdog', 'crashed view', 'unresponsive', 'load failed'],
    link: '/docs/view-watchdog',
    linkLabel: 'View Watchdog',
  },
  {
    id: 'multiple-panels',
    question: 'How do multiple plugins avoid stepping on each other’s UI?',
    answer:
      'Declare a view’s role with SetViewRole (kWidget or kPanel). IsAnyPanelVisible and GetFocusedView let cooperating plugins check whether another panel is already open before opening their own.',
    keywords: ['multiple plugins', 'panel management', 'coordination', 'viewrole'],
    link: '/docs/panel-management',
    linkLabel: 'Panel management',
  },
  {
    id: 'support-discord',
    question: 'Where can I get help if this FAQ does not cover it?',
    answer:
      'Join the Discord server, it is the fastest way to reach the maintainers and other mod authors. You can also open an issue on GitHub.',
    keywords: ['help', 'support', 'discord', 'contact', 'community'],
    link: undefined,
  },
];
