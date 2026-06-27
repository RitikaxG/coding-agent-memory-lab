# Coding Agent Memory Lab

A small proof-of-understanding for how memory can be added to a coding-agent runtime.

The goal is not to build a full autonomous coding agent. The goal is to prove the core architecture behind a memory-first coding agent:

```txt
current repo context
+ scoped persisted memory
+ active memory provider
= compact task context before the agent acts
```

This project was built as a 3-day proof-of-work for understanding how a product like MemCode can combine repo scanning, provider-independent memory, context assembly, and memory write-back.

---

## Why this exists

Most coding agents can read files and generate code, but they often lose continuity across sessions.

A developer may have to repeat:

```txt
- Use Bun.
- This repo is a workspace.
- Do not reuse stale claim-specific values.
- Memory should store workflow patterns, not old field values.
- The agent can recommend actions, but guardrails must enforce safety.
```

A memory-first coding agent should remember durable facts and retrieve the right ones for the current repo/task.

This lab demonstrates that idea with a small local implementation.

---

## Core pipeline

```txt
User task
  ↓
Repo scan
  ↓
Repo summary
  ↓
Active memory provider resolution
  ↓
Scoped memory recall
  ↓
Context assembly
  ↓
Memory write-back
  ↓
Provider sync status
```

The current proof focuses on Day 1 and Day 2:

```txt
Day 1: repo context foundation
Day 2: memory provider abstraction + local recall engine
Day 3: simulated agent loop + memory evaluation
```

---

## What is implemented

```txt
repo/
  scanRepo.ts
  detectProject.ts
  parseAgentInstructions.ts
  buildRepoSummary.ts

memory/
  memoryTypes.ts
  MemoryProvider.ts
  LocalMemoryProvider.ts
  providerBinding.ts
  providerSync.ts
  seedMemories.ts

context/
  buildContextPack.ts
  estimateContextSize.ts

index.ts
```

Current features:

- repo scanner
- project metadata detector
- package manager detection
- workspace/framework/tooling detection
- README / project context parser
- canonical `MemoryEvent` model
- `MemoryProvider` interface
- local JSON-backed memory provider
- scoped memory search
- recall scoring by keyword, scope, type, importance, and confidence
- provider binding model
- provider sync / lazy backfill model
- ClaimFlow AI demo memories
- concise CLI memory pipeline output
- memory write-back after a run

---

## Day 1: Repo context foundation

A coding agent first needs to understand the current repository.

The repo layer scans a target repo and extracts:

```txt
- package manager
- repo shape
- languages
- frameworks
- tooling
- workspace hints
- important files
- package manifests
- available scripts
- agent/project context files
```

Example output for ClaimFlow AI:

```txt
repo: claimflow_ai
package manager: bun
shape: workspace
frameworks: Next.js, React
relevant packages: memory, agent, shared/validation, evals
```

This gives the agent current repo context before memory is retrieved.

---

## Day 2: Memory layer

Day 2 adds a provider-independent memory layer.

The key idea:

```txt
MemCode owns canonical memory events.
Memory providers act as recall engines.
```

A memory provider is not only storage. It decides which memories are useful for the current task.

---

## Memory architecture

```txt
MemoryEvent
  = canonical portable memory unit

MemoryProvider
  = interface every provider must implement

LocalMemoryProvider
  = default local recall engine

ProviderBinding
  = chooses active provider for user/project/repo

ProviderSyncStatus
  = tracks where memory has been synced

index.ts
  = wires repo context + provider + recall + write-back
```

---

## `memoryTypes.ts`

Defines the canonical memory shape.

Important types:

```txt
ProviderName
MemoryEventType
MemoryScope
MemoryEvent
MemorySearchInput
MemoryResult
MemoryWriteInput
```

Example memory:

```txt
type: warning
scope: ritika / claimflow_ai / claimflow_ai
content: Memory should not blindly copy stale claim-specific values into a new claim.
metadata: high importance, high confidence, seed source
```

This makes memory portable across providers.

---

## `MemoryProvider.ts`

Defines the contract every memory provider must implement:

```txt
save()
search()
list()
delete?()
```

This lets the same coding-agent harness use different backends later:

```txt
default local provider
Supermemory
Mem0
Hermes
```

The agent workflow does not need to change when the provider changes.

---

## `LocalMemoryProvider.ts`

Implements the default local memory provider using:

```txt
data/memories.json
```

It supports:

```txt
list  → read all memories
save  → write a new canonical MemoryEvent
search → retrieve relevant scoped memories
```

The search method acts as the recall engine.

It scores memories using:

```txt
keyword match
+ scope match
+ type boost
+ importance boost
+ confidence
```

This means a task like:

```txt
Fix memory retrieval so stale claim values are not reused
```

retrieves memories about:

```txt
- stale claim-specific values
- reusable workflow patterns
- previous missing-field memory bugs
- ClaimFlow guardrails
```

instead of returning random global memory.

---

## `providerBinding.ts`

Defines which provider is active for the current user/project/repo.

In the current proof:

```txt
provider: default
namespace: local-json
```

Later, this could become:

```txt
provider: mem0
provider: supermemory
provider: hermes
```

This models provider switching without changing the coding-agent pipeline.

---

## `providerSync.ts`

Models memory sync status across providers.

In the Day 2 proof:

```txt
default: synced
supermemory: skipped
mem0: skipped
hermes: skipped
```

This proves the system does not blindly write every memory to every provider.

The intended architecture is:

