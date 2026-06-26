import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepoScanResult } from "./scanRepo";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm" | "unknown";

export type ProjectMetadata = {
  packageManager: PackageManager;
  frameworkHints: string[];
  scripts: Record<string, string>;
  packageJsonFiles: string[];
};

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

function hasFile(scan: RepoScanResult, fileName: string) {
  return scan.files.includes(fileName);
}

function detectPackageManager(scan: RepoScanResult): PackageManager {
  if (hasFile(scan, "bun.lock") || hasFile(scan, "bun.lockb")) return "bun";
  if (hasFile(scan, "pnpm-lock.yaml")) return "pnpm";
  if (hasFile(scan, "yarn.lock")) return "yarn";
  if (hasFile(scan, "package-lock.json")) return "npm";
  return "unknown";
}

async function readPackageJson(
  repoPath: string,
  relativePath: string,
): Promise<PackageJson | null> {
  try {
    const absolutePath = path.join(repoPath, relativePath);
    const raw = await readFile(absolutePath, "utf8");
    return JSON.parse(raw) as PackageJson;
  } catch {
    return null;
  }
}

function addDependencyHints(
  hints: Set<string>,
  pkg: PackageJson,
  filePath: string,
) {
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };

  if (deps.next) hints.add("Next.js");
  if (deps.react) hints.add("React");
  if (deps.express) hints.add("Express");
  if (deps["@prisma/client"] || deps.prisma) hints.add("Prisma");
  if (deps.typescript) hints.add("TypeScript");
  if (deps.turbo) hints.add("Turborepo");
  if (deps.vite) hints.add("Vite");
  if (deps.tailwindcss || deps["@tailwindcss/postcss"]) hints.add("Tailwind CSS");
}

function addFileBasedHints(hints: Set<string>, scan: RepoScanResult) {
  for (const file of scan.files) {
    if (file.endsWith("next.config.ts") || file.endsWith("next.config.mjs")) {
      hints.add("Next.js");
    }

    if (file.endsWith("prisma/schema.prisma")) {
      hints.add("Prisma");
    }

    if (file.endsWith("turbo.json")) {
      hints.add("Turborepo");
    }

    if (file.endsWith("docker-compose.yml") || file.endsWith("Dockerfile")) {
      hints.add("Docker");
    }

    if (file.endsWith("tailwind.config.ts") || file.endsWith("postcss.config.mjs")) {
      hints.add("Tailwind CSS");
    }
  }
}

export async function detectProject(scan: RepoScanResult): Promise<ProjectMetadata> {
  const packageJsonFiles = scan.files.filter((file) => file.endsWith("package.json"));

  const rootPackageJson = await readPackageJson(scan.repoPath, "package.json");

  const hints = new Set<string>();
  addFileBasedHints(hints, scan);

  for (const filePath of packageJsonFiles) {
    const pkg = await readPackageJson(scan.repoPath, filePath);
    if (!pkg) continue;

    addDependencyHints(hints, pkg, filePath);
  }

  return {
    packageManager: detectPackageManager(scan),
    frameworkHints: Array.from(hints),
    scripts: rootPackageJson?.scripts ?? {},
    packageJsonFiles,
  };
}