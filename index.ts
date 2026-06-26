// CLI args → repo summary output

import {
  buildRepoSummary,
  type RepoSummary,
} from "./repo/buildRepoSummary";

const PRIMARY_SCRIPT_NAMES = new Set([
  "dev",
  "build",
  "test",
  "lint",
  "typecheck",
  "check-types",
  "format",
]);

function getArgValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function printStringList(title: string, values: string[], limit = 20) {
  console.log(`\n${title}:`);

  if (values.length === 0) {
    console.log("- none detected");
    return;
  }

  for (const value of values.slice(0, limit)) {
    console.log(`- ${value}`);
  }

  const remainingCount = values.length - limit;
  if (remainingCount > 0) {
    console.log(`- ... ${remainingCount} more`);
  }
}

function getPrimaryScripts(scripts: Record<string, string>) {
  return Object.entries(scripts).filter(([name]) => PRIMARY_SCRIPT_NAMES.has(name));
}

function printScripts(summary: RepoSummary) {
  const primaryScripts = getPrimaryScripts(summary.scripts);
  const totalScriptCount = Object.keys(summary.scripts).length;
  const otherScriptCount = totalScriptCount - primaryScripts.length;

  console.log("\nPrimary scripts:");

  if (primaryScripts.length === 0) {
    console.log("- none detected");
  } else {
    for (const [name, command] of primaryScripts) {
      console.log(`- ${name}: ${command}`);
    }
  }

  if (otherScriptCount > 0) {
    console.log(`\nOther scripts: ${otherScriptCount} detected`);
  }
}

function printRepoSummary(summary: RepoSummary, task: string) {
  console.log("\nREPO SUMMARY\n");

  console.log(`Repo path: ${summary.repoPath}`);
  console.log(`Package manager: ${summary.packageManager}`);
  console.log(`Repo shape: ${summary.repoShape}`);
  console.log(`File count: ${summary.fileCount}`);
  console.log(`Package manifests: ${summary.packageJsonFiles.length} detected`);

  printStringList("Languages", summary.languageHints);
  printStringList("Frameworks", summary.frameworkHints);
  printStringList("Tooling", summary.toolingHints);
  printStringList("Workspace hints", summary.workspaceHints);
  printStringList("Important files", summary.importantFiles, 25);

  printScripts(summary);

  printStringList("Agent instruction files", summary.agentInstructionFiles);
  printStringList("Project context files", summary.projectContextFiles);

  console.log("\nTask:");
  console.log(task);

  console.log("\nDay 1 status: Repo context foundation generated successfully.\n");
}

async function main() {
  const repoPath = getArgValue("--repo", ".");
  const task = getArgValue("--task", "No task provided.");

  if (!repoPath) {
    console.log("Provide repo path");
    return;
  }

  if (!task) {
    console.log("Task not provided");
    return;
  }

  const summary = await buildRepoSummary(repoPath);
  printRepoSummary(summary, task);
}

main().catch((error) => {
  console.error("\nFailed to build repo summary:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});