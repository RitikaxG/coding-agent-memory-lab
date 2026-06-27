import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { MemoryEvent } from "./memoryTypes";

const outPath = path.join(process.cwd(), "data", "memories.json");

const now = new Date().toISOString();

const memories: MemoryEvent[] = [
  {
    id: "mem_user_pref_architecture_first",
    type: "user_preference",
    scope: {
      userId: "ritika",
    },
    content:
      "User prefers architecture-first explanations, then file-by-file implementation guidance.",
    metadata: {
      source: "seed",
      importance: "medium",
      confidence: 0.9,
      createdAt: now,
    },
  },
  {
    id: "mem_project_pref_bun",
    type: "project_preference",
    scope: {
      userId: "ritika",
      projectId: "claimflow_ai",
      repoId: "claimflow_ai",
    },
    content:
      "ClaimFlow AI uses Bun as the package manager. Prefer Bun commands when suggesting scripts.",
    metadata: {
      source: "seed",
      importance: "high",
      confidence: 0.95,
      createdAt: now,
    },
  },
  {
    id: "mem_claimflow_architecture",
    type: "repo_fact",
    scope: {
      userId: "ritika",
      projectId: "claimflow_ai",
      repoId: "claimflow_ai",
    },
    content:
      "ClaimFlow AI is an applied AI insurance workflow with extraction, validation, policy RAG, memory, guarded agent actions, human review, evals, and observability.",
    metadata: {
      source: "seed",
      importance: "high",
      confidence: 0.95,
      createdAt: now,
    },
  },
  {
    id: "mem_stale_claim_values_warning",
    type: "warning",
    scope: {
      userId: "ritika",
      projectId: "claimflow_ai",
      repoId: "claimflow_ai",
    },
    content:
      "Memory should not blindly copy stale claim-specific values into a new claim. It should retrieve reusable workflow patterns and require current validation.",
    metadata: {
      source: "seed",
      importance: "high",
      confidence: 0.98,
      createdAt: now,
    },
  },
  {
    id: "mem_missing_field_bug_pattern",
    type: "bug_fix_pattern",
    scope: {
      userId: "ritika",
      projectId: "claimflow_ai",
      repoId: "claimflow_ai",
    },
    content:
      "Previous ClaimFlow memory bugs came from retrieving exact old field values instead of reusable missing-field resolution patterns.",
    metadata: {
      source: "seed",
      importance: "high",
      confidence: 0.9,
      createdAt: now,
    },
  },
  {
    id: "mem_guarded_agent_action",
    type: "architecture_decision",
    scope: {
      userId: "ritika",
      projectId: "claimflow_ai",
      repoId: "claimflow_ai",
    },
    content:
      "In ClaimFlow AI, the LLM can recommend a registered action, but backend guardrails must prevent unsafe approval, rejection, deletion, or bypassing review.",
    metadata: {
      source: "seed",
      importance: "high",
      confidence: 0.95,
      createdAt: now,
    },
  },
];

async function main() {
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(memories, null, 2));
  console.log(`Seeded ${memories.length} memories to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});