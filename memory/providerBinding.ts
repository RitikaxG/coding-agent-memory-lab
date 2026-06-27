/*
Agent should not hardcode provider.
Agent asks memory router: which provider is active?
*/

import type { ProviderName } from "./memoryTypes";

export type ProviderBinding = {
  id: string;
  userId: string;
  projectId?: string;
  repoId?: string;
  providerName: ProviderName;
  isActive: boolean;
  externalNamespace?: string;
  createdAt: string;
  updatedAt: string;
};

export function getActiveProviderBinding(input: {
  userId: string;
  projectId?: string;
  repoId?: string;
}): ProviderBinding {
  return {
    id: "binding_default_ritika_claimflow",
    userId: input.userId,
    projectId: input.projectId,
    repoId: input.repoId,
    providerName: "default",
    isActive: true,
    externalNamespace: "local-json",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}