```txt
active provider = synced now
future providers = lazy backfill later
```

This avoids duplicate storage, unnecessary cost, high latency, and provider drift.

---

## `seedMemories.ts`

Creates the initial demo memories for the local provider.

It writes seeded memories into:

```txt
data/memories.json
```

Seeded examples include:

```txt
- User prefers architecture-first explanations.
- ClaimFlow AI uses Bun.
- ClaimFlow AI has extraction, validation, RAG, memory, agent actions, human review, evals, and observability.
- Memory should not copy stale claim-specific values.
- Previous memory bugs came from retrieving exact old values.
- Guardrails prevent unsafe approval/rejection/deletion.
```

---

## Recall engine example

Run:

```bash
bun run seed
bun run dev --repo ../claimflow-ai --task "Fix memory retrieval so stale claim values are not reused"
```

The task becomes the search query:

```txt
Fix memory retrieval so stale claim values are not reused
```

The inferred scope becomes:

```txt
user: ritika
project: claimflow_ai
repo: claimflow_ai
```

The local recall engine searches memories using that query and scope.

Top recalled memories:

```txt
1. [warning]
   Memory should not blindly copy stale claim-specific values into a new claim.

2. [bug_fix_pattern]
   Previous ClaimFlow memory bugs came from retrieving exact old field values instead of reusable missing-field resolution patterns.

3. [repo_fact]
   ClaimFlow AI is an applied AI insurance workflow with extraction, validation, policy RAG, memory, guarded agent actions, human review, evals, and observability.
```

The agent now has enough context to understand:

```txt
- this is a ClaimFlow memory bug
- stale values should not be copied
- reusable workflow patterns are safe
- current validation must still verify claim facts
```

---

## Example CLI output

```txt
MEMCODE DAY 2 MEMORY PIPELINE
=============================

Task:
Fix memory retrieval so stale claim values are not reused

1. Repo context loaded
- repo: claimflow_ai
- package manager: bun
- shape: workspace
- frameworks: Next.js, React
- relevant packages: memory, agent, shared/validation, evals

2. Active memory provider resolved
- provider: default
- namespace: local-json
- future providers: supermemory, mem0, hermes

3. Scoped memory recalled
- user: ritika
- project: claimflow_ai
- repo: claimflow_ai

Top recalled memories:
1. [warning] Memory should not blindly copy stale claim-specific values into a new claim.
2. [bug_fix_pattern] Previous ClaimFlow memory bugs came from retrieving exact old field values instead of reusable missing-field resolution patterns.
3. [repo_fact] ClaimFlow AI is an applied AI insurance workflow with extraction, validation, policy RAG, memory, guarded agent actions, human review, evals, and observability.

4. Context pack assembled
The agent now has:
- current repo context
- scoped ClaimFlow memories
- stale-memory safety rule
- next coding actions

Suggested first actions:
- inspect memory retrieval
- inspect validation boundary
- run memory smoke/eval command
- write back only reusable workflow pattern

5. Memory write-back
- saved type: open_task
- scope: ritika / claimflow_ai / claimflow_ai

Provider sync:
- default: synced
- supermemory: skipped for lazy backfill
- mem0: skipped for lazy backfill
- hermes: skipped for lazy backfill

Result:
Day 2 proves canonical MemoryEvent + MemoryProvider + scoped recall + context assembly + write-back.
```

---

## Why this proves the memory architecture

This project does not simply print all stored memories.

It does:

```txt
current task
+ current user/project/repo scope
+ recall scoring
= useful memories for this run
```

For ClaimFlow AI, the recall engine correctly prioritizes:

```txt
warning
bug_fix_pattern
repo_fact
```

over unrelated memories.

That proves:

```txt
MemCode-owned memory events
+ swappable memory provider
+ scoped recall
+ prompt/context assembly
+ write-back
```

---

## Provider fit

This proof uses the default local provider.

Future provider roles:

```txt
Supermemory
= broad project/document context and RAG-style retrieval

Mem0
= durable user/repo/session memory and bug-fix patterns

Hermes-style memory
= local curated runtime memory and provider orchestration pattern
```

The important architecture decision:

```txt
Provider switching should change recall behavior,
not the whole coding-agent harness.
```

---

## Commands

Install dependencies:

```bash
bun install
```

Seed demo memories:

```bash
bun run seed
```

Run the Day 2 pipeline:

```bash
bun run dev --repo ../claimflow-ai --task "Fix memory retrieval so stale claim values are not reused"
```

Type-check:

```bash
bun run check
```

---

## Current status

```txt
Day 1 complete:
Repo scan + repo summary layer.

Day 2 complete:
MemoryProvider abstraction + LocalMemoryProvider + scoped recall + provider binding + provider sync + memory write-back.

Day 3 planned:
Simulated agent tool loop + with-memory vs without-memory comparison.
```

---

## Day 3 plan

Day 3 will add a simulated coding-agent loop.

Planned flow:

```txt
context pack
  ↓
simulated tool plan
  ↓
validation summary
  ↓
memory write-back
  ↓
with-memory vs without-memory comparison
```

Planned tool steps:

```txt
search_code
read_file
suggest_edit
run_command
write_memory
```

The goal is not full autonomous editing. The goal is to show how retrieved memory changes the agent’s next actions.

---

## Final architecture sentence

A memory-first coding agent has two context layers:

```txt
current repo context
+ durable learned context
```

The repo scanner tells the agent what exists now.

The memory layer tells the agent what was learned before.

The context pack combines both before the agent enters the tool loop.
