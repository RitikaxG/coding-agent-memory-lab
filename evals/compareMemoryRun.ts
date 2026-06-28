import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildRepoSummary } from "../repo/buildRepoSummary";
import { LocalMemoryProvider } from "../memory/localMemoryProvider";
import { buildContextPack } from "../context/buildContextPack";
import { estimateTokens } from "../context/estimateContextSize";
import { simulateAgentLoop } from "../agent/simulateAgentLoop";
import { validateAgentRun } from "../agent/validateAgentRun";

import type { MemoryResult } from "../memory/memoryTypes";

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

function hasStaleMemoryWarning(memories: MemoryResult[]) {
  return memories.some((memory) =>
    memory.event.content.toLowerCase().includes("stale"),
  );
}

function printValidationChecks(
  checks: {
    name: string;
    passed: boolean;
    reason: string;
  }[],
) {
  for (const check of checks) {
    console.log(
      `  - ${check.passed ? "PASS" : "FAIL"} ${check.name}: ${check.reason}`,
    );
  }
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

  const withMemoryContext = buildContextPack({
    task,
    repoSummary,
    memories,
  });

  const withoutMemoryContext = buildContextPack({
    task,
    repoSummary,
    memories: [],
  });

  const withMemoryRun = simulateAgentLoop({
    task,
    memories,
    mode: "with_memory",
  });

  const withoutMemoryRun = simulateAgentLoop({
    task,
    memories: [],
    mode: "without_memory",
  });

  const withMemoryValidation = validateAgentRun({
    task,
    run: withMemoryRun,
    memories,
  });

  const withoutMemoryValidation = validateAgentRun({
    task,
    run: withoutMemoryRun,
    memories: [],
  });

  const comparison = [
    {
      mode: "without_memory" as const,
      estimatedTokens: estimateTokens(withoutMemoryContext),
      retrievedMemoryCount: 0,
      safetyWarningsIncluded: false,
      suggestedToolSteps: withoutMemoryRun.steps.length,
      validationPassed: withoutMemoryValidation.passed,
      validationSummary: withoutMemoryValidation.summary,
      expectedRisk:
        "Agent may search broadly and rediscover known stale-memory risks manually.",
    },
    {
      mode: "with_memory" as const,
      estimatedTokens: estimateTokens(withMemoryContext),
      retrievedMemoryCount: memories.length,
      safetyWarningsIncluded: hasStaleMemoryWarning(memories),
      suggestedToolSteps: withMemoryRun.steps.length,
      validationPassed: withMemoryValidation.passed,
      validationSummary: withMemoryValidation.summary,
      expectedBenefit:
        "Agent starts with scoped bug pattern, stale-memory warning, and safer write-back behavior.",
    },
  ];

  await mkdir(path.join(process.cwd(), "data", "sample-runs"), {
    recursive: true,
  });

  await writeFile(
    path.join(process.cwd(), "data", "sample-runs", "with-memory.json"),
    JSON.stringify(
      {
        task,
        contextPack: withMemoryContext,
        run: withMemoryRun,
        validation: withMemoryValidation,
      },
      null,
      2,
    ),
  );

  await writeFile(
    path.join(process.cwd(), "data", "sample-runs", "without-memory.json"),
    JSON.stringify(
      {
        task,
        contextPack: withoutMemoryContext,
        run: withoutMemoryRun,
        validation: withoutMemoryValidation,
      },
      null,
      2,
    ),
  );

  console.log("\nMEMCODE DAY 3 AGENT RUN EVAL");
  console.log("============================\n");

  for (const row of comparison) {
    console.log(row.mode);
    console.log(`- estimated tokens: ${row.estimatedTokens}`);
    console.log(`- retrieved memories: ${row.retrievedMemoryCount}`);
    console.log(`- safety warning included: ${row.safetyWarningsIncluded}`);
    console.log(`- suggested tool steps: ${row.suggestedToolSteps}`);
    console.log(`- validation passed: ${row.validationPassed}`);
    console.log(`- summary: ${row.validationSummary}`);

    if (row.mode === "with_memory") {
      console.log("- expected benefit: " + row.expectedBenefit);
      console.log("\nValidation checks:");
      printValidationChecks(withMemoryValidation.checks);
    } else {
      console.log("- expected risk: " + row.expectedRisk);
      console.log("\nValidation checks:");
      printValidationChecks(withoutMemoryValidation.checks);
    }

    console.log("");
  }

  if (withMemoryValidation.passed) {
    const alreadyExists = (await provider.list()).some(
      (memory) =>
        memory.type === "bug_fix_pattern" &&
        memory.scope.userId === userId &&
        memory.scope.projectId === projectId &&
        memory.scope.repoId === repoId &&
        memory.content.includes(
          "reuse workflow patterns but require current evidence",
        ),
    );

    if (!alreadyExists) {
      const writtenMemory = await provider.save({
        type: "bug_fix_pattern",
        scope: {
          userId,
          projectId,
          repoId,
        },
        content:
          "When fixing memory retrieval, reuse workflow patterns but require current evidence before applying claim-specific values.",
        metadata: {
          source: "tool_event",
          importance: "high",
          confidence: 0.9,
        },
      });

      console.log("Validated memory write-back:");
      console.log(`- saved: ${writtenMemory.id}`);
      console.log(`- type: ${writtenMemory.type}`);
    } else {
      console.log("Validated memory write-back:");
      console.log("- skipped duplicate reusable bug-fix pattern");
    }
  } else {
    console.log("Validated memory write-back:");
    console.log("- blocked because with-memory run failed validation");
  }

  console.log("\nSample runs written:");
  console.log("- data/sample-runs/with-memory.json");
  console.log("- data/sample-runs/without-memory.json");

  console.log("\nResult:");
  console.log(
    "Day 3 proves context pack → simulated agent loop → validate agent run → safe memory write-back → with-memory vs without-memory eval.",
  );
}

main().catch((error) => {
  console.error("\nFailed to run Day 3 eval:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});