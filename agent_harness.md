Yes. I would now make the directions explicitly **hook-independent** and treat hooks as an optional optimization that is not part of the definition of done.

That changes one important property of the design: without hooks, you lose **deterministic interception of every arbitrary tool call**. But you do not lose the se([Claude][1])architecture. Claude Code's skills can auto-trigger from semantic descriptions, can execute dynamic context commands when invoked, and personal skills apply across projects. Subagents can also maintain `memory: user` across projects. ([Claude][2])

In ([Claude][2])using CLAUDE.md to establish policies like "architecture questions should trigger a research pass," while Skills carry the procedural workflow. ([Claude][3])

I would update the implementation directions with the following. This **replaces the hook-centric portions** of the previous brief and adds `kb explain` as a first-class capability.

# Architecture Amendment: Hook-Free Operation and Knowledge Explainability

The following requirements amend the Self-Improving Knowledge Harness implementation specification.

These requirements take precedence over any previous requirement that assumes Claude Code hooks are available.

---

# 1. Hard Requirement: No Dependency on Claude Code Hooks

The harness MUST function completely without Claude Code hooks.

Assume the target enterprise environment may enforce managed Claude Code settings that prevent user-level and project-level hooks from executing.

Therefore:

```text
UserPromptSubmit
PreToolUse
PostToolUse
PostToolUseFailure
Stop
SessionStart
SessionEnd
```

must NOT be required for correct operation.

The core architecture must rely on:

```text
CLAUDE.md
    +
Claude Code Skills
    +
Claude Code Subagents
    +
normal Claude tool execution
    +
local kb CLI
    +
persistent filesystem knowledge
```

Hooks may be supported later as an OPTIONAL enhancement.

They must not be required by:

* installation
* research
* retrieval
* learning
* failure recording
* failure preflight
* knowledge promotion
* provenance
* explainability
* freshness handling
* contradiction handling

The harness must pass all core acceptance tests when hooks are completely unavailable.

---

# 2. Hook-Free Operating Model

The primary runtime architecture is:

```text
                       USER REQUEST
                            │
                            ▼
                 ┌────────────────────┐
                 │ Global CLAUDE.md   │
                 │ routing behavior   │
                 └─────────┬──────────┘
                           │
                    semantic match
                           │
                           ▼
                 ┌────────────────────┐
                 │ Research Skill     │
                 │ procedural policy  │
                 └─────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Researcher Agent   │
                 │ isolated context   │
                 └─────────┬──────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   Agent Memory       Canonical KB      Source Pointers
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                    enough information?
                      ┌────┴────┐
                    yes         no
                     │           │
                     │           ▼
                     │    kb preflight
                     │           │
                     │           ▼
                     │    targeted MCP
                     │           │
                     │           ▼
                     │    broader search
                     │     if necessary
                     │           │
                     └─────┬─────┘
                           ▼
                       synthesis
                           │
                           ▼
                     learning pass
                           │
             ┌─────────────┴──────────────┐
             ▼                            ▼
       ledger events                 candidates
             │
             └─────────────┬──────────────┘
                           ▼
                        curator
                           │
                           ▼
                   canonical knowledge
```

The workflow itself is responsible for invoking the knowledge tools.

Do not depend on lifecycle interception.

---

# 3. Global CLAUDE.md Amendment

Add the following operating requirements to the global Claude instructions.

Keep them concise.

```markdown
## Knowledge-first operation

When work requires enterprise-specific knowledge, architecture standards,
internal system knowledge, prior implementations, or research:

1. Use the research workflow.
2. Search accumulated knowledge before broad enterprise search.
3. Prefer known authoritative source pointers over semantic rediscovery.
4. Revalidate stale or high-risk knowledge when appropriate.

## Failure learning

When a tool or workflow fails:

1. Determine whether the failure is reusable rather than project-specific noise.
2. Check known failure guidance before repeatedly retrying.
3. Record reusable failures through the knowledge harness.
4. When the failure is solved, record the successful remediation.
5. Apply known remediations before repeating previously solved mistakes.

## Knowledge provenance

Do not treat stored knowledge as authoritative merely because it exists.

When the authority or reasoning behind a stored conclusion matters, inspect
its provenance with `kb explain`.

## Learning

At the end of substantive research or investigation, capture reusable:
- facts
- procedures
- source pointers
- operational heuristics
- failure/remediation pairs

Project-specific details should remain project-scoped.
```

