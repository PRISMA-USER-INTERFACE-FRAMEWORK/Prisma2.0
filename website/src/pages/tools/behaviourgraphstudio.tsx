import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const GUIDE_STEPS = [
  {
    title: 'Open a file',
    body: 'Open any Fallout 4 behaviour, character, or project .hkx from disk. Or use "From archive..." to read straight out of a .ba2 without unpacking it — type a few words (e.g. "dogmeat behavior") to filter the archive’s index. Files opened this way are read-only copies until you save them somewhere of your own.',
  },
  {
    title: 'Browse the Tree or Graph view',
    body: 'The Tree view lists every object by nesting and Havok class. The Graph view lays the same objects out as a node canvas, columns by depth from the root, with edges drawn from the real reference fields — so every edge says why it exists.',
  },
  {
    title: 'Click a node to edit it',
    body: 'Every field on the selected node appears in the properties panel: animation name, playback speed, crop times, flags, weights, ids — one box each. Type, tab out, and the change is staged.',
  },
  {
    title: 'Use the Symbols and Chain tabs',
    body: 'Symbols lists every variable and event with its type, initial value, and every place it’s referenced — add, rename, retype, or bound one without needing Java. Chain shows project → character → behaviour → skeleton → animations, and what’s missing along the way.',
  },
  {
    title: 'Check the project, then save',
    body: 'Run "Check project" to validate before writing anything — it catches states with no generator, the specific issue that used to crash the game on load. Save writes back to .hkx and keeps your original as a .bak.',
  },
];

export default function BehaviourGraphStudio(): JSX.Element {
  const screenshotUrl = useBaseUrl('/img/behaviourgraphstudio.webp');

  return (
    <Layout
      title="BehaviourGraphStudio"
      description="A visual editor for Fallout 4's Havok behaviour graphs. Open, edit, and save animation state machines directly."
    >
      <header className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>.NET / Avalonia</span>
            <span className={styles.badge}>Beta</span>
          </div>
          <h1 className={styles.detailTitle}>BehaviourGraphStudio</h1>
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
            <a
              className={styles.ctaSecondary}
              href="https://github.com/NomadsReach/BehaviorGraphStudio"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source
            </a>
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
              that won&apos;t open a Fallout 4 file. BehaviourGraphStudio reads the Fallout 4
              format directly — no Havok Content Tools, no Java runtime for most edits.
            </p>
            <div className={styles.showcaseImgWrap}>
              <img
                src={screenshotUrl}
                alt="BehaviourGraphStudio's playback view rendering Dogmeat's wireframe skeleton"
                className={styles.showcaseImg}
              />
            </div>
          </div>
        </section>

        {/* guide */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>How to use it</h2>
            <p className={styles.bodyText}>
              Five steps from opening a file to saving a verified edit.
            </p>
            <div className={styles.guideList}>
              {GUIDE_STEPS.map((step, i) => (
                <div key={step.title} className={styles.guideStep}>
                  <span className={styles.guideNum}>{i + 1}</span>
                  <p className={styles.guideStepText}>
                    <strong>{step.title}.</strong> {step.body}
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.callout}>
              <strong>Beta status:</strong> field value edits (like changing a clip&apos;s
              playback speed) are confirmed working in-game. Structural edits — adding a
              state, removing one, retargeting a transition — are validated against the
              file format and Havok&apos;s own tooling but have not yet been confirmed loading in
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
