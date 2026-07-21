import { fetchRawFile, listPathsUnder } from "../github.js";

const API_DOC_PREFIX = "docs/api/";

export interface ApiMethodDoc {
  name: string;
  path: string;
  content: string;
}

function pathToName(path: string): string {
  const file = path.slice(API_DOC_PREFIX.length);
  return file.endsWith(".md") ? file.slice(0, -3) : file;
}

export async function listApiMethodNames(): Promise<string[]> {
  const paths = await listPathsUnder(API_DOC_PREFIX);
  return paths.filter((p) => p.endsWith(".md")).map(pathToName).sort();
}

export async function getApiMethodDoc(name: string): Promise<ApiMethodDoc> {
  const path = `${API_DOC_PREFIX}${name}.md`;
  try {
    const content = await fetchRawFile(path);
    return { name, path, content };
  } catch (err) {
    const allNames = await listApiMethodNames();
    const lowerName = name.toLowerCase();
    const closeMatches = allNames.filter((n) => n.toLowerCase().includes(lowerName) || lowerName.includes(n.toLowerCase()));
    const suggestion = closeMatches.length > 0
      ? ` Did you mean: ${closeMatches.slice(0, 5).join(", ")}?`
      : ` Use list_api_methods to see all valid names.`;
    throw new Error(`No API method named "${name}".${suggestion}`);
  }
}

export function extractSinceVersion(content: string): string | undefined {
  // Docs write the full interface class name, e.g. "**Since:** `IVPrismaUI5`".
  const match = content.match(/\*\*Since:\*\*\s*`IVPrismaUI(\d+)`/);
  return match ? `V${match[1]}` : undefined;
}

export function extractSummary(content: string): string {
  // Summary is the first paragraph of prose after the first fenced code block
  // (the C++ signature) and before the next "## " heading.
  const parts = content.split("```");
  const afterSignature = parts.length >= 3 ? parts.slice(2).join("```") : content;
  const beforeNextHeading = afterSignature.split(/\n##\s/)[0];
  return beforeNextHeading
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"))
    .join(" ")
    .trim();
}
