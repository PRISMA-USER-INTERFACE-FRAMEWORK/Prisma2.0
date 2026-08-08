import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

const QUICK_START = `// 1. request the api on kGameDataReady
auto* api = PRISMA_UI_API::RequestPluginAPI<IVPrismaUI2>();

// 2. create a view on kPostLoadGame / kNewGame
PrismaView view = api->CreateView("my-ui.html", [](PrismaView v) {
    api->RegisterJSListener(v, "close", [](const char*) {
        api->Unfocus(view);
        api->Hide(view);
    });
    api->Invoke(v, "init()");
});
api->Hide(view);   // views start visible — hide until the player opens yours`;

const FEATURES = [
  {
    label: 'Real Chromium',
    title: 'CEF 147',
    body: 'The same engine that powers VS Code. Full ES2020+, WebGL, CSS Grid, Web Audio, and Web Workers — no proprietary renderer quirks.',
  },
  {
    label: 'F4SE Native',
    title: 'Deep integration',
    body: 'JS listeners run on the main game thread. Direct access to RE::Actor, GMSTs, and Papyrus properties from inside callbacks.',
  },
  {
    label: 'Framework Agnostic',
    title: 'Any web stack',
    body: 'Vanilla JS, React, Vue, Svelte — if it ships as HTML, CSS, and JS, it runs inside the game. No special build pipeline required.',
  },
  {
    label: 'AI-Ready',
    title: 'prisma-mcp',
    body: 'An MCP server that gives Cursor, Claude Code, and any MCP-compatible AI live, structured access to every method and guide.',
  },
];

export default function Home(): JSX.Element {
  const gettingStartedUrl = useBaseUrl('/docs/getting-started');
  const apiReferenceUrl = useBaseUrl('/docs/api-reference');
  const logoUrl = useBaseUrl('/img/prisma-logo.png');

  return (
    <Layout
      title="PrismaUI F4 — HTML/JS UI framework for Fallout 4"
      description="Render any HTML, CSS, and JavaScript interface inside Fallout 4 using Chromium (CEF 147). Deep F4SE integration. Supports React, Vue, Svelte, and vanilla JS."
    >
      {/* hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <img src={logoUrl} alt="PrismaUI F4" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>PrismaUI F4</h1>
          <p className={styles.heroTagline}>
            HTML, CSS, and JavaScript UI framework for Fallout 4
          </p>
          <p className={styles.heroSub}>
            Powered by CEF 147 — real Chromium, the same engine as VS Code.
            Deep F4SE integration. Supports any web framework.
          </p>
          <div className={styles.heroCta}>
            <Link className={styles.ctaPrimary} to={gettingStartedUrl}>
              Get started
            </Link>
            <Link className={styles.ctaSecondary} to={apiReferenceUrl}>
              API reference
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* features */}
        <section className={styles.features}>
          <div className={styles.container}>
            <div className={styles.featureGrid}>
              {FEATURES.map((f) => (
                <div key={f.label} className={styles.featureCard}>
                  <span className={styles.featureLabel}>{f.label}</span>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* quick start */}
        <section className={styles.quickStart}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Five minutes to a working UI</h2>
            <p className={styles.sectionSub}>
              One header file. No link-time dependency on the framework DLL.
              Works in any xmake F4SE plugin.
            </p>
            <CodeBlock language="cpp">{QUICK_START}</CodeBlock>
            <Link className={styles.sectionLink} to={gettingStartedUrl}>
              Full walkthrough, from scratch →
            </Link>
          </div>
        </section>

        {/* MCP */}
        <section className={styles.mcpSection}>
          <div className={styles.container}>
            <div className={styles.mcpCard}>
              <div className={styles.mcpText}>
                <h2 className={styles.mcpTitle}>Connect your AI assistant</h2>
                <p className={styles.mcpDesc}>
                  <code>prisma-mcp</code> is a Model Context Protocol server that gives
                  Cursor, Claude Code, and any MCP-compatible AI live, structured access
                  to the full API reference and all guides — always up to date.
                </p>
                <div className={styles.mcpActions}>
                  <Link className={styles.ctaPrimary} to={gettingStartedUrl}>
                    Get started
                  </Link>
                  <Link className={styles.ctaSecondary} to={apiReferenceUrl}>
                    Browse the API
                  </Link>
                </div>
              </div>
              <div className={styles.mcpCode}>
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
