import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepoScanResult } from "./scanRepo";

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm" | "unknown";

export type RepoShape = "single-package" | "workspace" | "monorepo";

export type ProjectMetadata = {
  packageManager: PackageManager;
  repoShape: RepoShape;
  languageHints: string[];
  frameworkHints: string[];
  toolingHints: string[];
  scripts: Record<string, string>;
  packageJsonFiles: string[];
  workspaceHints: string[];
};

type PackageJson = {
  name?: string;
  private?: boolean;
  workspaces?: string[] | { packages?: string[] };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type HintCategory = "language" | "framework" | "tooling";

type DependencyRule = {
  names: string[];
  hint: string;
  category: HintCategory;
};

type FileRule = {
  patterns: RegExp[];
  hint: string;
  category: HintCategory;
};

const DEPENDENCY_RULES: DependencyRule[] = [
  {
    names: ["typescript"],
    hint: "TypeScript",
    category: "language",
  },
  {
    names: ["next"],
    hint: "Next.js",
    category: "framework",
  },
  {
    names: ["react"],
    hint: "React",
    category: "framework",
  },
  {
    names: ["express"],
    hint: "Express",
    category: "framework",
  },
  {
    names: ["fastify"],
    hint: "Fastify",
    category: "framework",
  },
  {
    names: ["@nestjs/core"],
    hint: "NestJS",
    category: "framework",
  },
  {
    names: ["vite"],
    hint: "Vite",
    category: "tooling",
  },
  {
    names: ["turbo"],
    hint: "Turborepo",
    category: "tooling",
  },
  {
    names: ["prisma", "@prisma/client"],
    hint: "Prisma",
    category: "tooling",
  },
  {
    names: ["tailwindcss", "@tailwindcss/postcss"],
    hint: "Tailwind CSS",
    category: "tooling",
  },
];

const FILE_RULES: FileRule[] = [
  {
    patterns: [/(^|\/)tsconfig\.json$/],
    hint: "TypeScript",
    category: "language",
  },
  {
    patterns: [/(^|\/)go\.mod$/],
    hint: "Go",
    category: "language",
  },
  {
    patterns: [/(^|\/)Cargo\.toml$/],
    hint: "Rust",
    category: "language",
  },
  {
    patterns: [/(^|\/)pyproject\.toml$/, /(^|\/)requirements\.txt$/],
    hint: "Python",
    category: "language",
  },
  {
    patterns: [/(^|\/)next\.config\.(js|mjs|ts)$/],
    hint: "Next.js",
    category: "framework",
  },
  {
    patterns: [/(^|\/)vite\.config\.(js|mjs|ts)$/],
    hint: "Vite",
    category: "tooling",
  },
  {
    patterns: [/(^|\/)turbo\.json$/],
    hint: "Turborepo",
    category: "tooling",
  },
  {
    patterns: [/(^|\/)prisma\/schema\.prisma$/],
    hint: "Prisma",
    category: "tooling",
  },
  {
    patterns: [/(^|\/)Dockerfile$/, /(^|\/)docker-compose\.(yml|yaml)$/],
    hint: "Docker",
    category: "tooling",
  },
  {
    patterns: [/(^|\/)tailwind\.config\.(js|mjs|ts|cjs)$/],
    hint: "Tailwind CSS",
    category: "tooling",
  },
];

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

function getAllDependencies(pkg: PackageJson) {
  return {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
    ...(pkg.optionalDependencies ?? {}),
  };
}

function addHint(
  category: HintCategory,
  hint: string,
  languageHints: Set<string>,
  frameworkHints: Set<string>,
  toolingHints: Set<string>,
) {
  if (category === "language") languageHints.add(hint);
  if (category === "framework") frameworkHints.add(hint);
  if (category === "tooling") toolingHints.add(hint);
}

function hasDependency(deps: Record<string, string>, dependencyName: string) {
  return Object.prototype.hasOwnProperty.call(deps, dependencyName);
}

function applyDependencyRules(
  pkg: PackageJson,
  languageHints: Set<string>,
  frameworkHints: Set<string>,
  toolingHints: Set<string>,
) {
  const deps = getAllDependencies(pkg);

  for (const rule of DEPENDENCY_RULES) {
    const matched = rule.names.some((name) => hasDependency(deps, name));

    if (matched) {
      addHint(rule.category, rule.hint, languageHints, frameworkHints, toolingHints);
    }
  }
}

function applyFileRules(
  scan: RepoScanResult,
  languageHints: Set<string>,
  frameworkHints: Set<string>,
  toolingHints: Set<string>,
) {
  for (const file of scan.files) {
    for (const rule of FILE_RULES) {
      const matched = rule.patterns.some((pattern) => pattern.test(file));

      if (matched) {
        addHint(rule.category, rule.hint, languageHints, frameworkHints, toolingHints);
      }
    }
  }
}

function extractWorkspaceHints(rootPackageJson: PackageJson | null): string[] {
  if (!rootPackageJson?.workspaces) return [];

  if (Array.isArray(rootPackageJson.workspaces)) {
    return rootPackageJson.workspaces;
  }

  return rootPackageJson.workspaces.packages ?? [];
}

function detectRepoShape(packageJsonFiles: string[], workspaceHints: string[]): RepoShape {
  if (workspaceHints.length > 0) return "workspace";
  if (packageJsonFiles.length > 1) return "monorepo";
  return "single-package";
}

export async function detectProject(scan: RepoScanResult): Promise<ProjectMetadata> {
  const packageJsonFiles = scan.files.filter((file) => file.endsWith("package.json"));

  const rootPackageJson = await readPackageJson(scan.repoPath, "package.json");
  const workspaceHints = extractWorkspaceHints(rootPackageJson);

  const languageHints = new Set<string>();
  const frameworkHints = new Set<string>();
  const toolingHints = new Set<string>();

  applyFileRules(scan, languageHints, frameworkHints, toolingHints);

  for (const packageJsonFile of packageJsonFiles) {
    const pkg = await readPackageJson(scan.repoPath, packageJsonFile);
    if (!pkg) continue;

    applyDependencyRules(pkg, languageHints, frameworkHints, toolingHints);
  }

  return {
    packageManager: detectPackageManager(scan),
    repoShape: detectRepoShape(packageJsonFiles, workspaceHints),
    languageHints: Array.from(languageHints).sort(),
    frameworkHints: Array.from(frameworkHints).sort(),
    toolingHints: Array.from(toolingHints).sort(),
    scripts: rootPackageJson?.scripts ?? {},
    packageJsonFiles,
    workspaceHints,
  };
}