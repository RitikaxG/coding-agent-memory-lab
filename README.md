# Coding Agent Memory Lab

A small implementation of the core idea behind a memory-first coding agent.

The project shows how an agent can build useful context from two sources:

```txt
current repo state + persisted memory = agent context
```

The goal is not to build a full autonomous coding agent. The goal is to make the architecture clear layer by layer.

---

## What this project is building

A coding agent needs more than an LLM. It needs:

```txt
repo context
+ remembered knowledge
+ a compact context pack
+ tool actions
+ validation
+ memory write-back
```

This lab implements that pipeline in small steps.

```txt
User task
  ↓
Repo scan
  ↓
Repo summary
  ↓
Memory retrieval
  ↓
Context pack
  ↓
Agent tool loop
  ↓
Validation
  ↓
Memory write-back
```

---

## Core idea

A memory-first coding agent has two context layers.

### 1. Current repo context

This is what exists in the repository right now.

Examples:

```txt
package manager
repo shape
languages
frameworks
tooling
important files
available scripts
project instructions
```

This context changes as the repo changes.

### 2. Persisted memory

This is what the agent learned before.

Examples:

```txt
user preferences
repo-specific decisions
previous bug-fix patterns
known test commands
warnings about stale or unsafe behavior
```

This context survives across sessions.

The agent should not rely only on chat history. It should retrieve relevant durable memory and combine it with the current repo state.

---

## Layer 1: Repo state

Implemented in Day 1.

```txt
repo/
  scanRepo.ts
  detectProject.ts
  parseAgentInstructions.ts
  buildRepoSummary.ts
```

This layer scans a repo and builds a compact summary.

It detects:

```txt
package manager
repo shape
package manifests
workspace hints
languages
frameworks
tooling
important files
primary scripts
agent instruction files
project context files
```

Example:

```txt
Package manager: bun
Repo shape: workspace
Languages: TypeScript
Frameworks: Next.js, React
Tooling: Docker, Prisma, Tailwind CSS, Turborepo
Workspace hints: apps/*, packages/*
```

This is the agent's understanding of the current repo state.

---

## Layer 2: Persisted memory

Planned for Day 2.

This layer will add:

```txt
MemoryProvider
LocalMemoryProvider
memory scopes
memory types
memory retrieval
memory write-back
```

Memory scopes:

```txt
user
repo
session
team
```

Memory types:

```txt
repo_fact
decision
bug_fix
preference
test_command
warning
```

The important part is not storing everything. The important part is deciding what should become memory, how it is scoped, and when it should be ignored.

---

## Layer 3: Context pack

Planned for Day 2.

The context pack combines the two context layers.

```txt
User task
+ current repo summary
+ relevant retrieved memories
= compact agent context
```

Example:

```txt
Task:
Fix memory retrieval bug.

Repo context:
Bun workspace, Next.js, Prisma, Turborepo.

Retrieved memory:
Previous memory bug came from reusing stale values instead of reusable workflow patterns.

Suggested first actions:
Search memory retrieval code, inspect validation boundary, add stale-memory test.
```

This is what would be sent to the LLM before it enters the tool loop.

---

## Layer 4: Agent tool loop

Planned for Day 3.

The agent loop will be simulated, not fully autonomous.

Example tool plan:

```txt
1. search_code
2. read_file
3. suggest_edit
4. run_command
5. write_memory
```

This proves how repo context and memory guide the agent's actions.

---

## Layer 5: Validation and memory write-back

Planned for Day 3.

After the simulated tool loop, the system should decide what was learned.

Example memory write-back:

```txt
When fixing memory retrieval, validate that retrieved memories are scoped to the current repo/task and do not copy stale values without current evidence.
```

This closes the loop:

```txt
retrieve memory before action
act with repo context
validate result
write useful memory back
```

---

## Current status

Day 1 is complete.

The project can scan a real monorepo and produce a compact repo summary.

Run:

```bash
bun run dev --repo . --task "Build repo context foundation"
```

Run against another repo:

```bash
bun run dev --repo ../claimflow-ai --task "Fix memory retrieval bug"
```

---

## Why this matters

A normal coding agent sees the current repo.

A memory-first coding agent sees:

```txt
what exists now
+ what was learned before
```

That is the difference this project is trying to demonstrate.

The repo scanner tells the agent what exists now. The memory layer tells it what was learned before. The context pack combines both before the agent acts.
