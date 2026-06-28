# Memory Providers in MemCode: Recall Engines and Provider Fit

## 1. Core idea

In MemCode, a memory provider should not be treated as only a database.

A normal database answers:

```text
What was stored?
```

A memory provider answers:

```text
What should be recalled for this coding task right now?
```

That is why a memory provider behaves like a **recall engine**.

It may decide:

```text
- what is worth remembering
- how memory is scoped
- how memory is indexed
- how memory is searched
- how memories are ranked
- how related memories are connected
- how stale or conflicting memories are handled
- what should be injected into the coding-agent context pack
```

So the product value is not just:

```text
save memory → search memory → delete memory
```

The product value is:

```text
same coding agent
same repo
same task
different recall behavior
```

---

## 2. Why MemCode needs provider abstraction

MemCode should not become a wrapper around Supermemory, Mem0, Hermes, or any one provider.

MemCode should own the canonical state:

```text
- users
- projects
- repos
- conversations
- agent runs
- tool events
- repo summaries
- memory events
- provider bindings
- provider sync status
```

Memory providers should own recall behavior:

```text
- what memories are relevant
- how they are ranked
- whether graph/context/session memory should be used
- what should be returned to the agent
```

Correct architecture:

```text
MemCode DB
  = source of truth

MemoryEvent
  = portable memory unit

MemoryProvider
  = adapter interface

ProviderBinding
  = which provider is active for this user/project

ProviderSyncStatus
  = tracks which memories are synced where

PromptAssembler
  = combines repo summary + instructions + retrieved memory

CodingAgentHarness
  = scans repo, runs tools, edits files, validates, and writes memory back
```

Bad design:

```text
Every event → MemCode DB → Supermemory → Mem0 → Hermes → Default provider
```

This causes duplicate storage, high latency, high cost, provider drift, and deletion/consistency problems.

Better design:

```text
Important event happens
  ↓
Save canonical MemoryEvent in MemCode DB
  ↓
Sync to active provider
  ↓
Backfill other providers lazily only when needed
```

---

## 3. ClaimFlow AI example

Assume I am using MemCode inside the ClaimFlow AI repo.

ClaimFlow AI has many connected parts:

```text
extraction
validation
policy RAG
memory
guarded agent actions
human review
evals
observability
trace dashboard
synthetic packets
```

A generic coding agent may only see the current prompt and repo files.

MemCode should assemble a better context pack:

```text
Repo summary:
- ClaimFlow AI is a Next.js / Prisma / Bun project.
- It implements an insurance claim workflow.

Agent instructions:
- Use Bun.
- Do not overbuild.
- Keep changes implementation-ready.

Retrieved memory:
- Policy RAG answers must cite policy chunks.
- LLM can recommend actions but backend guardrails must enforce safety.
- Memory should reuse workflow patterns, not stale claim-specific values.
- Required fields must block unsafe status transitions.

Current task:
Fix memory retrieval so stale vehicle.registrationNumber is not reused.
```

This is where provider choice matters.

---

## 4. Supermemory fit in ClaimFlow AI

Use Supermemory when the agent needs broad project/document context.

In ClaimFlow AI, this means tasks like:

```text
- Revamp the README using Week 1–6 docs.
- Implement policy comparison using existing RAG notes.
- Understand how extraction → validation → RAG → memory → review → evals connect.
- Search across policy documents, architecture notes, previous conversations, and eval notes.
```

Supermemory is useful when the agent needs to retrieve from a larger context pool:

```text
repo docs
architecture notes
policy docs
RAG notes
eval notes
previous project discussions
README sections
workflow diagrams
```

Example task:

```text
Add support for checking whether a stolen vehicle claim requires a police report before approval.
```

Supermemory-style recall may return:

```text
- policy chunk saying theft claims require police report/FIR
- Week 3 RAG note about policy-grounded answers
- Week 4 guardrail note that agent cannot auto-approve
- Week 6 eval note about missing required documents
- architecture note explaining extraction → validation → RAG → review
```

Core USP:

```text
Supermemory = broad context infrastructure + RAG-style project memory
```

Best for:

```text
large context retrieval
document-heavy workflows
policy/docs search
architecture notes
project-wide knowledge
```

In MemCode:

```text
SupermemoryProvider should be used when the coding task depends on broad project knowledge, docs, policies, and historical context.
```

---

## 5. Mem0 fit in ClaimFlow AI

Use Mem0 when the agent needs durable learned memories across sessions.

In ClaimFlow AI, this means tasks like:

