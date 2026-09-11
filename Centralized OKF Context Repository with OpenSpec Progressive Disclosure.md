# Centralized OKF Context Repository with OpenSpec Progressive Disclosure

## Objective

Establish a centralized, durable source of architectural and domain context that can be consumed consistently by AI-assisted engineering workflows across a polyrepository environment.

The model combines:

**OKF** as the canonical knowledge representation and progressive-disclosure mechanism.

**OpenSpec** as the change-planning and implementation workflow.

**OpenSpec `config.yaml`** as the enforcement point that requires agents working in any participating repository to consult shared OKF context before deriving context from the local repository.

The desired behavior is:

```text
Targeted Change
      │
      ▼
OpenSpec workflow invoked
      │
      ▼
Read repository openspec/config.yaml
      │
      ▼
Resolve shared context repository
      │
      ▼
Traverse OKF progressively
      │
      ├── Entry
      │      ↓
      ├── Relevant Domain
      │      ↓
      ├── Relevant Capability / System
      │      ↓
      └── Granular Concepts / Decisions / Constraints
             │
             ▼
Only then inspect local repository implementation
             │
             ▼
Proposal → Spec → Design → Tasks → Apply
```

The critical principle is:

> **Shared organizational knowledge is discovered before repository-local implementation details.**

The codebase answers *how the system currently implements something*. The OKF corpus answers *why the system exists, how it participates in the larger architecture, what constraints apply, and which decisions must not be rediscovered locally.*

---

# 1. Architectural Model

The system consists of one central context repository and N implementation repositories.

```text
engineering-context/
│
├── .openspec-store/
│   └── store.yaml
│
├── openspec/
│   └── specs/
│       └── context-routing/
│           └── spec.md
│
└── .okf/
    ├── index.md
    ├── overview.md
    │
    ├── domains/
    │   ├── index.md
    │   ├── payments.md
    │   ├── identity.md
    │   ├── customer.md
    │   └── observability.md
    │
    ├── systems/
    │   ├── index.md
    │   ├── authorization-gateway.md
    │   ├── settlement-stream.md
    │   └── ledger-posting.md
    │
    ├── capabilities/
    │   ├── index.md
    │   ├── authorization.md
    │   ├── clearing.md
    │   └── posting.md
    │
    ├── decisions/
    │   ├── index.md
    │   ├── event-source-of-truth.md
    │   └── settlement-idempotency.md
    │
    └── constraints/
        ├── index.md
        ├── posting-sla.md
        └── data-classification.md
```

Implementation repositories retain their own OpenSpec lifecycle:

```text
authorization-service/
├── src/
├── tests/
└── openspec/
    ├── config.yaml
    ├── specs/
    └── changes/

settlement-service/
├── src/
├── tests/
└── openspec/
    ├── config.yaml
    ├── specs/
    └── changes/
```

This avoids turning the centralized repository into a giant cross-repository change-management monolith.

The centralized repository owns **knowledge**.

The implementation repository owns **changes to its implementation**.

---

# 2. Why OKF Is the Knowledge Plane

OKF is well suited to this model because a bundle is a hierarchy of Markdown concept documents and optional directory indexes. Its indexing model is explicitly intended for progressive disclosure: an agent can discover what exists before loading individual documents. OKF implementations also support search so the corpus does not need to be loaded wholesale into the model's context window.

An important implementation detail is that OKF `index.md` files are navigation structures and do not themselves use concept frontmatter. Concept documents do use YAML frontmatter, and OKF permits the format to remain extensible. Therefore, disclosure levels should be expressed on the **concept documents**, while `index.md` provides the hierarchical map.

This gives us two complementary routing mechanisms:

```text
directory/index.md
        │
        └── structural discovery

concept frontmatter
        │
        └── semantic relevance + disclosure level
```

---

# 3. Progressive Disclosure Contract

The OKF bundle should define a small organizational extension to OKF frontmatter:

