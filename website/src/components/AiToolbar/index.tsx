import React, { useState } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type CopyState = 'idle' | 'loading' | 'done' | 'error';

const MCP_TABS = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    code: 'claude mcp add prisma-mcp -- npx -y prisma-mcp',
    note: 'Run once in any terminal. Restart Claude Code afterwards.',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    code: JSON.stringify(
      { mcpServers: { 'prisma-mcp': { command: 'npx', args: ['-y', 'prisma-mcp'] } } },
      null,
      2,
    ),
    note: 'Add to ~/.cursor/mcp.json (create it if missing), then restart Cursor.',
  },
  {
    id: 'vscode',
    label: 'VS Code',
    code: JSON.stringify(
      {
        mcp: {
          servers: { 'prisma-mcp': { type: 'stdio', command: 'npx', args: ['-y', 'prisma-mcp'] } },
        },
      },
      null,
      2,
    ),
    note: 'Add to .vscode/settings.json. Requires an MCP-compatible extension (e.g. GitHub Copilot).',
  },
] as const;

export default function AiToolbar(): JSX.Element {
  const { metadata } = useDoc();
  // raw markdown is served at the same URL as the page + ".md"
  // e.g. /Prisma2.0/docs/getting-started → /Prisma2.0/docs/getting-started.md
  const sourceDocPath = useBaseUrl(`/docs/${metadata.id}.md`);

  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [tabCopied, setTabCopied] = useState<number | null>(null);
  const [claudeCopied, setClaudeCopied] = useState(false);

  async function fetchMarkdown(): Promise<string> {
    const res = await fetch(sourceDocPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  }

  async function handleCopyMarkdown() {
    if (copyState === 'loading') return;
    setCopyState('loading');
    try {
      const text = await fetchMarkdown();
      await navigator.clipboard.writeText(text);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  }

  async function handleCopyTab(idx: number) {
    await navigator.clipboard.writeText(MCP_TABS[idx].code);
    setTabCopied(idx);
    setTimeout(() => setTabCopied(null), 2000);
  }

  async function handleAskClaude() {
    // copy markdown first so the user can paste it into Claude
    try {
      const text = await fetchMarkdown();
      await navigator.clipboard.writeText(text);
      setClaudeCopied(true);
      setTimeout(() => setClaudeCopied(false), 4000);
    } catch {
      // open anyway even if copy fails
    }
    window.open('https://claude.ai/chat', '_blank', 'noopener,noreferrer');
  }

  const copyLabel =
    copyState === 'loading'
      ? 'Copying…'
      : copyState === 'done'
        ? 'Copied'
        : copyState === 'error'
          ? 'Failed'
          : 'Copy as Markdown';

  return (
    <>
      <div className={styles.toolbar}>
        <button
          className={`${styles.btn} ${copyState === 'done' ? styles.btnDone : ''} ${copyState === 'error' ? styles.btnError : ''}`}
          onClick={handleCopyMarkdown}
          disabled={copyState === 'loading'}
          title="Copy this page as raw Markdown"
        >
          {copyLabel}
        </button>
        <button className={styles.btn} onClick={() => setModalOpen(true)} title="AI Tools">
          AI Tools
        </button>
      </div>

      {modalOpen && (
        <div className={styles.backdrop} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>AI Tools</h3>
              <button className={styles.closeBtn} onClick={() => setModalOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            {/* ── MCP section ── */}
            <div className={styles.modalSection}>
              <p className={styles.sectionTitle}>Connect with MCP</p>
              <p className={styles.sectionDesc}>
                <strong>prisma-mcp</strong> is an MCP server that gives Cursor, Claude Code, or any
                MCP-compatible AI live access to the full API reference and guides — always up to
                date, no copy-paste needed.
              </p>

              <div className={styles.tabs}>
                {MCP_TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === i ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab(i)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className={styles.codeWrap}>
                <pre className={styles.pre}>
                  <code>{MCP_TABS[activeTab].code}</code>
                </pre>
                <button className={styles.copyCodeBtn} onClick={() => handleCopyTab(activeTab)}>
                  {tabCopied === activeTab ? '✓' : 'Copy'}
                </button>
              </div>
              <p className={styles.note}>{MCP_TABS[activeTab].note}</p>
            </div>

            <hr className={styles.divider} />

            {/* ── Ask Claude section ── */}
            <div className={styles.modalSection}>
              <p className={styles.sectionTitle}>Ask Claude</p>
              <p className={styles.sectionDesc}>
                Copies this page as Markdown to your clipboard and opens Claude.ai — paste it into
                the chat to ask questions with full context.
              </p>
              <div className={styles.askRow}>
                <button className={styles.btnPrimary} onClick={handleAskClaude}>
                  Copy + Open Claude.ai →
                </button>
                {claudeCopied && (
                  <span className={styles.askNote}>✓ Markdown copied — paste it in Claude!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
