/*
MemoryEvent is canonical and portable, while provider-specific results are only recall outputs.

MemoryEvent = canonical memory unit
MemoryResult = provider recall output

*/

export type ProviderName = "default" | "supermemory" | "mem0" | "hermes";

export type MemoryEventType =
  | "user_preference"
  | "project_preference"
  | "repo_fact"
  | "architecture_decision"
  | "bug_fix_pattern"
  | "open_task"
  | "agent_instruction"
  | "warning";

export type MemoryScope = {
  userId: string;
  projectId?: string;
  repoId?: string;
  conversationId?: string;
  taskRunId?: string;
  filePath?: string;
  commitSha?: string;
};

export type MemoryEvent = {
  id: string;
  type: MemoryEventType;
  scope: MemoryScope;
  content: string;
  metadata: {
    source: "conversation" | "repo_scan" | "tool_event" | "manual" | "seed";
    importance: "low" | "medium" | "high";
    confidence: number;
    createdAt: string;
    expiresAt?: string;
  };
};

export type MemorySearchInput = {
  query: string;
  scope: {
    userId: string;
    projectId?: string;
    repoId?: string;
    conversationId?: string;
    taskRunId?: string;
  };
  limit?: number;
};

export type MemoryResult = {
  event: MemoryEvent;
  score: number;
  reason: string;
};

export type MemoryWriteInput = Omit<MemoryEvent, "id" | "metadata"> & {
  metadata?: Partial<MemoryEvent["metadata"]>;
};