These instructions are behavioral guidance.

They are not security enforcement.

---

# 4. Research Skill Becomes the Primary Orchestrator

The `research` Skill is now responsible for the full lifecycle that hooks previously assisted with.

Its workflow MUST be:

```text
1. Understand request

2. Read relevant project context

3. Search local canonical knowledge

4. Search known source pointers

5. Consult researcher memory

6. Inspect provenance when an existing result materially affects the answer

7. Evaluate:
      relevance
      authority
      freshness
      confidence
      scope

8. Identify unresolved questions

9. Check known tool/search guidance

10. Query targeted authoritative sources

11. Expand to broad semantic search only when necessary

12. Record reusable failures encountered during research

13. Record successful remediations

14. Synthesize result

15. Perform mandatory learning pass

16. Append reusable observations

17. Create appropriate candidates

18. Capture newly discovered source pointers

19. Identify canonical knowledge that may require supersession
```

The learning pass is part of the research procedure.

It is not optional.

---

# 5. Deterministic Local Retrieval Within a Skill

Where supported and permitted, the research Skill SHOULD use Claude Code Skill dynamic context execution to perform local retrieval when the Skill is invoked.

Conceptually:

```markdown
## Existing accumulated knowledge

!`kb search "$ARGUMENTS" --limit 8 --format context`
```

or through a bundled Skill helper:

```markdown
!`${CLAUDE_SKILL_DIR}/scripts/retrieve-context "$ARGUMENTS"`
```

The helper should:

1. search local canonical knowledge
2. search source pointers
3. identify stale matches
4. return only a small context payload
5. never perform external network searches

This provides automatic local retrieval when the research Skill runs without requiring a Claude Code lifecycle hook.

Do not rely exclusively on dynamic context execution.

The Researcher Agent must still explicitly understand that local retrieval is the first stage of research.

---

# 6. Researcher Mandatory Tool Protocol

Add this requirement to `researcher.md`.

```markdown
# Mandatory operating protocol

Before broad external research:

1. Search local canonical knowledge.
2. Search source pointers.
3. Review applicable persistent research memory.
4. Determine what remains unknown.

Before using an enterprise tool whose behavior has prior learned guidance:

1. Query applicable failure guards or operational guidance.
2. Apply known valid constraints.

After an external tool fails:

1. Do not immediately retry the same operation repeatedly.
2. Normalize the failure.
3. Check whether the failure has been encountered before.
4. Apply a known remediation if valid.
5. If the failure is reusable, record it.

After successfully resolving a reusable failure:

1. Record the remediation.
2. Link it to the failure signature.
3. Record evidence that the remediation succeeded.

At the completion of substantive research:

1. Record reusable findings.
2. Record newly discovered source pointers.
3. Identify stale or contradicted canonical knowledge.
4. Produce promotion candidates where warranted.
```

This protocol substitutes model-driven orchestration for lifecycle hooks.

---

# 7. kb preflight Without Hooks

`kb preflight` remains part of the implementation.

It is invoked explicitly by agents and Skills.

Support interfaces such as:

```bash
kb preflight \
  --tool enterprise-search.semantic-search \
  --operation search
```

and optionally:

```bash
kb preflight \
  --tool enterprise-search.semantic-search \
  --args-json '<json>'
```

The command searches:

```text
failure guards
operational constraints
known tool limits
successful remediation history
```

It returns concise guidance.

Example:

