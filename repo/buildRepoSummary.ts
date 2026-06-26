import { scanRepo } from "./scanRepo";
import { detectProject, type PackageManager } from "./detectProject";
import { parseAgentInstructions } from "./parseAgentInstructions";

export type RepoSummary = {
  repoPath: string;
  packageManager: PackageManager;
  frameworkHints: string[];
  scripts: Record<string, string>;
  importantFiles: string[];
  agentInstructionFiles: string[];
  agentInstructions?: string;
  fileCount: number;
  packageJsonFiles: string[];
};

export async function buildRepoSummary(repoPath: string): Promise<RepoSummary> {
  const scan = await scanRepo(repoPath);
  const metadata = await detectProject(scan);
  const instructions = await parseAgentInstructions(scan);

  return {
    repoPath: scan.repoPath,
    packageManager: metadata.packageManager,
    frameworkHints: metadata.frameworkHints,
    scripts: metadata.scripts,
    importantFiles: scan.importantFiles,
    agentInstructionFiles: instructions.files.map((file) => file.filePath),
    agentInstructions: instructions.combinedInstructions,
    fileCount: scan.files.length,
    packageJsonFiles: metadata.packageJsonFiles,
  };
}