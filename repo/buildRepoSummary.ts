import { scanRepo } from "./scanRepo";
import {
  detectProject,
  type PackageManager,
  type RepoShape,
} from "./detectProject";
import { parseAgentInstructions } from "./parseAgentInstructions";

export type RepoSummary = {
  repoPath: string;
  packageManager: PackageManager;
  repoShape: RepoShape;
  languageHints: string[];
  frameworkHints: string[];
  toolingHints: string[];
  scripts: Record<string, string>;
  importantFiles: string[];
  agentInstructionFiles: string[];
  projectContextFiles: string[];
  agentInstructions?: string;
  fileCount: number;
  packageJsonFiles: string[];
  workspaceHints: string[];
};

export async function buildRepoSummary(repoPath: string): Promise<RepoSummary> {
  const scan = await scanRepo(repoPath);
  const metadata = await detectProject(scan);
  const instructions = await parseAgentInstructions(scan);

  return {
    repoPath: scan.repoPath,
    packageManager: metadata.packageManager,
    repoShape: metadata.repoShape,
    languageHints: metadata.languageHints,
    frameworkHints: metadata.frameworkHints,
    toolingHints: metadata.toolingHints,
    scripts: metadata.scripts,
    importantFiles: scan.importantFiles,
    agentInstructionFiles: instructions.agentInstructionFiles,
    projectContextFiles: instructions.projectContextFiles,
    agentInstructions: instructions.combinedContext,
    fileCount: scan.files.length,
    packageJsonFiles: metadata.packageJsonFiles,
    workspaceHints: metadata.workspaceHints,
  };
}