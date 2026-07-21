export const REPO_OWNER = "PRISMA-USER-INTERFACE-FRAMEWORK";
export const REPO_NAME = "Prisma2.0";
export const REPO_BRANCH = "main";

export const GUIDE_FILES: Record<string, string> = {
  "getting-started": "docs/getting-started.md",
  "examples": "docs/examples.md",
  "html-views": "docs/html-views.md",
  "limitations": "docs/limitations.md",
  "view-lifecycle": "docs/view-lifecycle.md",
  "api-reference": "docs/api-reference.md",
  "1.0-vs-2.0": "docs/1.0-vs-2.0.md",
};

export interface GitTreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree" | "commit";
  sha: string;
  size?: number;
  url: string;
}

export interface GitTreeResponse {
  sha: string;
  tree: GitTreeEntry[];
  truncated: boolean;
}
