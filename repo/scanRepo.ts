/*
Mini ACI report listing command

repo path → list of files → important files

- recursively scan files
- ignore node_modules, .git, dist, build, .next, coverage
- return file paths
- detect important files ( we provide the initial list of important files )
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
  /^package\.json$/,
  /^README\.md$/i,
  /^AGENTS\.md$/i,
  /^CLAUDE\.md$/i,
  /^tsconfig\.json$/,
  /^next\.config\.(js|mjs|ts)$/,
  /^vite\.config\.(js|mjs|ts)$/,
  /^docker-compose\.(yml|yaml)$/,
  /^Dockerfile$/,
  /^prisma\/schema\.prisma$/,
  /^bun\.lock$/,
  /^bun\.lockb$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^package-lock\.json$/,
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

function isImportantFile(relativePath: string) {
  const normalized = relativePath.split(path.sep).join("/");
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
      files.push(relativePath);
    }
  }
}

export async function scanRepo(repoPath: string): Promise<RepoScanResult> {
  const absoluteRepoPath = path.resolve(repoPath);
  const repoStat = await stat(absoluteRepoPath);

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