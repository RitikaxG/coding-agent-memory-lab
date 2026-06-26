// AGENTS.md / CLAUDE.md / README.md → compact instruction summary

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepoScanResult } from "./scanRepo";

export type AgentInstructionFile = {
  filePath: string;
  content: string;
};

export type AgentInstructionsResult = {
  files: AgentInstructionFile[];
  combinedInstructions?: string;
};

const INSTRUCTION_FILES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  "README.md",
];

const MAX_CHARS_PER_FILE = 3000;

async function readIfExists(repoPath: string, relativeFilePath: string) {
  try {
    const absolutePath = path.join(repoPath, relativeFilePath);
    const content = await readFile(absolutePath, "utf8");

    return {
      filePath: relativeFilePath,
      content: content.slice(0, MAX_CHARS_PER_FILE),
    };
  } catch {
    return null;
  }
}

export async function parseAgentInstructions(
  scan: RepoScanResult,
): Promise<AgentInstructionsResult> {
  const files: AgentInstructionFile[] = [];

  for (const filePath of INSTRUCTION_FILES) {
    if (!scan.files.includes(filePath)) continue;

    const instructionFile = await readIfExists(scan.repoPath, filePath);
    if (instructionFile) {
      files.push(instructionFile);
    }
  }

  if (files.length === 0) {
    return { files: [] };
  }

  const combinedInstructions = files
    .map((file) => {
      return `# ${file.filePath}\n${file.content}`;
    })
    .join("\n\n---\n\n");

  return {
    files,
    combinedInstructions,
  };
}