```text
- Fix the same memory retrieval issue we saw earlier.
- Continue the missing-field workflow.
- Remember that stale claim values should never be reused.
- Use the same reviewer correction pattern as before.
- Do not repeat the bug where pending bypassed validation.
```

This is less about searching all docs and more about remembering learned patterns.

Example task:

```text
Fix memory retrieval so a previous claim’s vehicle.registrationNumber is not reused in a new claim.
```

Mem0-style recall may return:

```text
- Previous bug: vehicle.registrationNumber was missing and reviewer supplied it.
- Rule: retrieve the workflow pattern, not the old claim-specific value.
- Required fields must be validated before approval or pending transition.
- Reviewer edits should create memory only after validation succeeds.
```

Core USP:

```text
Mem0 = persistent scoped memory + learned user/repo/session facts + graph/entity recall
```

Best for:

```text
user preferences
repo facts
bug-fix patterns
recurring workflow mistakes
entity relationships
cross-session continuity
```

In MemCode:

```text
Mem0Provider should be used when the coding task depends on what the agent learned before about this user, repo, bug, file, workflow, or decision.
```

---

## 6. Hermes-style fit in ClaimFlow AI

Hermes is different from Supermemory and Mem0.

Use Hermes-style architecture when the important part is the local coding-agent runtime experience.

In ClaimFlow AI, a Hermes-style/default local provider could load a small curated memory before every session:

```text
USER.md
- User prefers architecture-first reasoning.
- User uses Bun.
- User wants file-by-file implementation guidance.

MEMORY.md
- ClaimFlow AI pipeline is extraction → validation → policy RAG → guarded agent action → human review → evals → observability.
- Do not allow LLM to approve/reject/delete claims directly.
- Memory should retrieve reusable patterns, not stale claim-specific values.
- Required fields must block unsafe status transitions.
```

Then the agent runs through a controlled tool loop:

```text
search_code
read_file
suggest_edit
run_command
write_memory
```

Example task:

```text
Fix the pending-state bug where a claim can move forward without required information.
```

Hermes-style runtime helps because the agent begins with local project rules already loaded, acts through tools, and writes back a new compact memory after the fix.

Core USP:

```text
Hermes-style memory = local curated memory + prompt injection + agent runtime/provider orchestration pattern
```

Best for:

```text
CLI coding-agent experience
local-first memory
small always-in-context rules
visible/editable memory files
session lifecycle
provider plugin orchestration
```

In MemCode:

```text
Hermes-style/default provider should be used as the local baseline memory layer and runtime inspiration before integrating external providers.
```

---

## 7. Same ClaimFlow task across providers

Task:

```text
Fix memory retrieval so stale vehicle.registrationNumber is not reused.
```

Supermemory would retrieve:

```text
- Week 5 memory docs
- architecture notes about memory + review
- policy/RAG docs
- eval notes
- trace workflow docs
```

Best when the agent asks:

```text
What broad project context explains this feature?
```

Mem0 would retrieve:

```text
- previous missing vehicle.registrationNumber bug
- stale value reuse warning
- reviewer correction pattern
- required-field validation rule
```

Best when the agent asks:

```text
What did we learn last time this bug happened?
```

Hermes-style/default memory would load:

```text
- use Bun
- ClaimFlow has guarded agent actions
- do not reuse stale claim values
- required fields must block unsafe transitions
```

Best when the agent asks:

```text
What local rules should always be in the coding-agent session?
```

---

## 8. Provider decision table

| ClaimFlow AI situation | Preferred provider/style | Why |
| --- | --- | --- |
| Need to search policy docs, Week docs, architecture notes, eval notes | Supermemory | Broad RAG/context infrastructure |
| Need to remember previous bug-fix patterns and reviewer correction behavior | Mem0 | Durable scoped memory |
| Need entity relationships like claim → field → policy → reviewer action | Mem0 | Graph/entity recall |
| Need local rules always loaded before coding | Hermes-style/default | Curated prompt memory |
| Need CLI coding-agent runtime with tools and memory write-back | Hermes-style/default | Runtime/session pattern |
| Need to prove MemCode architecture in 3-day lab | Default local provider first | Avoid overbuilding integrations |

---

## 9. Final mental model

For ClaimFlow AI:

```text
Supermemory:
“Search my whole project brain.”

Mem0:
“Remember what we learned across sessions.”

Hermes:
“Run the coding agent with local memory and tools.”

MemCode:
“Own the canonical memory events and make providers swappable.”
```

Provider switching should not mean moving the whole product state.

It should mean:

```text
same ClaimFlow AI repo
same MemCode harness
same canonical memories
different recall engine
```

That is the architectural value of MemCode.
