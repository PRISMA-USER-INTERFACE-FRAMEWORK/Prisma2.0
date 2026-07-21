# prisma-mcp

An MCP (Model Context Protocol) server that gives an AI assistant direct, always-current access to
the [PrismaUI_F4](https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0) API reference and
guides, plus a tool to scaffold a new plugin project from the official example.

Everything is fetched live from this repo's GitHub `main` branch at call time (with a short
in-memory cache) - there's no bundled copy to go stale. If the docs or API header change, this
server reflects that on the next call.

## Install

Clone this repo and build once:

```
git clone https://github.com/PRISMA-USER-INTERFACE-FRAMEWORK/Prisma2.0.git
cd Prisma2.0/mcp-server
npm install
npm run build
```

Then add it to Claude Code (or any MCP-compatible client that supports a command-based stdio
server), pointing at the built entrypoint:

```
claude mcp add prisma -- node /full/path/to/Prisma2.0/mcp-server/dist/index.js
```

### Rate limits

Every tool call fetches from GitHub. Unauthenticated requests are capped at 60/hour, which is
usually fine for a single session but can run out during heavy use. Set a `GITHUB_TOKEN`
environment variable (a plain read-only personal access token is enough) to raise that to
5000/hour.

## Tools

- **`list_api_methods`** - every public API method's name, interface version, and one-line
  summary. Optional `sinceVersion` filter (e.g. `"V5"`).
- **`get_api_method`** - full docs for one method by name (signature, parameters, returns,
  threading, call-order notes, example).
- **`search_docs`** - keyword search across every method doc and guide, for when you don't know
  the exact method name.
- **`get_guide`** - one of the top-level guides: `getting-started`, `examples`, `html-views`,
  `limitations`, `view-lifecycle`, `api-reference`, `1.0-vs-2.0`.
- **`get_header`** - the full, current `PrismaUI_F4_API.h` - ground truth for exact signatures.
- **`scaffold_plugin`** - writes a new, ready-to-build plugin project to a local path, copied and
  renamed from the official example plugin. Only writes inside the path you give it.

## Development

```
npm install
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

The [Inspector](https://github.com/modelcontextprotocol/inspector) opens a local UI for calling
each tool directly and checking the response, without needing a full MCP client.

## License

MIT (see [LICENSE](LICENSE)). This covers this server's own code only - the PrismaUI_F4 docs,
header, and example plugin it fetches remain under their own license, described in this repo's
top-level [LICENSE.md](../LICENSE.md).
