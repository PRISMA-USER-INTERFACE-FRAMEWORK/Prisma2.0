import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
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

/**
 * Checks the target path is safe to write into: either it doesn't exist yet, or it's an
 * empty directory, or the caller passed overwrite=true. Throws with a clear, specific
 * message otherwise - including the case where targetPath exists but is a regular file,
 * which would otherwise surface later as a confusing ENOTDIR mid-write.
 */
async function assertWritableTarget(absTarget: string, overwrite: boolean): Promise<void> {
  let stats;
  try {
    stats = await stat(absTarget);
  } catch {
    return; // doesn't exist - safe to create
  }

  if (!stats.isDirectory()) {
    throw new Error(`"${absTarget}" already exists and is not a directory.`);
  }

  if (overwrite) return;

  const entries = await readdir(absTarget);
  if (entries.length > 0) {
    throw new Error(
      `"${absTarget}" already exists and is not empty. Pass overwrite=true if you really want to write into it.`
    );
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
  await assertWritableTarget(absTarget, overwrite);

  const sourcePaths = await listPathsUnder(EXAMPLE_PREFIX);
  if (sourcePaths.length === 0) {
    throw new Error(`Found no files under "${EXAMPLE_PREFIX}" in the repo - this shouldn't happen.`);
  }

  // Fetch everything before writing anything, so a mid-fetch failure (network blip, rate
  // limit) never leaves a half-scaffolded project on disk.
  const files = await Promise.all(
    sourcePaths.map(async (sourcePath) => {
      const relativePath = sourcePath.slice(EXAMPLE_PREFIX.length);
      const destPath = resolve(absTarget, relativePath);
      if (relative(absTarget, destPath).startsWith("..")) {
        // Defense in depth - every path here comes from GitHub's own tree API for this
        // exact repo, so this should be unreachable, but never write outside absTarget.
        throw new Error(`Refusing to write outside the target directory: ${relativePath}`);
      }
      const rawContent = await fetchRawFile(sourcePath);
      const renamedContent = rawContent.split(EXAMPLE_TOKEN).join(pluginName);
      return { relativePath, destPath, content: renamedContent };
    })
  );

  const filesWritten: string[] = [];
  for (const file of files) {
    await mkdir(dirname(file.destPath), { recursive: true });
    await writeFile(file.destPath, file.content, "utf8");
    filesWritten.push(file.relativePath);
  }

  return { targetPath: absTarget, filesWritten };
}
