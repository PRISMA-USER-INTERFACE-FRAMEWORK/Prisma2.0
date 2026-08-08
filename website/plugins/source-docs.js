// copies website/docs/ (the synced snapshot) into build/source-docs/ so
// the "Copy as Markdown" button can fetch the raw .md at runtime.
const { cpSync } = require('fs');
const path = require('path');

module.exports = function sourceDocsPlugin(context) {
  return {
    name: 'source-docs-plugin',
    async postBuild({ outDir }) {
      const src = path.join(context.siteDir, 'docs');
      const dest = path.join(outDir, 'source-docs');
      cpSync(src, dest, { recursive: true, force: true });
    },
  };
};
