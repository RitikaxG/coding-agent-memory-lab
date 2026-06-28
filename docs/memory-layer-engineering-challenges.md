# With-Memory vs Without-Memory Architecture

This document explains the architecture used in Day 3 of the `coding-agent-memory-lab` proof of work.

The same coding-agent task is evaluated in two modes:

```text
Fix memory retrieval so stale claim values are not reused
```

The goal is to show how retrieved memory changes the agent’s context, tool loop, validation result, and memory write-back behavior.

---

## Core Difference

```text
Without memory = repo context only
With memory    = repo context + retrieved scoped memory
```

Both runs receive the same user task and repo summary. The difference is whether the agent also receives useful memories from previous sessions.

---

## Without-Memory Pipeline

```text
User task
  ↓
Repo summary
  ↓
Context pack without memories
  ↓
Simulated agent tool loop
  ↓
Validate agent run
  ↓
Validation fails
  ↓
Memory write-back blocked
```

In the without-memory run, the agent only knows:

```text
- current task
- repo summary
- important files
- available scripts
- generic coding actions
```

It does not know the previous stale-memory lesson:

```text
Do not reuse old claim-specific values.
Memory should suggest reusable workflow patterns only.
Current validation must decide current claim truth.
```

The agent can still perform normal coding steps:

```text
search_code
read_file
suggest_edit
run_command
write_memory
```

But it fails the stale-memory safety check because the context does not include the required safety framing.

### Result

```text
shorter context
no retrieved memory
missing stale-memory safety rule
validation fails
memory write-back blocked
```

---

## With-Memory Pipeline

```text
User task
  ↓
Repo summary
  ↓
Memory provider searches scoped memories
  ↓
Top relevant memories retrieved
  ↓
Context pack with memories and safety notes
  ↓
Simulated agent tool loop
  ↓
Validate agent run
  ↓
Validation passes
  ↓
Safe reusable memory written back
```

In the with-memory run, the agent knows everything from the no-memory run plus retrieved memories such as:

```text
- stale claim values should not be reused
- previous memory bugs came from retrieving exact old values
- memory should return reusable workflow patterns
- current validation must still own required field checks
```

This changes the agent’s behavior.

Instead of searching broadly, the agent focuses on:

```text
- memory retrieval logic
- stale-value safety
- validation boundary
- safe memory write-back
```

### Result

```text
larger context
3 relevant memories retrieved
stale-memory safety framing included
validation passes
safe bug-fix pattern written back
```

---

## Why Without-Memory Fails

The without-memory run is not wrong because it skips normal coding steps.

It passes:

```text
search before edit
read before edit
validation command present
write memory after validation
no direct stale value reuse
```

But it fails:

```text
stale_memory_safety_present
```

This means the agent did not include the task-specific safety rule required for stale-memory bugs.

The missing rule is:

```text
Memory must not be treated as current claim truth.
```

---

## Why With-Memory Passes

The with-memory run passes because retrieved memory provides the missing safety context.

The agent receives the prior lesson:

```text
Memory can suggest a reusable pattern, but it cannot provide the current claim value.
```

So validation passes:

```text
search before edit
read before edit
validation command present
write memory after validation
no stale claim-specific value reuse
stale-memory safety framing present
```

After validation passes, the system writes back a new reusable memory:

```text
When fixing memory retrieval, reuse workflow patterns but require current evidence before applying claim-specific values.
```

---

## Important Token Interpretation

In this run:

```text
without_memory = fewer tokens
with_memory    = more tokens
```

This is expected.

The goal of memory here is not token reduction. The goal is safer and more informed agent behavior.

The correct conclusion is:

```text
The no-memory run is shorter but fails safety validation.
The with-memory run is larger but passes validation and writes back a safe reusable memory.
```

---

## Architecture Meaning

A memory-first coding agent should not blindly inject memory into the prompt.

The correct architecture is:

```text
retrieve memory
  ↓
build context pack
  ↓
simulate or execute tool loop
  ↓
validate agent run
  ↓
write memory only if validation passes
```

Memory is useful only when it improves the agent’s next action, safety framing, and future learning.

---

## Final Takeaway

Without memory, the agent acts from current repo context only and may miss important prior lessons.

With memory, the agent receives scoped prior knowledge before acting, passes safety validation, and writes back only reusable learning.

This proves the main MemCode idea:

```text
Repo context tells the agent what exists now.
Memory tells the agent what was learned before.
Validation decides whether that memory was used safely.
```