```text
KNOWN GUIDANCE

Tool:
enterprise-search.semantic-search

Confidence:
high

Constraints:
- maximum page size: 100
- use cursor pagination
- queries longer than 4KB are rejected

Evidence:
3 successful remediations
last verified: 2026-07-11

Canonical:
tool.enterprise-search.pagination@2
```

The researcher should consult this before executing operations where relevant prior guidance exists.

It does not need to run before every trivial command.

---

# 8. Explicit Failure Recording

Provide:

```bash
kb failure record
```

Example:

```bash
kb failure record \
  --tool enterprise-search.semantic-search \
  --error "requested page_size 500 exceeds maximum 100"
```

The CLI performs normalization.

It creates an append-only event such as:

```json
{
  "kind": "tool_failure",
  "tool": "enterprise-search.semantic-search",
  "failure_signature": "page_size_exceeds_maximum",
  "observed_at": "...",
  "context": {},
  "raw_error_hash": "..."
}
```

Do not necessarily persist the entire raw error.

Prefer the smallest information needed for future recognition.

---

# 9. Explicit Remediation Recording

Provide:

```bash
kb failure resolve
```

Example:

```bash
kb failure resolve \
  --signature page_size_exceeds_maximum \
  --resolution "Use page_size <= 100 and paginate using cursor" \
  --validated
```

The resulting event should link:

```text
failure
   ↓
remediation
   ↓
validation evidence
   ↓
failure guard candidate
```

A failure guard should only become canonical after sufficient confidence exists.

---

# 10. Limitation Without Hooks

Document this explicitly.

Without hooks, the harness CANNOT guarantee interception of every arbitrary tool invocation performed outside a governed Skill or agent workflow.

For example:

```text
generic Claude coding session
      ↓
direct Bash invocation
```

cannot be deterministically intercepted by the knowledge harness unless Claude voluntarily follows the global operating instructions.

This is acceptable.

The harness is a:

```text
knowledge and workflow optimization system
```

not an:

```text
enterprise security enforcement system
```

Security enforcement remains the responsibility of:

* Claude Code managed settings
* tool permissions
* MCP permissions
* operating system controls
* enterprise platform controls

Do not represent prompt-based preflight behavior as a deterministic security boundary.

---

# 11. Knowledge Explainability Is a First-Class Requirement

Implement:

```bash
kb explain <knowledge-id>
```

This command answers:

> Why does the harness believe this?

Explainability must not require a model call.

It should be reconstructable deterministically from persisted knowledge metadata, ledger events, source pointers, candidates, promotion records, and supersession relationships.

---

# 12. kb explain Required Output

For:

```bash
kb explain enterprise.aws.lambda.networking
```

produce approximately:

```text
KNOWLEDGE

ID:
enterprise.aws.lambda.networking

Active version:
3

Classification:
authoritative_fact

Scope:
enterprise

Status:
active

Confidence:
0.97

Authority:
authoritative_enterprise_source

Freshness:
fresh

Verified:
2026-08-20

Revalidate:
2026-11-20


WHY THIS IS ACTIVE

Version 3 superseded version 2 after newer authoritative
enterprise documentation was discovered.

Promotion reason:
The new source has higher freshness and equal authority to
the source used for version 2.


EVIDENCE

[1] event: 7ec...
    type: authoritative observation

    source:
      MCP: enterprise-architecture
      locator: architecture://serverless/lambda/networking

    observed:
      2026-08-20

    confidence:
      0.98


[2] event: a61...
    type: verified reference implementation

    source:
      repository: platform/reference-lambda
      path: modules/networking

    observed:
      2026-08-18

    confidence:
      0.91


SUPERSESSION HISTORY

v1
 │
 └── v2
       │
       └── v3 [ACTIVE]


CONTRADICTORY EVIDENCE

1 historical contradictory observation exists.

event:
3ba...

status:
superseded

reason:
older documentation


SOURCE POINTERS

Authoritative:
architecture://serverless/lambda/networking

Reference implementation:
platform/reference-lambda/modules/networking


REVALIDATION TRIGGERS

- after 2026-11-20
- infrastructure module major version changes
- authoritative architecture source changes
- conflicting authoritative evidence appears
```

