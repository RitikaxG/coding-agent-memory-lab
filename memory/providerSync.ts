/*
Currently, only the default provider is synced.
Supermemory/Mem0/Hermes are represented as future adapters and skipped syncs.
*/

import type { ProviderName } from "./memoryTypes";

export type ProviderSyncStatus = "pending" | "synced" | "failed" | "skipped";

export type ProviderSyncRecord = {
  id: string;
  memoryEventId: string;
  providerName: ProviderName;
  providerMemoryId?: string;
  syncStatus: ProviderSyncStatus;
  lastSyncedAt?: string;
  errorMessage?: string;
};

export function createSyncedRecord(input: {
  memoryEventId: string;
  providerName: ProviderName;
  providerMemoryId?: string;
}): ProviderSyncRecord {
  return {
    id: `sync_${input.providerName}_${input.memoryEventId}`,
    memoryEventId: input.memoryEventId,
    providerName: input.providerName,
    providerMemoryId: input.providerMemoryId ?? input.memoryEventId,
    syncStatus: "synced",
    lastSyncedAt: new Date().toISOString(),
  };
}

export function createSkippedRecord(input: {
  memoryEventId: string;
  providerName: ProviderName;
  reason: string;
}): ProviderSyncRecord {
  return {
    id: `sync_${input.providerName}_${input.memoryEventId}`,
    memoryEventId: input.memoryEventId,
    providerName: input.providerName,
    syncStatus: "skipped",
    errorMessage: input.reason,
  };
}