```yaml
---
type: ArchitectureContext
title: Debit Authorization Domain
description: >
  Architectural context for debit authorization, network integration,
  decisioning, holds, and downstream settlement relationships.

disclosure: domain

domains:
  - debit
  - payments

capabilities:
  - authorization
  - decisioning

repos:
  - auth-gateway
  - auth-domain
  - settlement-service

tags:
  - authorization
  - iso8583
  - debit
  - pulse

status: active
stale_after: 2026-12-01

generated:
  by: human:architecture-team
  at: 2026-09-11T00:00:00Z
---
```

`type` remains the OKF concept type.

`description` is intentionally valuable because it allows an agent to determine relevance without reading the entire document.

The organizational fields establish progressive disclosure semantics:

| Field | Purpose |
|---|---|
| `disclosure` | Determines expected retrieval depth |
| `domains` | Business/domain routing |
| `capabilities` | Capability routing |
| `repos` | Repositories to which the concept commonly applies |
| `tags` | Fine-grained semantic retrieval |
| `status` | Active/deprecated/draft lifecycle |
| `stale_after` | Forces freshness consideration |

OKF itself already supports lifecycle/provenance concepts such as `generated`, `verified`, `status`, and `stale_after`; these are useful for preventing centralized context from quietly becoming stale.

---

# 4. Disclosure Levels

The corpus should use four practical levels.

| Layer | Purpose | Typical size | Loaded when |
|---|---|---:|---|
| `entry` | Enterprise/system map and vocabulary | Very small | Always |
| `domain` | Domain architecture and major boundaries | Small | Domain matches change |
| `capability` | System/capability relationships and contracts | Medium | Capability is implicated |
| `granular` | Decisions, constraints, protocols, schemas, detailed behavior | Focused | Specifically relevant |

For example:

```yaml
disclosure: entry
```

might describe the payment ecosystem and identify the major domains.

A payment-domain document then says:

```yaml
disclosure: domain
domains: [payments]
```

An authorization concept might say:

```yaml
disclosure: capability
domains: [payments]
capabilities: [authorization]
repos: [auth-gateway, auth-domain]
```

A specific ISO 8583 behavior could say:

```yaml
disclosure: granular
domains: [payments]
capabilities: [authorization]
tags: [iso8583, 0200, 0210, reversals]
repos: [auth-gateway]
```

The word `granular` does **not** mean "load last regardless."

It means:

> Load only when routing information from higher levels indicates that the concept may materially affect the targeted change.

---

# 5. Traversal Algorithm

The consumption contract should be deterministic:

```text
INPUT:
    change intent
    current repository
    affected paths if known
    OpenSpec artifact being created

PHASE 1 — RESOLVE
    Resolve the shared context OpenSpec store.
    Locate its .okf bundle.

PHASE 2 — ENTRY
    Read .okf/index.md.
    Read entry-level concepts.

PHASE 3 — CLASSIFY
    Infer candidate:
        domains
        capabilities
        systems
        repository relationships
        terminology

PHASE 4 — DOMAIN DISCLOSURE
    Follow only matching domain indexes/concepts.

PHASE 5 — CAPABILITY DISCLOSURE
    Follow only capabilities/systems implicated by the change.

PHASE 6 — GRANULAR RETRIEVAL
    Search frontmatter/tags/descriptions.
    Read only relevant decisions, constraints,
    contracts, schemas and operational knowledge.

PHASE 7 — LOCAL CONTEXT
    Inspect repository source code, local docs,
    current OpenSpec specs and active changes.

PHASE 8 — RECONCILE
    If local implementation conflicts with OKF:
        do not silently choose one;
        identify the discrepancy.

PHASE 9 — PLAN
    Produce the OpenSpec artifact using:
        shared architectural context
        +
        repository-local implementation reality
        +
        explicit user intent.
```

This is what creates **progressive disclosure instead of centralized context dumping**.

OKF's own consumption model is similarly based on reading the map/search results and then loading the relevant bodies rather than loading an entire corpus.

---