---

# 13. Explainability Graph

Internally, model provenance as a graph even if SQLite relational tables are used.

Conceptually:

```text
                       source pointer
                            │
                            ▼
                       observation
                            │
                            ▼
                         candidate
                            │
                            ▼
                     promotion event
                            │
                            ▼
canonical @1 ────────► canonical @2 ────────► canonical @3
                           ▲                     │
                           │                     │
                    contradiction               │
                           │                     │
                           └────────────┐        │
                                        ▼        ▼
                                      evidence  ACTIVE
```

Every canonical claim should be traceable backward.

Avoid opaque knowledge that cannot be explained.

---

# 14. Provenance IDs

Extend schemas so durable objects can reference each other.

At minimum support identifiers for:

```text
event_id
candidate_id
canonical_id
canonical_version
source_pointer_id
promotion_event_id
failure_signature
remediation_id
```

Canonical documents SHOULD contain fields such as:

```yaml
---
id: enterprise.aws.lambda.networking
version: 3

promotion_event_id: promotion-82c...

evidence_event_ids:
  - event-7ec...
  - event-a61...

source_pointer_ids:
  - pointer-architecture-lambda-networking
  - pointer-reference-lambda

supersedes:
  - enterprise.aws.lambda.networking@2
---
```

Do not duplicate raw evidence into every canonical file unnecessarily.

Use references.

---

# 15. Promotion Events

Promotion must itself be an append-only event.

Example:

```json
{
  "kind": "knowledge_promotion",
  "event_id": "promotion-82c...",
  "canonical_id": "enterprise.aws.lambda.networking",
  "new_version": 3,
  "candidate_ids": [
    "candidate-..."
  ],
  "evidence_event_ids": [
    "event-7ec...",
    "event-a61..."
  ],
  "supersedes": [
    "enterprise.aws.lambda.networking@2"
  ],
  "decision": {
    "reason": "newer authoritative enterprise source",
    "authority_comparison": "equal",
    "freshness_comparison": "newer",
    "confidence": 0.97
  }
}
```

`kb explain` should use this event when explaining why a version became active.

---

# 16. Explain Confidence

Confidence must be explainable.

Do NOT output:

```text
confidence: 0.93
```

without being able to describe where it came from.

Confidence may incorporate factors such as:

```text
source authority
number of independent sources
freshness
validation status
contradictory evidence
scope fit
repeatability
```

If the implementation uses a deterministic confidence calculation, document it.

If confidence was assigned by a curator agent rather than calculated, store that fact.

Example:

```text
Confidence: 0.93

Basis:
+ authoritative enterprise source
+ validated reference implementation
+ two independent confirmations
- one older contradictory observation

Assignment:
curator-assessed
```

Never imply mathematical precision that does not exist.

---

# 17. Explain Retrieval Decisions

Add an optional debugging mode:

```bash
kb search "enterprise lambda networking" --explain
```

This should show why results ranked as they did.

Example:

```text
1. enterprise.aws.lambda.networking@3

ranking factors:
+ lexical match: strong
+ enterprise scope match
+ authoritative source
+ fresh
+ active canonical version
+ AWS/Lambda tags matched

final rank: 1
```

This helps diagnose bad retrieval behavior.

Do not expose a meaningless opaque score without ranking factors.

---

# 18. Explain Historical Decisions

Support:

```bash
kb explain enterprise.aws.lambda.networking --history
```

This should show:

```text
v1
created:
2025-09-02

why:
initial enterprise discovery


v2
created:
2026-01-14

why:
platform module changed

superseded:
v1


v3
created:
2026-08-20

why:
enterprise architecture guidance changed

superseded:
v2
```

Historical knowledge must remain auditable.

---

# 19. Explain Sources

Support:

```bash
kb explain enterprise.aws.lambda.networking --sources
```

Return the source chain without large document contents.

Example:

