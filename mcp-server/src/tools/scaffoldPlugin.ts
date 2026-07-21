import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fetchRawFile, listPathsUnder } from "../github.js";

const EXAMPLE_PREFIX = "example-f4se-plugin/";
// The literal token used throughout the example plugin's source, build script,
// and xmake config for its own name - substituting it renames the whole project.
const EXAMPLE_TOKEN = "PrismaUI-F4-Example";

const PLUGIN_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export interface ScaffoldResult {
  targetPath: string;
  filesWritten: string[];
}

async function isNonEmptyDir(path: string): Promise<boolean> {
  try {
    const entries = await readdir(path);
    return entries.length > 0;
  } catch {
    return false; // doesn't exist, or isn't a directory - treat as "not a blocking non-empty dir"
  }
}

export async function scaffoldPlugin(
  pluginName: string,
  targetPath: string,
  overwrite = false
): Promise<ScaffoldResult> {
  if (!PLUGIN_NAME_PATTERN.test(pluginName)) {
    throw new Error(
      `Invalid plugin name "${pluginName}". Use letters, digits, hyphens, and underscores, starting with a letter (e.g. "MyPlugin_F4").`
    );
  }

  const absTarget = resolve(targetPath);

  if (!overwrite && (await isNonEmptyDir(absTarget))) {
    throw new Error(
      `"${absTarget}" already exists and is not empty. Pass overwrite=true if you really want to write into it.`
    );
  }

  const sourcePaths = await listPathsUnder(EXAMPLE_PREFIX);
  if (sourcePaths.length === 0) {
    throw new Error(`Found no files under "${EXAMPLE_PREFIX}" in the repo - this shouldn't happen.`);
  }

  const filesWritten: string[] = [];

  for (const sourcePath of sourcePaths) {
    const relativePath = sourcePath.slice(EXAMPLE_PREFIX.length);
    const destPath = join(absTarget, relativePath);

    const rawContent = await fetchRawFile(sourcePath);
    const renamedContent = rawContent.split(EXAMPLE_TOKEN).join(pluginName);

    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, renamedContent, "utf8");
    filesWritten.push(relativePath);
  }

  return { targetPath: absTarget, filesWritten };
}
