// AGENTS.md / CLAUDE.md / README.md → compact project context summary

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepoScanResult } from "./scanRepo";

export type ProjectContextKind = "agent_instruction" | "project_context";

export type ProjectContextFile = {
  filePath: string;
  kind: ProjectContextKind;
  content: string;
};

export type AgentInstructionsResult = {
  files: ProjectContextFile[];
  agentInstructionFiles: string[];
  projectContextFiles: string[];
  combinedContext?: string;
};

const CONTEXT_FILES: Array<{ filePath: string; kind: ProjectContextKind }> = [
  {
    filePath: "AGENTS.md",
    kind: "agent_instruction",
  },
  {
    filePath: "CLAUDE.md",
    kind: "agent_instruction",
  },
  {
    filePath: ".github/copilot-instructions.md",
    kind: "agent_instruction",
  },
  {
    filePath: "README.md",
    kind: "project_context",
  },
];

const MAX_CHARS_PER_FILE = 3000;

async function readIfExists(
  repoPath: string,
  relativeFilePath: string,
  kind: ProjectContextKind,
): Promise<ProjectContextFile | null> {
  try {
    const absolutePath = path.join(repoPath, relativeFilePath);
    const content = await readFile(absolutePath, "utf8");

    return {
      filePath: relativeFilePath,
      kind,
      content: content.slice(0, MAX_CHARS_PER_FILE),
    };
  } catch {
    return null;
  }
}

export async function parseAgentInstructions(
  scan: RepoScanResult,
): Promise<AgentInstructionsResult> {
  const files: ProjectContextFile[] = [];

  for (const candidate of CONTEXT_FILES) {
    if (!scan.files.includes(candidate.filePath)) continue;

    const contextFile = await readIfExists(
      scan.repoPath,
      candidate.filePath,
      candidate.kind,
    );

    if (contextFile) {
      files.push(contextFile);
    }
  }

  const agentInstructionFiles = files
    .filter((file) => file.kind === "agent_instruction")
    .map((file) => file.filePath);

  const projectContextFiles = files
    .filter((file) => file.kind === "project_context")
    .map((file) => file.filePath);

  if (files.length === 0) {
    return {
      files: [],
      agentInstructionFiles,
      projectContextFiles,
    };
  }

  const combinedContext = files
    .map((file) => {
      return `# ${file.filePath}\nKind: ${file.kind}\n\n${file.content}`;
    })
    .join("\n\n---\n\n");

  return {
    files,
    agentInstructionFiles,
    projectContextFiles,
    combinedContext,
  };
}