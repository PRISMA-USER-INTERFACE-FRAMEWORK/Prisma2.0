#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getApiMethodDoc } from "./tools/getApiMethod.js";
import { getGuide, GUIDE_NAMES } from "./tools/getGuide.js";
import { getHeader } from "./tools/getHeader.js";
import { listApiMethods } from "./tools/listApiMethods.js";
import { scaffoldPlugin } from "./tools/scaffoldPlugin.js";
import { searchDocs } from "./tools/searchDocs.js";

const server = new McpServer({
  name: "prisma-mcp",
  version: "1.0.0",
});

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

server.tool(
  "list_api_methods",
  "List every public PrismaUI_F4 API method (name, interface version, one-line summary). " +
    "Optionally filter to methods added in a specific interface version (e.g. \"V5\").",
  { sinceVersion: z.string().optional().describe('Interface version filter, e.g. "V5" or "5".') },
  async ({ sinceVersion }) => {
    try {
      const entries = await listApiMethods(sinceVersion);
      return textResult(JSON.stringify(entries, null, 2));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "get_api_method",
  "Get the full documentation for one PrismaUI_F4 API method by name (e.g. \"CreateView\", " +
    "\"BindViewToGeometry\", \"SetViewOffscreenBackground\") - signature, parameters, return " +
    "value, threading notes, call-order requirements, and a usage example.",
  { name: z.string().describe('Exact method name, e.g. "CreateView".') },
  async ({ name }) => {
    try {
      const doc = await getApiMethodDoc(name);
      return textResult(doc.content);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "search_docs",
  "Keyword search across every API method doc and top-level guide. Use this when you don't " +
    "know the exact method name - e.g. searching \"gamepad\" or \"mesh\" or \"transparent\".",
  { query: z.string().describe("Search term or short phrase.") },
  async ({ query }) => {
    try {
      const results = await searchDocs(query);
      if (results.length === 0) {
        return textResult(`No matches for "${query}".`);
      }
      return textResult(JSON.stringify(results, null, 2));
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "get_guide",
  `Get the full text of one of PrismaUI_F4's top-level guides: ${GUIDE_NAMES.join(", ")}.`,
  { name: z.enum(GUIDE_NAMES as [string, ...string[]]).describe("Which guide to fetch.") },
  async ({ name }) => {
    try {
      const content = await getGuide(name);
      return textResult(content);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "get_header",
  "Get the full, current PrismaUI_F4_API.h C++ header - the ground-truth source for every " +
    "method's exact signature, parameter order, default values, and interface version. Use " +
    "this before writing or checking any C++ code that calls the API.",
  {},
  async () => {
    try {
      const content = await getHeader();
      return textResult(content);
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

server.tool(
  "scaffold_plugin",
  "Create a new, ready-to-build F4SE plugin project at a local path by copying and renaming " +
    "PrismaUI_F4's example plugin (the same one docs/getting-started.md recommends starting " +
    "from). Writes real files to disk under targetPath - only call this after the user has " +
    "confirmed the target path and plugin name.",
  {
    pluginName: z
      .string()
      .describe('Plugin name, e.g. "MyPlugin_F4". Letters/digits/hyphens/underscores, starting with a letter.'),
    targetPath: z.string().describe("Local filesystem path to create the project at."),
    overwrite: z
      .boolean()
      .optional()
      .describe("Write into targetPath even if it already exists and is non-empty. Default false."),
  },
  async ({ pluginName, targetPath, overwrite }) => {
    try {
      const result = await scaffoldPlugin(pluginName, targetPath, overwrite ?? false);
      return textResult(
        `Scaffolded "${pluginName}" at ${result.targetPath}\n\n` +
          `Files written (${result.filesWritten.length}):\n` +
          result.filesWritten.map((f) => `  ${f}`).join("\n")
      );
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("prisma-mcp failed to start:", err);
  process.exit(1);
});