```text
AUTHORITATIVE SOURCES

1.
type: MCP
server: enterprise-architecture
locator: architecture://serverless/lambda/networking
last verified: 2026-08-20


REFERENCE IMPLEMENTATIONS

1.
repository: platform/reference-lambda
path: modules/networking
revision: abc123
last verified: 2026-08-18
```

Source pointers should be sufficient to efficiently revalidate knowledge.

---

# 20. Explain Conflicts

Support:

```bash
kb explain enterprise.aws.lambda.networking --conflicts
```

Show:

```text
ACTIVE CONFLICTS

none


RESOLVED CONFLICTS

event-122...
claim:
Lambda functions may use public network paths.

status:
superseded

reason:
source was an old reference implementation and conflicted with
newer authoritative architecture guidance.
```

Never hide contradictory evidence merely because a canonical answer was selected.

---

# 21. Explain Unknown Provenance

If provenance cannot be reconstructed, say so.

Example:

```text
PROVENANCE WARNING

This knowledge card references evidence that is unavailable.

Missing:
event-981...

Confidence has been degraded.

Recommended action:
revalidate against authoritative source.
```

Never fabricate missing lineage.

`kb doctor` should detect broken provenance references.

---

# 22. Explain as a Claude Workflow

Update the `recall` Skill so prompts such as:

```text
why do we believe X?

where did we learn X?

what is the source for X?

how did we arrive at X?

is X actually authoritative?

show me the evidence for X
```

cause Claude to:

```text
kb search X
    ↓
identify canonical knowledge
    ↓
kb explain <id>
    ↓
summarize provenance
```

Do not launch broad external research unless the user asks for revalidation or the evidence indicates the knowledge is stale/untrustworthy.

---

# 23. Optional Explicit Explain Skill

A dedicated Skill may also be created:

```text
~/.claude/skills/explain-knowledge/SKILL.md
```

with semantic triggers including:

```text
why do we believe
where did this come from
show provenance
show evidence
explain this knowledge
how was this learned
```

The Skill should use:

```bash
kb search
kb explain
```

only.

It should not modify knowledge.

It should be read-only.

---

# 24. CLI Amendment

The primary CLI must now support:

```bash
kb search "query"

kb search "query" --explain

kb inspect <id>

kb explain <id>

kb explain <id> --history

kb explain <id> --sources

kb explain <id> --conflicts

kb explain <id> --json

kb history <id>

kb candidates

kb promote <candidate>

kb reject <candidate>

kb failure record ...

kb failure resolve ...

kb preflight ...

kb rebuild

kb stats

kb doctor
```

`kb explain` is a core command, not a future enhancement.

---

# 25. Machine-Readable Explain Output

Support:

```bash
kb explain <id> --json
```

Define a versioned output schema.

Conceptually:

```json
{
  "schema_version": 1,
  "knowledge": {},
  "active_version": {},
  "promotion": {},
  "evidence": [],
  "sources": [],
  "supersession_chain": [],
  "conflicts": [],
  "revalidation": {},
  "warnings": []
}
```

This provides a stable interface for future agents and tooling.

---

# 26. Explainability Tests

Add tests for:

```text
canonical knowledge with one source

canonical knowledge with multiple sources

multi-version supersession

promotion event reconstruction

contradictory evidence

resolved contradiction

unresolved contradiction

missing evidence event

missing source pointer

stale knowledge

quarantined candidate

failure guard provenance

curator-assigned confidence

deterministically calculated confidence

JSON explain schema stability

search --explain ranking factors
```

A canonical card that cannot explain its provenance should trigger a health warning.

---

# 27. kb doctor Amendment

`kb doctor` must validate provenance integrity.

Check:

```text
canonical → promotion event

promotion → candidate

promotion → evidence events

evidence → source pointer

supersedes → existing canonical version

active version → exactly one valid active version

failure guard → remediation evidence

remediation → original failure signature
```

Report:

```text
healthy
warning
broken
```

for provenance chains.

---