# 6. Central Repository as an OpenSpec Store

The centralized context repository should also be registered as an OpenSpec store.

For example:

```bash
git clone git@github.example.com:architecture/engineering-context.git \
  ~/openspec/engineering-context

openspec store register ~/openspec/engineering-context \
  --id engineering-context
```

OpenSpec stores are registered once per developer machine and can then be addressed by their store ID. Referenced stores are read-only to the consuming project.

The central repository therefore contains:

```text
engineering-context/
├── .openspec-store/
│   └── store.yaml
├── openspec/
│   └── specs/
│       └── shared-context/
│           └── spec.md
└── .okf/
    └── ...
```

The OpenSpec portion is deliberately thin.

It exists primarily to make the repository discoverable to OpenSpec.

The OKF bundle remains the authoritative context corpus.

---

# 7. The OpenSpec Bridge Spec

Because OpenSpec `references:` currently exposes an index of **OpenSpec specs** from referenced stores rather than automatically indexing arbitrary OKF documents, the central repository should expose a small bridge specification.

For example:

```markdown
# Shared Engineering Context

## Purpose

The authoritative cross-repository engineering context is maintained
in the `.okf/` bundle at the root of this store.

Consumers MUST use progressive disclosure rather than loading the entire
bundle.

Start with:

    .okf/index.md

Then resolve relevant domain, capability, system, decision and constraint
concepts before inspecting implementation repositories.

The OKF corpus is authoritative for architectural intent and shared
cross-repository constraints.

Repository source is authoritative for current implementation behavior.

Any conflict between the two MUST be surfaced rather than silently
resolved.
```

This document is not intended to duplicate the OKF corpus.

Its purpose is to create a discoverable **pointer and behavioral contract** between OpenSpec and OKF.

---

# 8. Polyrepo `openspec/config.yaml`

Each repository receives essentially the same configuration.

```yaml
schema: spec-driven

references:
  - id: engineering-context
    remote: git@github.example.com:architecture/engineering-context.git

context: |
  SHARED CONTEXT RETRIEVAL POLICY

  This repository participates in the centralized engineering context model.

  Before creating an OpenSpec artifact, applying a change, or reasoning
  materially about architecture:

  1. Resolve the `engineering-context` referenced OpenSpec store.

  2. Treat the `.okf/` bundle in that repository as the canonical source
     of shared architectural, domain, capability, decision, constraint,
     and operational context.

  3. Traverse OKF BEFORE performing broad discovery of this repository.

  4. Use progressive disclosure:
       entry -> domain -> capability/system -> granular.

  5. Begin with `.okf/index.md`.

  6. Use index descriptions and concept frontmatter to determine relevance.
     Prefer `description`, `disclosure`, `domains`, `capabilities`, `repos`,
     and `tags` before reading concept bodies.

  7. Do NOT load the complete OKF bundle.

  8. Read only concepts reasonably related to the requested change.

  9. After establishing shared context, inspect this repository to determine
     its current implementation state.

  10. Shared OKF context describes architectural intent and cross-repository
      constraints. Repository code describes current implementation.

  11. If implementation contradicts shared context, explicitly surface the
      discrepancy. Do not silently assume either source is correct.

  12. Identify material shared-context concepts used when explaining
      architectural decisions or generating design artifacts.

rules:
  proposal:
    - Establish relevant shared OKF domain/capability context before defining scope.
    - Identify cross-repository implications discovered through shared context.

  specs:
    - Requirements must not contradict applicable shared OKF constraints without explicitly documenting the exception.

  design:
    - Base architectural decisions on applicable shared OKF decisions, constraints, and capability relationships.
    - Surface conflicts between proposed design, existing implementation, and shared context.

  tasks:
    - Do not create tasks that knowingly violate applicable shared-context constraints without an explicit design decision.

operations:
  apply:
    guidance:
      - Re-check relevant shared OKF constraints when implementation reveals assumptions not captured during planning.

  archive:
    guidance:
      - Identify whether the completed change invalidates or materially changes shared OKF knowledge.
```

