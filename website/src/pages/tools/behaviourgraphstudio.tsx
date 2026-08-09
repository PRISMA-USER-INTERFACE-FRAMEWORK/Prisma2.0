import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const GUIDE_PAGES = [
  {
    title: 'Getting Started',
    href: '/tools/behaviourgraphstudio/guide/getting-started',
    body: 'Download, run it, and open your first behaviour file, from disk or straight out of a .ba2 archive.',
  },
  {
    title: 'Tree & Graph View',
    href: '/tools/behaviourgraphstudio/guide/tree-and-graph-view',
    body: 'See the whole object graph, filter it, and trace one state’s paths through hundreds of nodes.',
  },
  {
    title: 'Editing Nodes',
    href: '/tools/behaviourgraphstudio/guide/editing-nodes',
    body: 'Edit any field in the properties panel, add new clips and blenders, and reuse shapes as templates.',
  },
  {
    title: 'Symbols & Variables',
    href: '/tools/behaviourgraphstudio/guide/symbols-and-variables',
    body: 'Add, rename, and bound variables and events without needing a Java runtime.',
  },
  {
    title: 'Saving & Validating',
    href: '/tools/behaviourgraphstudio/guide/saving-and-validating',
    body: 'Catch a crash-on-load before it happens, and save with an automatic .bak backup.',
  },
];

export default function BehaviorGraphStudio(): JSX.Element {
  const screenshotUrl = useBaseUrl('/img/behaviourgraphstudio.webp');

  return (
    <Layout
      title="Behavior Graph Studio"
      description="A visual editor for Fallout 4's Havok behaviour graphs. Open, edit, and save animation state machines directly."
    >
      <header className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>.NET / Avalonia</span>
            <span className={styles.badge}>Beta</span>
          </div>
          <h1 className={styles.detailTitle}>Behavior Graph Studio</h1>
          <p className={styles.detailSub}>
            A standalone editor for Fallout 4&apos;s Havok behaviour graphs. See the real object
            graph instead of raw XML, edit any field, add and rewire clips, blenders, and states,
            then save straight back to <code>.hkx</code>.
          </p>
          <div className={styles.heroCta}>
            <a
              className={styles.ctaPrimary}
              href="https://www.nexusmods.com/fallout4/mods/107691"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download on Nexus
            </a>
            <Link className={styles.ctaSecondary} to="/tools/behaviourgraphstudio/guide/getting-started">
              Read the guide
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* what it is */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>What it is</h2>
            <p className={styles.bodyText}>
              Fallout 4 keeps its animation logic in behaviour files: which clip plays, when, how
              it blends, and what events fire. Havok never released the authoring tool for this
              format, and the editors that exist for other games target an older Havok version
              that won&apos;t open a Fallout 4 file. Behavior Graph Studio reads the Fallout 4
              format directly, with no Havok Content Tools and no Java runtime needed for most
              edits.
            </p>
            <div className={styles.showcaseImgWrap}>
              <img
                src={screenshotUrl}
                alt="Behavior Graph Studio's playback view rendering Dogmeat's wireframe skeleton"
                className={styles.showcaseImg}
              />
            </div>
          </div>
        </section>

        {/* guide */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Guide</h2>
            <p className={styles.bodyText}>
              A full walkthrough, from opening your first file to saving a verified edit.
            </p>
            <div className={styles.cardGrid} style={{marginTop: 24}}>
              {GUIDE_PAGES.map((page) => (
                <Link key={page.href} to={page.href} className={styles.card}>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle} style={{fontSize: '1.1rem'}}>
                      {page.title}
                    </h3>
                    <p className={styles.cardDesc}>{page.body}</p>
                    <span className={styles.cardLink}>Read →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className={styles.callout}>
              <strong>Beta status:</strong> field value edits (like changing a clip&apos;s
              playback speed) are confirmed working in-game. Structural edits, such as adding a
              state, removing one, or retargeting a transition, are validated against the file
              format and Havok&apos;s own tooling but have not yet been confirmed loading in
              Fallout 4 itself. Keep the <code>.bak</code> file.
            </div>
          </div>
        </section>

        <div className={styles.container}>
          <Link className={styles.backLink} to="/tools">
            ← Back to Tools
          </Link>
        </div>
      </main>
    </Layout>
  );
}
