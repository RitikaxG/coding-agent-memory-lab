# Coding Agent Memory Lab

A small proof-of-understanding for how memory can be added to a coding-agent runtime.

This project is being built as a focused mini implementation for understanding memory-first coding agents: how they scan a repository, extract current repo context, retrieve durable memory, build a compact context pack, simulate an agent tool loop, validate the result, and write useful memory back.

The goal is not to build a full autonomous coding agent. The goal is to clearly show the architecture behind one.

---

## Architecture goal

```txt
Repo scan
  ↓
Repo context extraction
  ↓
Memory retrieval
  ↓
Context pack builder
  ↓
Agent tool loop simulation
  ↓
Validation summary
  ↓
Memory write-back
```

A memory-first coding agent needs two context layers:

1. **Current repo context** — what exists in the repository right now.
2. **Durable learned context** — what the agent learned from previous sessions.

Day 1 implements the first layer.

---

## Day 1: Repo Context Foundation

Before memory retrieval matters, the agent needs a compact understanding of the current repository.

Day 1 implements:

- Recursive repo scanning
- Ignoring noisy generated folders such as `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`
- Package manager detection
- Repo shape detection: `single-package`, `workspace`, or `monorepo`
- Package manifest detection
- Language hints
- Framework hints
- Tooling hints
- Important file detection
- Agent instruction file parsing
- Project context file parsing
- Compact terminal repo summary

This repo context becomes the foundation that Day 2 memory retrieval will combine with durable memories before building an agent context pack.

---

## Why this matters for coding agents

A coding agent should not blindly receive an entire repository. Large repositories are noisy, expensive, and hard for an LLM to reason over directly.

A repo-context layer answers:

```txt
What kind of repo is this?
How is it run?
What package manager does it use?
Is it a monorepo?
Which files are likely important?
Are there project-level instructions?
What context should later be combined with memory?
```

This is the first layer of a lightweight Agent-Computer Interface: instead of exposing raw filesystem access directly, the agent receives a compact, structured summary of the repository.

---

## Current implementation

```txt
index.ts
repo/
  scanRepo.ts
  detectProject.ts
  parseAgentInstructions.ts
  buildRepoSummary.ts
```

---

## Module overview

### `repo/scanRepo.ts`

Scans a repository recursively and returns:

- relative file paths
- ignored directory rules
- important repo-context files

It ignores noisy directories such as:

```txt
.git
node_modules
dist
build
.next
coverage
.turbo
.vercel
out
```

It detects important files such as:

```txt
package.json
README.md
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
tsconfig.json
next.config.*
vite.config.*
turbo.json
Dockerfile
docker-compose.yml
prisma/schema.prisma
.env.example
lockfiles
```

### `repo/detectProject.ts`

Detects generic repo-shape signals.

It extracts:

- package manager
- repo shape
- package manifests
- workspace hints
- language hints
- framework hints
- tooling hints
- root scripts

The detector intentionally avoids exhaustive dependency classification. Smaller libraries are not treated as architecture-level framework hints. It focuses on stable repo-shape evidence from lockfiles, manifests, dependencies, scripts, workspaces, and config files.

Example categories:

```txt
Languages:
- TypeScript
- Go
- Rust
- Python

Frameworks:
- Next.js
- React
- Express
- Fastify
- NestJS

Tooling:
- Docker
- Prisma
- Turborepo
- Vite
- Tailwind CSS
```

### `repo/parseAgentInstructions.ts`

Looks for project context files:

```txt
AGENTS.md
CLAUDE.md
.github/copilot-instructions.md
README.md
```

Agent-specific instruction files are separated from general project context files.

For example:

```txt
Agent instruction files:
- AGENTS.md
- CLAUDE.md

Project context files:
- README.md
```

If a repository only has a README, the README is treated as project context, not as an agent instruction file.

### `repo/buildRepoSummary.ts`

Combines:

```txt
repo scan
+ project metadata
+ project context files
= compact repo summary
```

