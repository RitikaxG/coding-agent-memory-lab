/*
memory is not just stored
memory is scored, scoped, ranked, and returned
*/

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  MemoryEvent,
  MemoryResult,
  MemorySearchInput,
  MemoryWriteInput,
} from "./memoryTypes";
import type { MemoryProvider } from "./MemoryProvider";

const DEFAULT_PATH = path.join(process.cwd(), "data", "memories.json");

function id(prefix = "mem") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9_.-]+/g, " ");
}

function words(text: string) {
  return new Set(normalize(text).split(/\s+/).filter(Boolean));
}

export class LocalMemoryProvider implements MemoryProvider {
  name = "default" as const;

  constructor(private filePath = DEFAULT_PATH) {}

  async list(): Promise<MemoryEvent[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as MemoryEvent[];
    } catch {
      return [];
    }
  }

  async save(input: MemoryWriteInput): Promise<MemoryEvent> {
    const memories = await this.list();

    const event: MemoryEvent = {
      id: id(),
      type: input.type,
      scope: input.scope,
      content: input.content,
      metadata: {
        source: input.metadata?.source ?? "manual",
        importance: input.metadata?.importance ?? "medium",
        confidence: input.metadata?.confidence ?? 0.8,
        createdAt: input.metadata?.createdAt ?? new Date().toISOString(),
        expiresAt: input.metadata?.expiresAt,
      },
    };

    memories.push(event);
    await this.persist(memories);
    return event;
  }

  async search(input: MemorySearchInput): Promise<MemoryResult[]> {
    const memories = await this.list();
    const queryWords = words(input.query);

    const results = memories
      .map((event) => {
        const contentWords = words(event.content);
        let keywordScore = 0;

        for (const word of queryWords) {
          if (contentWords.has(word)) keywordScore += 1;
        }

        const scopeScore = this.scopeScore(event, input);
        const typeBoost = this.typeBoost(event.type);
        const importanceBoost = this.importanceBoost(event.metadata.importance);
        const confidenceBoost = event.metadata.confidence;

        const score =
          keywordScore +
          scopeScore +
          typeBoost +
          importanceBoost +
          confidenceBoost;

        return {
          event,
          score,
          reason: `keyword=${keywordScore}, scope=${scopeScore}, type=${typeBoost}, importance=${importanceBoost}`,
        };
      })
      .filter((result) => result.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit ?? 5);

    return results;
  }

  private scopeScore(event: MemoryEvent, input: MemorySearchInput) {
    let score = 0;

    if (event.scope.userId === input.scope.userId) score += 1;
    if (input.scope.projectId && event.scope.projectId === input.scope.projectId) score += 2;
    if (input.scope.repoId && event.scope.repoId === input.scope.repoId) score += 3;
    if (
      input.scope.conversationId &&
      event.scope.conversationId === input.scope.conversationId
    ) {
      score += 1;
    }

    return score;
  }

  private typeBoost(type: MemoryEvent["type"]) {
    if (type === "warning") return 2;
    if (type === "bug_fix_pattern") return 2;
    if (type === "architecture_decision") return 1.5;
    if (type === "project_preference") return 1.25;
    return 1;
  }

  private importanceBoost(importance: MemoryEvent["metadata"]["importance"]) {
    if (importance === "high") return 2;
    if (importance === "medium") return 1;
    return 0.25;
  }

  private async persist(memories: MemoryEvent[]) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(memories, null, 2));
  }
}