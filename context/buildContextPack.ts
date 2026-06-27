import type { MemoryResult } from "../memory/memoryTypes";

export type RepoSummaryLike = {
  repoPath: string;
  packageManager?: string;
  frameworkHints?: string[];
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

export function buildContextPack(input: BuildContextPackInput) {
  const { task, repoSummary, memories } = input;

  const retrievedMemoryText =
    memories.length === 0
      ? "- No relevant memories retrieved."
      : memories
          .map((result, index) => {
            return `${index + 1}. [${result.event.type}] ${result.event.content}
   score=${result.score.toFixed(2)} reason=${result.reason}`;
          })
          .join("\n");

  const importantFiles =
    repoSummary.importantFiles?.length
      ? repoSummary.importantFiles.map((file) => `- ${file}`).join("\n")
      : "- No important files detected.";

  const scripts =
    repoSummary.scripts && Object.keys(repoSummary.scripts).length
      ? Object.entries(repoSummary.scripts)
          .map(([name, command]) => `- ${name}: ${command}`)
          .join("\n")
      : "- No scripts detected.";

  return `# Agent Context Pack

## User Task
${task}

## Current Repo Context
Repo path: ${repoSummary.repoPath}
Package manager: ${repoSummary.packageManager ?? "unknown"}
Framework hints: ${(repoSummary.frameworkHints ?? []).join(", ") || "none"}
File count: ${repoSummary.fileCount ?? "unknown"}

## Important Files
${importantFiles}

## Available Scripts
${scripts}

## Agent Instructions
${repoSummary.agentInstructions?.trim() || "No explicit agent instructions found."}

## Retrieved Memory
${retrievedMemoryText}

## Suggested First Actions
- Search for files related to the current task.
- Read the relevant implementation and validation boundaries.
- Check whether retrieved memories are reusable patterns or stale facts.
- Prefer small, scoped edits.
- Run the most relevant test/typecheck command if available.
`;
}