OpenSpec's `context:` is injected into every artifact instruction and also reaches apply/archive operations, making it the appropriate place for the universal retrieval policy. Artifact-specific `rules:` then reinforce the behavior at important planning stages.

This distinction matters:

```text
context:
    "You MUST consult shared knowledge this way."

rules.design:
    "Here is how shared knowledge affects a design."

rules.specs:
    "Here is how shared knowledge affects requirements."
```

---

# 9. Context Precedence

The system should explicitly define authority rather than merely saying everything is "context."

```text
USER INTENT
    │
    │  What are we trying to change?
    ▼
OKF SHARED CONTEXT
    │
    │  What architecture, constraints and domain semantics apply?
    ▼
LOCAL OPENSPEC SPECS
    │
    │  What behavior has this repository formally committed to?
    ▼
LOCAL CODE
    │
    │  What does the system actually do today?
    ▼
CHANGE ARTIFACTS
```

This does not mean OKF blindly overrides code.

It means a contradiction becomes information.

For example:

```text
OKF:
"Settlement publication must be idempotent."

Code:
"No deduplication or idempotency protection exists."

Wrong agent behavior:
"Apparently idempotency is not required."

Correct agent behavior:
"Shared context defines idempotency as an architectural constraint,
but the current implementation does not appear to satisfy it.
The proposed change must either preserve/restore that constraint or
explicitly revise the architectural decision."
```

That behavior is one of the major benefits of separating **intent knowledge** from **implementation discovery**.

---

# 10. Why the Repository Should Not Simply Be One Giant Prompt

The centralized repository should never be copied wholesale into every OpenSpec `context:`.

OpenSpec limits `context:` to 50 KB, and its documentation explicitly describes it as planning context rather than a replacement for project documentation.

More importantly, doing so would destroy the principal benefit of OKF.

```text
BAD

OpenSpec
   ↓
load 400 KB architecture document
   ↓
hope the model notices the relevant paragraph


GOOD

OpenSpec
   ↓
mandatory OKF retrieval policy
   ↓
entry map
   ↓
payments
   ↓
authorization
   ↓
network timeout decision
   ↓
2–4 relevant concept documents
```

The centralized corpus can therefore become very large without every engineering task paying the context-window cost.

---

# 11. Staleness and Synchronization

There is one important OpenSpec operational consideration: referenced stores are local checkouts. OpenSpec does not automatically clone, pull, or synchronize them. A stale local checkout therefore means stale shared context.

That should be handled operationally rather than hidden.

A standard developer/CI bootstrap can perform:

```bash
git -C ~/openspec/engineering-context fetch origin
git -C ~/openspec/engineering-context pull --ff-only

openspec doctor
okf validate ~/openspec/engineering-context/.okf
okf lint ~/openspec/engineering-context/.okf
```

This makes freshness observable.

The `remote:` value in `references:` is still useful because `openspec doctor` can provide remediation instructions when the referenced store is missing. It does not itself keep the repository synchronized.

---

# 12. Change-to-Knowledge Feedback Loop

The model should be bidirectional conceptually, even though the shared reference is read-only during ordinary repository work.

```text
Shared OKF
    ↓
OpenSpec Change
    ↓
Implementation
    ↓
Archive
    ↓
Did architectural knowledge change?
    │
    ├── no  → done
    │
    └── yes
          ↓
      OKF update PR
          ↓
      architecture review
          ↓
      Shared OKF
```

A local change therefore should not casually mutate organizational context.

Instead, if an implementation introduces a genuinely new shared architectural fact, the OpenSpec archive step should flag:

```text
SHARED CONTEXT IMPACT

This change modifies an architectural assumption represented by:

.okf/decisions/settlement-idempotency.md

A follow-up change to the engineering-context repository is required.
```

This preserves independent review of shared knowledge.

---

# 13. Governance Boundary

The central repository should contain information that is expensive or dangerous to rediscover independently in each repo.