# 28. Phase 1 Amendment

`kb explain` belongs in Phase 1.

Phase 1 acceptance now requires:

```bash
kb search
kb search --explain
kb inspect
kb explain
kb history
kb rebuild
kb doctor
```

The knowledge model should not be considered complete until provenance can be reconstructed.

Do not bolt explainability onto the schema afterward.

Design lineage into the schema from the beginning.

---

# 29. Replace Previous Hooks Phase

Remove the previous mandatory Hooks phase.

Replace it with:

## Phase 5 — Workflow Reliability Without Hooks

Improve adherence to the knowledge lifecycle using:

* concise global CLAUDE.md routing rules
* highly specific Skill descriptions
* semantic Skill invocation
* mandatory Researcher Agent workflow
* dynamic Skill context retrieval where supported
* explicit `kb preflight`
* explicit failure recording
* explicit remediation recording
* mandatory research learning pass
* persistent agent memory where available

Acceptance:

```text
research request
    ↓
research Skill invoked
    ↓
local search occurs
    ↓
existing knowledge influences research
    ↓
external search only fills gaps
    ↓
reusable learning is persisted
```

And:

```text
known research-tool failure
    ↓
researcher consults prior guidance
    ↓
known remediation applied
    ↓
previous mistake is avoided
```

No hooks may be required for either test.

---

# 30. Optional Future Integration Layer

Hooks may be supported later behind an OPTIONAL adapter:

```text
integrations/
└── claude-hooks/
```

The adapter may provide:

```text
automatic prompt prefetch
automatic tool preflight
automatic failure capture
automatic session-finalization assistance
```

But:

```text
core/
```

must contain no dependency on the hook adapter.

Architecture:

```text
                 ┌─────────────────────┐
                 │      kb core        │
                 │                     │
                 │ storage             │
                 │ search              │
                 │ explain             │
                 │ learning            │
                 │ failures            │
                 │ provenance          │
                 └─────────┬───────────┘
                           │
            ┌──────────────┴───────────────┐
            │                              │
            ▼                              ▼
   Claude Skills/Agents             Optional Hooks
      REQUIRED PATH                 OPTIONAL ADAPTER
```

Installation should default to:

```text
hooks disabled
```

unless the user explicitly enables them.

---

# 31. Researcher Memory Is a Cache, Not Authority

When user-scoped subagent memory is available, use it as:

```text
hot cache
navigation hints
recent discoveries
frequently used pointers
```

Do not make it authoritative.

The canonical knowledge database remains the durable source.

Architecture:

```text
Researcher MEMORY.md
        │
        │ "look here"
        ▼
Canonical KB
        │
        │ evidence
        ▼
Ledger / Sources
```

If Claude Code auto-memory is disabled by enterprise policy, the harness must continue functioning.

The researcher simply loses the hot cache.

`kb` remains the durable cross-project memory system.

---

# 32. Degraded Capability Matrix

Document the expected behavior:

| Capability                                 | Hooks | No Hooks |
| ------------------------------------------ | ----- | -------- |
| Cross-project knowledge                    | Yes   | Yes      |
| Semantic research invocation               | Yes   | Yes      |
| Local-first research                       | Yes   | Yes      |
| MCP research                               | Yes   | Yes      |
| Canonical knowledge                        | Yes   | Yes      |
| Append-only ledger                         | Yes   | Yes      |
| Source pointers                            | Yes   | Yes      |
| `kb explain`                               | Yes   | Yes      |
| Freshness                                  | Yes   | Yes      |
| Contradiction detection                    | Yes   | Yes      |
| Research learning pass                     | Yes   | Yes      |
| Failure learning inside governed workflows | Yes   | Yes      |
| Tool preflight inside governed workflows   | Yes   | Yes      |
| Intercept every arbitrary tool invocation  | Yes   | No       |
| Deterministic automatic failure capture    | Yes   | No       |
| Security enforcement                       | No    | No       |

The absence of hooks should primarily remove transparent lifecycle automation.

