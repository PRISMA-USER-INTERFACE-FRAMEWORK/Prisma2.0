import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

const QUICK_START = `// 1. Request the API on kGameDataReady
auto* api = PRISMA_UI_API::RequestPluginAPI<IVPrismaUI2>();

// 2. Create a view on kPostLoadGame / kNewGame
PrismaView view = api->CreateView("my-ui.html", [](PrismaView v) {
    // DOM is ready — safe to register JS listeners and invoke
    api->RegisterJSListener(v, "close", [](const char*) {
        api->Unfocus(view);
        api->Hide(view);
    });
    api->Invoke(v, "init()");
});
api->Hide(view);   // views start visible — hide until the player opens yours`;

const FEATURES = [
  {
    icon: '🌐',
    title: 'Real Chromium',
    body: 'CEF 147 — the same engine that powers VS Code. Full ES2020+, WebGL, CSS Grid, Web Audio, Web Workers. No proprietary renderer quirks.',
  },
  {
    icon: '🎮',
    title: 'F4SE native',
    body: 'Deep integration via F4SE messaging. JS listeners run on the main game thread. Direct RE::Actor / GMST / Papyrus property access inside callbacks.',
  },
  {
    icon: '⚙️',
    title: 'Framework-free',
    body: 'Vanilla JS, React, Vue, Svelte — if it ships as HTML/CSS/JS, it runs inside the game. No special build pipeline required.',
  },
  {
    icon: '🤖',
    title: 'AI-ready',
    body: 'prisma-mcp is an MCP server that gives Cursor, Claude Code, and any MCP-compatible AI live access to the full API reference and guides.',
  },
];

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      {/* ── hero ── */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.badge}>CEF 147 · F4SE · Fallout 4</span>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroTagline}>{siteConfig.tagline}</p>
          <div className={styles.heroCta}>
            <Link className={styles.ctaPrimary} to={useBaseUrl('/docs/getting-started')}>
              Get started →
            </Link>
            <Link className={styles.ctaSecondary} to={useBaseUrl('/docs/api-reference')}>
              API reference
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── features ── */}
        <section className={styles.features}>
          <div className={styles.container}>
            <div className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <div key={f.title} className={styles.featureCard}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── quick start ── */}
        <section className={styles.quickStart}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Quick start</h2>
            <p className={styles.sectionSub}>
              One header file. No link-time dependency on the framework DLL. Works in any xmake
              F4SE plugin.
            </p>
            <CodeBlock language="cpp">{QUICK_START}</CodeBlock>
            <Link className={styles.sectionLink} to={useBaseUrl('/docs/getting-started')}>
              Full walkthrough, from scratch →
            </Link>
          </div>
        </section>

        {/* ── AI / MCP ── */}
        <section className={styles.aiSection}>
          <div className={styles.container}>
            <div className={styles.aiCard}>
              <div>
                <h2 className={styles.aiTitle}>🤖 Connect your AI assistant</h2>
                <p className={styles.aiDesc}>
                  <code>prisma-mcp</code> is a Model Context Protocol server that gives Cursor,
                  Claude Code, or any MCP-compatible AI live, structured access to every method in
                  this API reference plus all guides — always up to date, no copy-paste needed.
                </p>
                <div className={styles.aiCta}>
                  <Link className={styles.ctaPrimary} to={useBaseUrl('/docs/getting-started')}>
                    Get started →
                  </Link>
                  <Link className={styles.ctaSecondary} to={useBaseUrl('/docs/api-reference')}>
                    Browse the API
                  </Link>
                </div>
              </div>
              <div>
                <CodeBlock language="bash">{'claude mcp add prisma-mcp -- npx -y prisma-mcp'}</CodeBlock>
                <CodeBlock language="json">{JSON.stringify(
                  { mcpServers: { 'prisma-mcp': { command: 'npx', args: ['-y', 'prisma-mcp'] } } },
                  null,
                  2,
                )}</CodeBlock>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
