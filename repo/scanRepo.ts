/*
Mini ACI repo listing command.

repo path → file list → important files

Responsibilities:
- recursively scan files
- ignore noisy generated folders
- return relative file paths
- detect important repo-context files
*/

import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".vercel",
  "out",
]);

const IMPORTANT_FILE_PATTERNS = [
  /(^|\/)package\.json$/,
  /(^|\/)README\.md$/i,
  /(^|\/)AGENTS\.md$/i,
  /(^|\/)CLAUDE\.md$/i,
  /(^|\/)\.github\/copilot-instructions\.md$/,

  /(^|\/)tsconfig\.json$/,
  /(^|\/)next\.config\.(js|mjs|ts)$/,
  /(^|\/)vite\.config\.(js|mjs|ts)$/,
  /(^|\/)turbo\.json$/,
  /(^|\/)eslint\.config\.(js|mjs|ts)$/,
  /(^|\/)biome\.json$/,

  /(^|\/)docker-compose\.(yml|yaml)$/,
  /(^|\/)Dockerfile$/,

  /(^|\/)prisma\/schema\.prisma$/,

  /(^|\/)\.env\.example$/,
  /(^|\/)bun\.lock$/,
  /(^|\/)bun\.lockb$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)package-lock\.json$/,

  /(^|\/)go\.mod$/,
  /(^|\/)Cargo\.toml$/,
  /(^|\/)pyproject\.toml$/,
  /(^|\/)requirements\.txt$/,
];

export type RepoScanResult = {
  repoPath: string;
  files: string[];
  importantFiles: string[];
  ignoredDirs: string[];
};

function shouldIgnoreDir(dirName: string) {
  return IGNORED_DIRS.has(dirName);
}

function normalizePath(relativePath: string) {
  return relativePath.split(path.sep).join("/");
}

function isImportantFile(relativePath: string) {
  const normalized = normalizePath(relativePath);
  return IMPORTANT_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

async function walkRepo(rootPath: string, currentPath: string, files: string[]) {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && shouldIgnoreDir(entry.name)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = path.relative(rootPath, absolutePath);

    if (entry.isDirectory()) {
      await walkRepo(rootPath, absolutePath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push(normalizePath(relativePath));
    }
  }
}

export async function scanRepo(repoPath: string): Promise<RepoScanResult> {
  const absoluteRepoPath = path.resolve(repoPath);

  let repoStat;
  try {
    repoStat = await stat(absoluteRepoPath);
  } catch {
    throw new Error(
      `Repo path does not exist: ${absoluteRepoPath}\n\n` +
        `Tip: --repo is resolved from your current terminal directory.\n` +
        `Run "pwd" and "ls .." to verify the correct relative path.`,
    );
  }

  if (!repoStat.isDirectory()) {
    throw new Error(`Repo path is not a directory: ${absoluteRepoPath}`);
  }

  const files: string[] = [];
  await walkRepo(absoluteRepoPath, absoluteRepoPath, files);

  files.sort();

  return {
    repoPath: absoluteRepoPath,
    files,
    importantFiles: files.filter(isImportantFile),
    ignoredDirs: Array.from(IGNORED_DIRS),
  };
}