It must not remove the knowledge architecture.

---

# 33. Revised Definition of Done

The initial implementation is complete when:

* no Claude Code hook is required
* the harness installs safely
* existing Claude configuration is preserved
* research can be semantically or explicitly invoked
* local accumulated knowledge is searched before broad enterprise research
* source pointers can shortcut repeated discovery
* research produces reusable learning
* learning enters an append-only ledger
* canonical knowledge is versioned
* canonical knowledge has traceable provenance
* `kb explain` can reconstruct why active knowledge exists
* `kb explain` can identify its evidence
* `kb explain` can show supersession history
* `kb explain` can expose contradictory evidence
* freshness is modeled
* failure/remediation pairs are persisted
* governed research workflows can consult failure guidance before external operations
* solved failures can become reusable failure guards
* unsafe retrieved content is not blindly promoted
* sensitive information is not intentionally persisted
* project-specific context remains project-specific
* the core system works when Claude Code auto-memory is unavailable
* the core system works when all user/project hooks are unavailable
* tests pass
* architecture and limitations are documented

The optimization goal remains:

> Every substantive research effort should make the next related research or implementation effort cheaper, faster, more precise, and more explainable without reducing correctness or trust.

The trust goal is:

> For every important piece of accumulated knowledge, the harness should be able to answer: "Why do we believe this, where did it come from, what superseded what, and when should we check it again?"

### What I would actually deploy in your environment

I think the **hookless version is preferable as v1** even if you later discover hooks work.

The crucial loop becomes:

```text
                  ~/.claude/CLAUDE.md
                         │
                "research → use skill"
                         │
                         ▼
              ~/.claude/skills/research
                         │
                   context: fork
                         │
                         ▼
             ~/.claude/agents/researcher
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
   kb search        kb preflight      MCP servers
        │                                  │
        └────────────────┬─────────────────┘
                         ▼
                     research
                         │
                 ┌───────┴────────┐
                 ▼                ▼
           kb learn         kb failure ...
                 │                │
                 └───────┬────────┘
                         ▼
                    ledger / KB
                         │
                         ▼
                   kb explain
```

There are two particularly useful properties here.

First, **automatic semantic routing does not require hooks**. Personal Skills live at `~/.claude/skills/...`, apply across all projects, and Claude uses the Skill `description`/`when_to_use` metadata to decide when to apply them. ([Claude][2]) So your global instructions can say "architecture/research/enterprise-standard questions use the research workflow," while the detailed 50-line procedure stays in the Skill instead of bloating `CLAUDE.md`.

Second, Claude Code Skills support command-based dynamic context injection. That means when `/research` runs, the Skill itself can execute a local `kb search` and inject those results before the research process proceeds—no `UserPromptSubmit` hook needed. ([Claude][2])

### One caveat I'd design around

I would **not rely on `memory: user` for correctness**. Claude Code currently supports it and puts user-scoped subagent memory under `~/.claude/agent-memory/<agent>/`, but Anthropic documents that the feature disappears if enterprise policy disables auto-memory. ([Claude][4])

So:

```text
agent memory = L1 cache
kb canonical store = durable database
enterprise MCP = authoritative backing source
```

That's a much stronger architecture anyway.

Your accumulated enterprise knowledge then survives whether Anthropic changes auto-memory behavior, your employer disables it, you switch models, or the Researcher agent is recreated.

And `kb explain` is what turns that accumulated store from "AI memory" into something much closer to an **auditable personal enterprise knowledge graph**.

[1]: https://code.claude.com/docs/en/settings "Claude Code settings - Claude Code Docs"
[2]: https://code.claude.com/docs/en/skills "Extend Claude with skills - Claude Code Docs"
[3]: https://claude.com/blog/subagents-in-claude-code?prog_id=13&utm_source=chatgpt.com "How and when to use subagents in Claude Code | Claude by Anthropic"
[4]: https://code.claude.com/docs/en/sub-agents "Create custom subagents - Claude Code Docs"
