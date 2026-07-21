import { GitTreeEntry, GitTreeResponse, REPO_BRANCH, REPO_NAME, REPO_OWNER } from "./types.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function githubApiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "prisma-mcp",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchRawFile(path: string): Promise<string> {
  const cacheKey = `raw:${path}`;
  const cached = getCached<string>(cacheKey);
  if (cached !== undefined) return cached;

  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${path}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "prisma-mcp" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: HTTP ${res.status}`);
  }
  const text = await res.text();
  setCached(cacheKey, text);
  return text;
}

export async function fetchTree(): Promise<GitTreeEntry[]> {
  const cacheKey = "tree";
  const cached = getCached<GitTreeEntry[]>(cacheKey);
  if (cached !== undefined) return cached;

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_BRANCH}?recursive=1`;
  const res = await fetch(url, {
    headers: githubApiHeaders(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch repo tree: HTTP ${res.status}. If you're hitting GitHub's rate limit, set a GITHUB_TOKEN env var.`
    );
  }
  const data = (await res.json()) as GitTreeResponse;
  if (data.truncated) {
    throw new Error("Repo tree response was truncated by GitHub's API - this shouldn't happen for a repo this size.");
  }
  setCached(cacheKey, data.tree);
  return data.tree;
}

export async function listPathsUnder(prefix: string): Promise<string[]> {
  const tree = await fetchTree();
  return tree
    .filter((entry) => entry.type === "blob" && entry.path.startsWith(prefix))
    .map((entry) => entry.path);
}
