import type { MemoryResult } from "../memory/memoryTypes";

export type RepoSummaryLike = {
  repoPath: string;
  packageManager?: string;
  repoShape?: string;
  frameworkHints?: string[];
  toolingHints?: string[];
  scripts?: Record<string, string>;
  importantFiles?: string[];
  agentInstructions?: string;
  fileCount?: number;
};

export type BuildContextPackInput = {
  task: string;
  repoSummary: RepoSummaryLike;
  memories: MemoryResult[];
};

const CONTEXT_FILE_HINTS = [
  "packages/memory",
  "packages/agent",
  "packages/rag",
  "packages/shared/validation",
  "packages/evals",
  "packages/gateway",
  "prisma/schema.prisma",
  "README.md",
];

const PRIMARY_SCRIPT_HINTS = [
  "check-types",
  "lint",
  "build",
  "memory:smoke:retrieval",
  "memory:smoke:patterns",
  "memory:smoke:update",
  "agent:smoke:memory",
  "eval:week5:memory",
  "production:check",
];

function selectRelevantFiles(files: string[] = []) {
  return files
    .filter((file) => CONTEXT_FILE_HINTS.some((hint) => file.includes(hint)))
    .slice(0, 12);
}

function selectRelevantScripts(scripts: Record<string, string> = {}) {
  return Object.entries(scripts)
    .filter(([name]) => PRIMARY_SCRIPT_HINTS.includes(name))
    .slice(0, 10);
}

function summarizeMemory(result: MemoryResult, index: number) {
  return `${index + 1}. [${result.event.type}]
   content: ${result.event.content}
   why returned: ${result.reason}
   score: ${result.score.toFixed(2)}
   scope: user=${result.event.scope.userId}, project=${result.event.scope.projectId ?? "none"}, repo=${result.event.scope.repoId ?? "none"}
   importance: ${result.event.metadata.importance}, confidence: ${result.event.metadata.confidence}`;
}

function buildMemorySafetyNotes(memories: MemoryResult[]) {
  const hasStaleValueWarning = memories.some((result) =>
    result.event.content.toLowerCase().includes("stale"),
  );

  const hasBugPattern = memories.some(
    (result) => result.event.type === "bug_fix_pattern",
  );

  if (!hasStaleValueWarning && !hasBugPattern) {
    return `- No specific stale-memory warning found.
- Treat retrieved memory as guidance, not current repo truth.`;
  }

  return `Allowed:
- Reuse the missing-field workflow pattern.
- Inspect current validation and memory retrieval code.
- Require current claim evidence before applying any field value.

Blocked:
- Do not copy old claim-specific values into a new claim.
- Do not treat memory as current claim truth.
- Do not bypass deterministic validation or human review.`;
}

export function buildContextPack(input: BuildContextPackInput) {
  const { task, repoSummary, memories } = input;

  const relevantFiles = selectRelevantFiles(repoSummary.importantFiles);
  const relevantScripts = selectRelevantScripts(repoSummary.scripts);

  const retrievedMemoryText =
    memories.length === 0
      ? "- No relevant memories retrieved."
      : memories.map(summarizeMemory).join("\n\n");

  const filesText =
    relevantFiles.length === 0
      ? "- No task-relevant files detected from repo summary."
      : relevantFiles.map((file) => `- ${file}`).join("\n");

  const scriptsText =
    relevantScripts.length === 0
      ? "- No task-relevant scripts detected."
      : relevantScripts.map(([name, command]) => `- ${name}: ${command}`).join("\n");

  return `# Agent Context Pack

## User Task
${task}

## Compact Repo Context
- Repo path: ${repoSummary.repoPath}
- Package manager: ${repoSummary.packageManager ?? "unknown"}
- Repo shape: ${repoSummary.repoShape ?? "unknown"}
- Frameworks: ${(repoSummary.frameworkHints ?? []).join(", ") || "none"}
- Tooling: ${(repoSummary.toolingHints ?? []).join(", ") || "none"}
- File count: ${repoSummary.fileCount ?? "unknown"}

## Task-Relevant Files
${filesText}

## Task-Relevant Commands
${scriptsText}

## Retrieved Memory
${retrievedMemoryText}

## Memory Safety Decision
${buildMemorySafetyNotes(memories)}

## Suggested First Actions
1. Search the memory package for retrieval and ranking logic.
2. Inspect validation boundaries for required claim fields.
3. Check where agent memory is injected into the ClaimFlow workflow.
4. Add or run a stale-memory safety test.
5. Write back only a reusable bug-fix pattern, not claim-specific values.
`;
}