This summary is the object that later becomes part of the agent context pack.

### `index.ts`

Provides a CLI entrypoint.

It prints a compact repo summary instead of dumping the entire repository structure.

---

## Install

```bash
bun install
```

---

## Typecheck

```bash
bun run check
```

---

## Run on this repo

```bash
bun run dev --repo . --task "Build repo context foundation"
```

---

## Run on another repo

```bash
bun run dev --repo ../claimflow-ai --task "Fix memory retrieval bug"
```

---

## Example output

```txt
REPO SUMMARY

Repo path: /Users/ritikagupta/Desktop/Devops/claimflow-ai
Package manager: bun
Repo shape: workspace
File count: 959
Package manifests: 17 detected
Workspace package manifests: 16 detected

Languages:
- TypeScript

Frameworks:
- Next.js
- React

Tooling:
- Docker
- Prisma
- Tailwind CSS
- Turborepo

Workspace hints:
- apps/*
- packages/*

Important files:
- .env.example
- Dockerfile
- README.md
- bun.lock
- docker-compose.yml
- package.json
- apps/web/next.config.ts
- packages/db/prisma/schema.prisma

Primary scripts:
- dev: turbo run dev
- build: turbo run build
- lint: turbo run lint
- check-types: turbo run check-types
- format: prettier --write "**/*.{ts,tsx,md}"

Other scripts: 28 detected

Agent instruction files:
- none detected

Project context files:
- README.md

Task:
Fix memory retrieval bug

Day 1 status: Repo context foundation generated successfully.
```

---

## Design decisions

### 1. The repo detector is generic

The detector does not contain ClaimFlow-specific assumptions.

It does not hardcode paths like:

```txt
packages/rag
packages/memory
packages/agent
```

Instead, it detects generic signals:

```txt
lockfiles
package manifests
workspaces
dependencies
config files
scripts
project instructions
```

This makes the repo layer useful across different repositories.

### 2. Frameworks, languages, and tooling are separated

The output avoids mixing everything into one `frameworkHints` bucket.

For example:

```txt
TypeScript → language
Next.js → framework
Docker → tooling
Prisma → tooling
Turborepo → tooling
```

This makes the repo summary easier for an agent to use.

### 3. Script output is compact

The CLI prints only primary scripts:

```txt
dev
build
test
lint
typecheck
check-types
format
```

Other scripts are counted but not dumped into the main summary.

This keeps the repo summary LLM-friendly.

### 4. Important files are compact

The scanner detects many important files, but the CLI prints a compact version so the summary remains readable.

Package manifests are counted separately, so every workspace `package.json` does not need to be repeated under important files.

### 5. README is project context, not an agent instruction file

`README.md` can help the agent understand the repository, but it is not the same as `AGENTS.md` or `CLAUDE.md`.

That distinction is reflected in the output.

---

## What Day 1 proves

Day 1 proves that the system can take a repository path and produce a compact, structured summary of the current repo state.

This is the first step toward a memory-first coding agent.

```txt
Repo scanner tells the agent what exists now.
Memory layer tells the agent what was learned before.
Context pack combines both before the agent enters the tool loop.
```

---

## What is intentionally not implemented yet

Day 1 does not include:

- Memory storage
- Memory retrieval
- Context pack generation
- Agent tool loop simulation
- Code editing
- Test execution
- Memory write-back

Those are later layers.

---

## Next: Day 2 Memory Architecture

Day 2 will add:

```txt
MemoryProvider interface
LocalMemoryProvider
memory scopes
memory types
seed memories
memory retrieval
memory write-back
context pack builder
```

The goal is to show how the current repo context from Day 1 can be combined with durable learned memory.

---

## Final architecture sentence

A memory-first coding agent has two context layers: current repo context and durable learned context. The repo scanner tells the agent what exists now; the memory layer tells it what was learned before. The context pack combines both before the agent enters the tool loop. The hard part is not storing everything — it is deciding what deserves to become memory, how it is scoped, how it is retrieved, and when it should be ignored.
