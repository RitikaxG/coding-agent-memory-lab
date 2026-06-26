// CLI args → repo summary output

import { buildRepoSummary } from "./repo/buildRepoSummary";

function getArgValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function printRepoSummary(summary: Awaited<ReturnType<typeof buildRepoSummary>>, task: string) {
  console.log("\nREPO SUMMARY\n");

  console.log(`Repo path: ${summary.repoPath}`);
  console.log(`Package manager: ${summary.packageManager}`);
  console.log(
    `Framework hints: ${
      summary.frameworkHints.length > 0 ? summary.frameworkHints.join(", ") : "none detected"
    }`,
  );
  console.log(`File count: ${summary.fileCount}`);

  console.log("\nImportant files:");
  if (summary.importantFiles.length === 0) {
    console.log("- none detected");
  } else {
    for (const file of summary.importantFiles) {
      console.log(`- ${file}`);
    }
  }

  console.log("\nAvailable scripts:");
  const scriptEntries = Object.entries(summary.scripts);
  if (scriptEntries.length === 0) {
    console.log("- none detected");
  } else {
    for (const [name, command] of scriptEntries) {
      console.log(`- ${name}: ${command}`);
    }
  }

  console.log("\nAgent instruction files:");
  if (summary.agentInstructionFiles.length === 0) {
    console.log("- No AGENTS.md, CLAUDE.md, or project instruction file found.");
  } else {
    for (const file of summary.agentInstructionFiles) {
      console.log(`- ${file}`);
    }
  }

  console.log("\nTask:");
  console.log(task);

  console.log("\nDay 1 status: Repo context foundation generated successfully.\n");
}

async function main() {
  const repoPath = getArgValue("--repo", ".");
  const task = getArgValue("--task", "No task provided.");

  if(!repoPath){
    console.log(`Provide repo path`);
    return;
  }

  if(!task){
    console.log(`Task not provided`);
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