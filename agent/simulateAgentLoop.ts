/*
Without memory:
agent searches broadly.

With memory:
agent starts from the known stale-memory risk,
checks validation boundary,
and writes back only a reusable pattern.
*/

import type { MemoryResult } from "../memory/memoryTypes";
import type { AgentStep, SimulatedAgentRun } from "./toolTypes";

function hasStaleMemoryWarning(memories: MemoryResult[]) {
  return memories.some((memory) =>
    memory.event.content.toLowerCase().includes("stale"),
  );
}

function hasBugFixPattern(memories: MemoryResult[]) {
  return memories.some((memory) => memory.event.type === "bug_fix_pattern");
}

export function simulateAgentLoop(input: {
  task: string;
  memories: MemoryResult[];
  mode: "with_memory" | "without_memory";
}): SimulatedAgentRun {
  const memoryAware = input.mode === "with_memory";
  const staleWarning = hasStaleMemoryWarning(input.memories);
  const bugPattern = hasBugFixPattern(input.memories);

  const steps: AgentStep[] = [
    {
      step: 1,
      tool: "search_code",
      reason: memoryAware
        ? "Find memory retrieval and ranking code first because retrieved memories point to stale-value reuse risk."
        : "Search broadly for memory-related code because no prior bug pattern is available.",
      input: {
        query: memoryAware
          ? "memory retrieval stale claim values validation"
          : "memory retrieval",
      },
      expectedObservation:
        "Relevant memory provider, retrieval, ranking, or validation files are found.",
      memoryInfluenced: memoryAware,
    },
    {
      step: 2,
      tool: "read_file",
      reason: memoryAware
        ? "Inspect scoped recall and validation boundaries before proposing changes."
        : "Inspect the first likely memory implementation file.",
      input: {
        target: memoryAware
          ? "memory retrieval + validation boundary"
          : "first memory-related file",
      },
      expectedObservation:
        "Current retrieval behavior and validation boundary are understood.",
      memoryInfluenced: memoryAware,
    },
    {
      step: 3,
      tool: "suggest_edit",
      reason:
        staleWarning || bugPattern
          ? "Add a guard so memory can suggest reusable workflow patterns but cannot copy stale claim-specific values."
          : "Suggest a generic retrieval improvement.",
      input: {
        change: memoryAware
          ? "separate reusable workflow-pattern memory from claim-specific field values"
          : "improve memory retrieval logic",
      },
      expectedObservation:
        "Patch direction is clear, limited, and does not bypass validation.",
      memoryInfluenced: memoryAware,
    },
    {
      step: 4,
      tool: "run_command",
      reason:
        "Validate the proposed behavior with typecheck or a memory smoke/eval command.",
      input: {
        command: "bun run check",
      },
      expectedObservation: "Typecheck or smoke test passes.",
      memoryInfluenced: false,
    },
    {
      step: 5,
      tool: "write_memory",
      reason: memoryAware
        ? "Write back only the reusable bug-fix pattern after validation, not the old claim value."
        : "Write back a generic task note after validation.",
      input: {
        memoryType: memoryAware ? "bug_fix_pattern" : "open_task",
        content: memoryAware
          ? "When fixing memory retrieval, reuse workflow patterns but require current evidence before applying claim-specific values."
          : "Investigated memory retrieval task.",
      },
      expectedObservation: "A safe reusable memory is written back.",
      memoryInfluenced: memoryAware,
    },
  ];

  return {
    mode: input.mode,
    task: input.task,
    steps,
    validationSummary: {
      shouldRun: ["bun run check"],
      safetyChecks: memoryAware
        ? [
            "Memory is treated as guidance, not current claim truth.",
            "Old claim-specific values are not copied.",
            "Current validation still owns required field checks.",
            "Memory write-back stores reusable workflow pattern only.",
          ]
        : ["No memory-specific safety warning included."],
      expectedOutcome: memoryAware
        ? "Agent starts from the known stale-memory risk and writes back a reusable pattern."
        : "Agent searches more broadly and may rediscover known risks manually.",
    },
  };
}