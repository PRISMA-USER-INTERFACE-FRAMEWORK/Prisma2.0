// generates build/llms.txt for LLM scrapers following the llmstxt.org spec.
const fs = require('fs');
const path = require('path');

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/`/g, '').trim() : null;
}

const GUIDES = [
  'getting-started',
  'html-views',
  'view-lifecycle',
  'modern-frameworks',
  'examples',
  'limitations',
  'papyrus-bridge',
  'translations',
  'api-reference',
];

module.exports = function llmsTxtPlugin(context) {
  return {
    name: 'llms-txt-plugin',
    async postBuild({ outDir, siteConfig }) {
      const base = siteConfig.url + siteConfig.baseUrl.replace(/\/$/, '');
      const docsDir = path.join(context.siteDir, 'docs');

      const guideLines = GUIDES.map((id) => {
        const raw = fs.readFileSync(path.join(docsDir, `${id}.md`), 'utf8');
        const title = extractTitle(raw) || id;
        return `- [${title}](${base}/docs/${id})`;
      });

      const apiLines = fs
        .readdirSync(path.join(docsDir, 'api'))
        .filter((f) => f.endsWith('.md') && f !== 'vr-extension.md')
        .sort()
        .map((f) => {
          const id = f.replace('.md', '');
          const raw = fs.readFileSync(path.join(docsDir, 'api', f), 'utf8');
          const title = extractTitle(raw) || id;
          return `- [${title}](${base}/docs/api/${id})`;
        });

      const lines = [
        '# PrismaUI F4',
        '',
        '> HTML/CSS/JS UI framework for Fallout 4.',
        '> Powered by CEF 147 (real Chromium). F4SE native integration.',
        '> Install `npx -y prisma-mcp` to give any MCP-compatible AI assistant live access to these docs.',
        '',
        '## Guides',
        '',
        ...guideLines,
        '',
        '## API Reference',
        '',
        `- [API Overview](${base}/docs/api-reference)`,
        ...apiLines,
        '',
        '## Optional',
        '',
        `- [VR Extension](${base}/docs/api/vr-extension)`,
        `- [1.0 vs 2.0](${base}/docs/1.0-vs-2.0)`,
        `- [Changelog](${base}/docs/changelog)`,
        '',
      ];

      fs.writeFileSync(path.join(outDir, 'llms.txt'), lines.join('\n'));
      console.log('[llms-txt] generated llms.txt');
    },
  };
};