Good candidates include cross-service relationships, domain vocabulary, canonical flows, architectural decisions, invariants, SLAs, protocols, integration contracts, security constraints, data ownership, platform capabilities, and historically significant decisions.

Repository-local material should remain local when it concerns implementation details, test structure, package layout, language-specific conventions, local refactoring information, or behavior that has no meaningful cross-repository consequence.

The heuristic is:

> **If another repository could make a materially worse engineering decision because it did not know this fact, the fact probably belongs in shared OKF.**

---

# 14. Stronger Enforcement

`config.yaml` is the appropriate first enforcement mechanism because OpenSpec injects project context into its workflow instructions before artifact generation.

However, this is still ultimately an **agent instruction**, not a runtime filesystem interceptor.

Therefore there are two levels of enforcement:

```text
LEVEL 1 — Recommended baseline

OpenSpec references
        +
OpenSpec context retrieval policy
        +
OKF progressive disclosure
        +
CI validation

LEVEL 2 — Hard enforcement

Custom OpenSpec workflow/schema or agent wrapper
        ↓
execute context preflight
        ↓
fail if shared context cannot be resolved
        ↓
retrieve OKF context
        ↓
only then invoke artifact creation
```

If the requirement is literally:

> "An agent must be technically unable to proceed without first resolving OKF"

then eventually the organization should implement the second model.

If the requirement is:

> "Every OpenSpec invocation contains an authoritative instruction that requires OKF-first retrieval"

then `config.yaml` provides a clean and low-complexity implementation.

---

# 15. Recommended Target State

The end state is:

```text
                    ┌─────────────────────────┐
                    │ engineering-context     │
                    │                         │
                    │ OpenSpec Store          │
                    │       +                 │
                    │ Central OKF Bundle      │
                    └────────────┬────────────┘
                                 │
                      read-only reference
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
      auth-repo            settlement-repo        ledger-repo
      OpenSpec             OpenSpec                OpenSpec
      config.yaml          config.yaml             config.yaml
           │                     │                     │
           └──────────────┬──────┴──────────────┬──────┘
                          │                     │
                  mandatory OKF-first      mandatory OKF-first
                     discovery                discovery
                          │                     │
                          ▼                     ▼
                     local code            local code
                          │                     │
                          ▼                     ▼
                   repo-local specs       repo-local specs
                    and changes            and changes
```

The resulting responsibility model is simple:

| Concern | Owner |
|---|---|
| Organizational/domain knowledge | Central OKF |
| Cross-repository decisions | Central OKF |
| Context discovery hierarchy | OKF indexes + frontmatter |
| Mandatory retrieval behavior | OpenSpec `context:` |
| Artifact-specific behavior | OpenSpec `rules:` |
| Shared repository discovery | OpenSpec `references:` |
| Repository behavior contract | Local OpenSpec specs |
| Current implementation | Source code |
| Proposed implementation | Local OpenSpec change |
| Knowledge freshness | OKF lifecycle metadata + CI |

## Core Principle

The architecture should not attempt to make OpenSpec itself become a knowledge-management system.

Instead:

> **OpenSpec determines when context is required. OKF determines how that context is discovered. The centralized repository determines where shared knowledge lives. The implementation repository determines how that knowledge manifests in code.**

That separation provides a scalable context model for polyrepo development without copying knowledge into every repository, bloating agent context windows, or forcing cross-repository implementation changes into a single centralized OpenSpec workflow.

The most important invariant is therefore:

```text
For every meaningful engineering change:

    Intent
      ↓
    Shared OKF context
      ↓
    Repository-local context
      ↓
    OpenSpec reasoning
      ↓
    Implementation

Never:

    Intent
      ↓
    Code search
      ↓
    Guess organizational context
      ↓
    OpenSpec artifact
```

This makes the shared OKF corpus the organization's **architectural memory**, while OpenSpec becomes the mechanism that ensures that memory participates in every targeted engineering change.