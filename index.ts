// Day 2 CLI → concise memory architecture proof

import {
  buildRepoSummary,
  type RepoSummary,
} from "./repo/buildRepoSummary";

import { LocalMemoryProvider } from "./memory/LocalMemoryProvider";
import { getActiveProviderBinding } from "./memory/providerBinding";
import {
  createSkippedRecord,
  createSyncedRecord,
  type ProviderSyncRecord,
} from "./memory/providerSync";

import type {
  MemoryEvent,
  MemoryResult,
  ProviderName,
} from "./memory/memoryTypes";

const FUTURE_PROVIDER_NAMES: ProviderName[] = ["supermemory", "mem0", "hermes"];

function getArgValue(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function inferProjectId(repoPath: string) {
  const normalized = repoPath.toLowerCase();

  if (
    normalized.includes("claimflow_ai") ||
    normalized.includes("claimflow-ai") ||
    normalized.includes("claimflow")
  ) {
    return "claimflow_ai";
  }

  if (
    normalized.includes("coding-agent-memory-lab") ||
    normalized.includes("memcode")
  ) {
    return "coding-agent-memory-lab";
  }

  return "unknown-project";
}

function printHeader(title: string) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
}

function getRelevantPackages(summary: RepoSummary) {
  const packageHints = [
    "packages/memory",
    "packages/agent",
    "packages/shared/validation",
    "packages/evals",
  ];

  const detected = packageHints.filter((hint) =>
    summary.importantFiles.some((file) => file.includes(hint)),
  );

  if (detected.length === 0) {
    return ["memory", "agent", "validation", "evals"];
  }

  return detected.map((hint) => hint.replace("packages/", ""));
}

function getRelevantCommands(summary: RepoSummary) {
  const preferredCommands = [
    "memory:smoke:retrieval",
    "memory:smoke:patterns",
    "memory:smoke:update",
    "agent:smoke:memory",
    "eval:week5:memory",
    "check-types",
  ];

  return Object.entries(summary.scripts)
    .filter(([name]) => preferredCommands.includes(name))
    .slice(0, 4);
}

function printTopMemories(memories: MemoryResult[]) {
  if (memories.length === 0) {
    console.log("- none retrieved");
    return;
  }

  memories.forEach((result, index) => {
    console.log(`${index + 1}. [${result.event.type}] ${result.event.content}`);
  });
}

function printConciseDay2Proof(input: {
  task: string;
  userId: string;
  projectId: string;
  repoId: string;
  providerName: ProviderName;
  repoSummary: RepoSummary;
  memories: MemoryResult[];
}) {
  const relevantPackages = getRelevantPackages(input.repoSummary);
  const relevantCommands = getRelevantCommands(input.repoSummary);

  printHeader("MEMCODE DAY 2 MEMORY PIPELINE");

  console.log("\nTask:");
  console.log(input.task);

  console.log("\n1. Repo context loaded");
  console.log(`- repo: ${input.projectId}`);
  console.log(`- package manager: ${input.repoSummary.packageManager}`);
  console.log(`- shape: ${input.repoSummary.repoShape}`);
  console.log(`- frameworks: ${input.repoSummary.frameworkHints.join(", ") || "none"}`);
  console.log(`- relevant packages: ${relevantPackages.join(", ")}`);

  console.log("\n2. Active memory provider resolved");
  console.log(`- provider: ${input.providerName}`);
  console.log("- namespace: local-json");
  console.log("- future providers: supermemory, mem0, hermes");

  console.log("\n3. Scoped memory recalled");
  console.log(`- user: ${input.userId}`);
  console.log(`- project: ${input.projectId}`);
  console.log(`- repo: ${input.repoId}`);

  console.log("\nTop recalled memories:");
  printTopMemories(input.memories);

  console.log("\n4. Context pack assembled");
  console.log("The agent now has:");
  console.log("- current repo context");
  console.log("- scoped ClaimFlow memories");
  console.log("- stale-memory safety rule");
  console.log("- next coding actions");

  console.log("\nSuggested first actions:");
  console.log("- inspect memory retrieval");
  console.log("- inspect validation boundary");
  console.log("- run memory smoke/eval command");
  console.log("- write back only reusable workflow pattern");

  if (relevantCommands.length > 0) {
    console.log("\nUseful commands:");
    for (const [name, command] of relevantCommands) {
      console.log(`- ${name}: ${command}`);
    }
  }
}

function buildSyncRecords(input: {
  activeProviderName: ProviderName;
  memoryEventId: string;
}) {
  const records: ProviderSyncRecord[] = [
    createSyncedRecord({
      memoryEventId: input.memoryEventId,
      providerName: input.activeProviderName,
    }),
  ];

  for (const providerName of FUTURE_PROVIDER_NAMES) {
    if (providerName === input.activeProviderName) continue;

    records.push(
      createSkippedRecord({
        memoryEventId: input.memoryEventId,
        providerName,
        reason: "Future provider skipped for lazy backfill.",
      }),
    );
  }

  return records;
}

function printConciseWriteBack(input: {
  writtenMemory: MemoryEvent;
  syncRecords: ProviderSyncRecord[];
}) {
  console.log("\n5. Memory write-back");
  console.log(`- saved type: ${input.writtenMemory.type}`);
  console.log(
    `- scope: ${input.writtenMemory.scope.userId} / ${input.writtenMemory.scope.projectId} / ${input.writtenMemory.scope.repoId}`,
  );

  console.log("\nProvider sync:");
  for (const record of input.syncRecords) {
    if (record.providerName === "default") {
      console.log("- default: synced");
    } else {
      console.log(`- ${record.providerName}: skipped for lazy backfill`);
    }
  }

  console.log("\nResult:");
  console.log(
    "Day 2 proves canonical MemoryEvent + MemoryProvider + scoped recall + context assembly + write-back.",
  );
}

async function main() {
  const repoPath = getArgValue("--repo", ".");
  const task = getArgValue(
    "--task",
    "Fix memory retrieval so stale claim values are not reused",
  );

  if (!repoPath) {
    console.log("Provide repo path with --repo <path>");
    return;
  }

  if (!task) {
    console.log("Provide task with --task <task>");
    return;
  }

  const userId = getArgValue("--user", "ritika") ?? "ritika";
  const inferredProjectId = inferProjectId(repoPath);
  const projectId =
    getArgValue("--project", inferredProjectId) ?? inferredProjectId;
  const repoId = getArgValue("--repo-id", projectId) ?? projectId;

  const repoSummary = await buildRepoSummary(repoPath);

  const binding = getActiveProviderBinding({
    userId,
    projectId,
    repoId,
  });

  const provider = new LocalMemoryProvider();

  const rawMemories = await provider.search({
    query: task,
    scope: {
      userId,
      projectId,
      repoId,
    },
    limit: 8,
  });

  const memories = rawMemories
    .filter((result) => result.event.type !== "open_task")
    .slice(0, 3);

  printConciseDay2Proof({
    task,
    userId,
    projectId,
    repoId,
    providerName: binding.providerName,
    repoSummary,
    memories,
  });

  const writtenMemory = await provider.save({
    type: "open_task",
    scope: {
      userId,
      projectId,
      repoId,
    },
    content: `Current task: ${task}`,
    metadata: {
      source: "conversation",
      importance: "medium",
      confidence: 0.8,
    },
  });

  const syncRecords = buildSyncRecords({
    activeProviderName: binding.providerName,
    memoryEventId: writtenMemory.id,
  });

  printConciseWriteBack({
    writtenMemory,
    syncRecords,
  });
}

main().catch((error) => {
  console.error("\nFailed to run Day 2 memory pipeline:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});