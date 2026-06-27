/*
Same agent.
Same workflow.
Different memory backend.
*/

import type {
  MemoryEvent,
  MemoryResult,
  MemorySearchInput,
  MemoryWriteInput,
  ProviderName,
} from "./memoryTypes";

export interface MemoryProvider {
  name: ProviderName;

  save(input: MemoryWriteInput): Promise<MemoryEvent>;

  search(input: MemorySearchInput): Promise<MemoryResult[]>;

  list(): Promise<MemoryEvent[]>;

  delete?(input: {
    memoryEventId: string;
    providerMemoryId?: string;
  }): Promise<void>;
}