# specops Architecture Decision Records

Nov 4, 2026 · @Dav

## How to read this record set

Eleven decisions define specops: a composable agent orchestration kernel built from deterministic gates, scheduled by a LangGraph graph in the cloud, with every interaction routed through an authenticated, entitled CLI on the user's machine. Each record states its context, the options weighed, the decision, and the consequences the team accepts. The companion Technical Design Document carries the diagrams, contracts, and delivery plan.

**Sources evaluated**

| Source | Date | What it contributed |
| --- | --- | --- |
| specops Platform white paper (Ryan Gibbons, Exponential Edge) | 27 Oct 2026, updated 3 Nov | Platform-as-broker boundary, 12-gate first-release pack, AWS topology, identity model, ledger, failure handling, open decisions |
| specops Composable Gate Orchestration addendum | 3 Nov 2026, updated 4 Nov | Gate as unit of composition, closed gate kinds, rework-only backward edges, session supervision clocks, CLI as pure I/O path, architecture options 12.1 to 12.3 |
| Session notes on enterprise-managed CLI binaries and context engineering | undated | Runtime adapter interface, three agent outcomes, Engineering Context Resolver, repository intelligence index, evidence ledger fields |
| Goal statement (this session) | 4 Nov 2026 | Business Case 1 (PDLC+SDLC from `specops start my-intent.md`), no sub-agent telephony, CLI performs templating and basic evals, free and open-source first with all AWS services available |

**Conflicts resolved in these records**

| Conflict | Where it appears | Resolution |
| --- | --- | --- |
| Session notes place the runtime adapter, subprocess supervisor, and heartbeat in the kernel; the white paper forbids the platform from hosting agent sessions | Notes section 2 versus white paper 5.1 | Those components live in the CLI (ADR-002, ADR-008). The platform's kernel keeps scheduling, ledger, evidence, and model routing for platform gates only. |
| Goal statement says the CLI performs basic evals on structured returns; the addendum says the CLI makes no gate decisions | Goal statement versus addendum section 1 | The CLI runs pre-flight schema checks and local evals and records them as evidence; the platform's result acceptance is the only authoritative decision (ADR-005). |
| Session notes propose GoRules beside OPA; the white paper uses OPA and CEL only | Notes sections 1 and 5 versus white paper 17 | OPA/Rego for policy gates and CEL for edge conditions; GoRules is not adopted (ADR-006, ADR-012). |
| Session notes describe `COMPLETED`, `INPUT_REQUIRED`, `APPROVAL_REQUIRED` outcomes; the contracts define `passed`, `failed`, `blocked`, `needs_human`, `cancelled` | Notes section 3 versus addendum 5.5 | The three outcomes map onto the existing `GateResult` statuses with a typed decision request payload (ADR-011). |
| Session notes call the workflow a DAG; the addendum allows declared rework edges | Notes section 5 versus addendum 4.1 | Graphs are forward-only plus declared, bounded rework edges; validation proves termination (ADR-003). |

**Status legend.** *Accepted* means the decision is adopted for the pilot. *Proposed* means this record extends the source documents and needs reviewer confirmation. *Deferred* means the decision is recorded so it is not re-litigated but is not needed for the pilot.

## ADR-001 The platform is a broker with a LangGraph kernel

**Status:** Accepted (white paper section 1, addendum section 12.3).

**Context.** Agent-assisted delivery begins in one person's terminal, and local state cannot be continued from another machine, does not say who owns the next action, and tells the rest of the team nothing. Once a graph mixes work on developer machines with calls to managed systems and human decisions, one component must decide which gates are ready, issue work, accept typed outcomes, mark stale evidence, and record why the graph advanced. Three boundaries were considered.

**Options.**

| Option | Description | Why rejected or chosen |
| --- | --- | --- |
| Record-only platform | The CLI loads Gate Packs, computes the ready set, runs every gate, uploads checkpoints | Rejected. A modified or disconnected CLI remains the effective authority; no shared scheduling; no platform gates for GAIP or regulatory evaluation. |
| Central execution platform | The platform schedules the graph, hosts models and agent sessions, calls GAIP, holds all execution credentials | Rejected. Produces an orchestration monolith, widens the credential boundary, moves repository-sensitive agent work out of the managed developer sandbox, duplicates existing systems. |
| Broker with a LangGraph kernel | The platform owns graph coordination, authorization, leases, the job ledger, and calls to managed systems; agent work stays local; the CLI carries assignments and results | Chosen. Smallest architecture that gives shared scheduling, one audit record, and deterministic platform gates without hosting models. |

**Decision.** The platform runs the open-source LangGraph Python library inside a Python service on Amazon ECS on Fargate. Each Gate Pack version compiles to a `StateGraph`; a run is one LangGraph thread pinned to one compiled version. The platform is mostly a message broker: it publishes `GateAssignment` records for agent gates, pauses on `interrupt()` for agent and human gates, calls managed systems directly for platform gates, and records every step in the ledger. It is the only component that calls GAIP. It never hosts models or agent sessions. LangGraph Platform and LangGraph Server are not used.

**Consequences.**

- The kernel is reusable across Gate Packs, projects, and agent runtimes because it depends only on the node execution contract, not on any agent SDK.
- Pausing costs no compute: a paused job is stored rows in Aurora, and a job can wait days for a reviewer.
- The platform's delivery-system access is read-only, so a compromised platform cannot push source, change Jira, start Jenkins, or deploy.
- LangGraph is a young library; the custom ledger checkpointer isolates the ledger format from checkpointer interface changes, and contract tests run against each LangGraph upgrade before it ships.

## ADR-002 Agent work runs locally as isolated, headless, goal-bounded runs; the CLI is the I/O path

**Status:** Accepted (white paper 5.1 and 12.1, addendum sections 8 to 10). The placement of the runtime adapter and session supervisor in the CLI rather than the kernel is a reconciliation of the session notes with the white paper.

**Context.** The repository checkout, the managed developer sandbox, and the developer's approved local agent tool (Claude Code or Codex) already exist on the user's machine with their own model access and controls. Sub-agent collaboration inside those tools returns prose, not a machine contract, and conversation history leaking between steps makes replay and audit unreliable. The session notes proposed that the kernel own a subprocess supervisor and SDK adapter; that would require the platform to host agent sessions, which ADR-001 forbids.

**Options.**

| Option | Why rejected or chosen |
| --- | --- |
| Platform-hosted agent sessions with SDK adapters in the kernel | Rejected. Violates ADR-001; moves source and credentials into the platform; duplicates the managed sandbox. |
| Long-lived local agent conversation that spans gates | Rejected. Downstream gates inherit unneeded context; transcripts become the de facto handoff; replay is impossible. |
| Parent agent spawning sub-agents per gate | Rejected. Child prose is summarized by the parent, so the gate result is a translation, not a contract. |
| One fresh, headless, top-level agent run per gate attempt, started by the CLI from an immutable `GateAssignment`, returning a schema-valid `GateResult` | Chosen. |

**Decision.** Every agent gate attempt receives one fresh agent session, one small goal, one immutable assignment, one immutable context manifest, one custom agent profile, one sandbox and capability profile, one starting source digest, one set of allowed paths and commands, one output schema, and one attempt budget. Conversation history never flows between gates; a retry or rework attempt starts a new session and receives the earlier failure or rejection as typed input. The CLI claims the lease, creates an isolated Git worktree, materializes context, starts the local agent tool through a runtime adapter (ADR-008), supervises the session with three clocks (lease, activity timeout, absolute deadline), runs outbound DLP and prompt-injection filtering, validates the structured result, and submits it with evidence and telemetry. The CLI never calls GAIP. Native sub-agent output is advisory only; if a child submits, it submits its own `GateResult` directly through the CLI.

**Consequences.**

- Every attempt is replayable from its assignment, manifest, and evidence; nothing depends on an unrecorded transcript.
- Durable knowledge moves only through validated artifacts, findings, decisions, and evidence (stable references, not transcripts), which keeps downstream context small.
- The CLI becomes a signed, versioned binary with a minimum supported version, and session supervision, adapters, and filters must be tested on the developer platform matrix.
- The platform cannot observe model reasoning; it observes normalized progress events, heartbeats generated from observable session activity, and the terminal result.

## ADR-003 Gates are the unit of composition; Gate Packs compile to a forward-only StateGraph with declared rework edges

**Status:** Accepted (addendum sections 3.1, 4.1, 4.3, 5.1).

**Context.** Teams need to compose delivery workflows without specops becoming a general-purpose workflow platform or a remote code execution service. The session notes described the workflow as a DAG; the addendum allows a reviewer to send work back to an earlier gate. Both must hold: every graph must provably terminate, and rework must be a recorded, bounded path, not an ad hoc loop.

**Options.**

| Option | Why rejected or chosen |
| --- | --- |
| General workflow language with arbitrary nodes and server-side code | Rejected. Open plugin surface, unbounded trust, duplicates existing tooling. |
| Strict DAG with retries modelled as new workflow executions | Rejected. A rejection that requires a new run loses the job identity and the ledger continuity reviewers need. |
| Closed set of gate kinds; Gate Packs compose approved gates; forward-only edges plus declared rework edges as the only backward edges; bounded by `max_attempts` and `max_rework_cycles` | Chosen. |

**Decision.** A gate is one small, self-contained evaluation or unit of work with bounded inputs, a declared kind and location, a versioned result contract, required evidence, and deterministic outcome handling. Gate kinds are a closed registry: `agent`, `tool`, `decision_classifier`, `opa_policy`, `ofac_screening`, `eval`, `human`, `aggregate`. Locations are `agent` (developer machine), `platform`, or `human`. Every gate receives the same `GateAssignment` and returns the same `GateResult`. A Gate Pack is versioned, content-addressed, owned by a scope, and pinned by digest when a run begins. Pack validation before use checks unique identifiers, forward-only edges with declared rework paths as the only backward edges, known kinds and locations, compatible schema versions, reachable terminal outcomes, bounded retries and rework, size and budget limits, role and separation-of-duty requirements, evidence freshness rules, CEL conditions that type-check, no skip condition on `skippable: false`, and no product-team change to a default gate. Retry creates a new attempt inside a gate instance; rework creates a new gate instance (`specification@2`); earlier instances stay unchanged in history.

**Consequences.**

- Termination is checked when the pack is compiled, so no run can loop indefinitely.
- Teams compose real workflows declaratively; registering a new gate kind or managed-system integration is an administrative platform task with its own review and lifecycle.
- Rework is first-class and visible in the timeline, with each downstream gate whose inputs changed re-run as a new instance.
- Business Case 1 adds an `intent` agent gate ahead of the white paper's intent review so that `specops start my-intent.md` turns an unstructured blob into a structured Intent contract; this is a Proposed extension of the 12-gate pack to 13 gates.

## ADR-004 One append-only, hash-chained job ledger is the LangGraph checkpointer

**Status:** Accepted (white paper 5.5, 10.1, 13.2; addendum section 11).

**Context.** Enterprise audit requires one authoritative record per job that explains every advance, decision, retry, invalidation, and external receipt, survives any client exiting, and cannot be edited after the fact. LangGraph needs a checkpointer to pause and resume threads. Keeping those two stores separate would create a second source of truth that could drift.

**Options.**

| Option | Why rejected or chosen |
| --- | --- |
| LangGraph's stock Postgres checkpointer plus a separate audit log | Rejected. Two stores; the checkpointer's tables are mutable and not hash-chained. |
| Per-user local ledgers reconciled later | Rejected. Reconciliation conflicts; no shared authority. |
| Custom LangGraph checkpointer that writes every checkpoint and pending write as a hash-chained ledger event in Aurora PostgreSQL in the same transaction | Chosen. |

**Decision.** The ledger is an append-only table of hash-chained events in Aurora PostgreSQL Serverless v2. Each event records a run sequence number with no gaps, the previous event hash and its own hash, actor type and stable identity, timestamp and correlation identifiers, gate instance and attempt, action, subject, result, authorization and policy decision references, related lease, evidence, or external receipt, and a reason safe to display. The database role that writes the ledger has no `UPDATE` or `DELETE` rights. Corrections are new events referring to earlier ones. The job's current state is a projection rebuilt from its events; the search index and state projections are rebuildable from the ledger. Result acceptance is one database transaction: validate caller and contract, authorize, check idempotency key, lease, attempt, and subject, validate output schema and evidence, append events, add outbox entries, commit, return `202 Accepted` with a receipt. A trusted service periodically signs the latest position in each chain; sealed JSONL segments are exported to S3 under Object Lock as an archive copy that the platform never reads back to decide anything.

**Consequences.**

- A restarted platform task resumes every thread from its last committed checkpoint with no lost state.
- An agent's claim that work completed is distinguishable from the kernel's verified evidence that completion criteria were met, because the gate executor's evidence reference, not the agent's `tests_passed: true`, is what the ledger records.
- Cross-gate handoffs pass stable artifact references, which makes replay cheap and keeps transcripts out of the record.
- Ledger events and sealed segments are retained 2 years; a longer enterprise retention policy takes precedence.

## ADR-005 Strict JSON contracts; the CLI pre-validates and evaluates, the platform's acceptance is authoritative

**Status:** Accepted (addendum section 7, white paper 14), with the CLI's local eval role Proposed as a reconciliation of the goal statement with addendum section 1.

**Context.** The goal statement asks the CLI to ingest platform schemas, perform templating, run basic evals on structured returns, and submit session data, timing, and evidence. The addendum says the CLI makes no gate decisions and holds no gate logic. Both are satisfied if local checks are treated as pre-flight that produces evidence, with the decision left to the platform.

**Decision.** Contracts are JSON Schema 2020-12 documents kept in Git with generated TypeScript and Pydantic types and one shared failure taxonomy; digests use JSON Canonicalization Scheme (RFC 8785). Independently versioned schemas exist for at least `GateDefinition/v1`, `GatePack/v1`, `GateAssignment/v1`, `GateResult/v1`, `LedgerEvent/v1`, `ContextManifest/v1`, `DecisionRequest/v1`, and the CLI command envelope. The CLI downloads the schema bundle pinned by the Gate Pack digest, renders the assignment into the agent's prompt template, and after the session: validates the agent's structured output against the output schema, runs the gate's declared local evals (for example, diff touches only allowed paths, required files present, unit tests invoked and their report captured), and records each eval's result as evidence. A schema failure or failed local eval produces a `failed` `GateResult` with structured failures; the CLI never silently repairs output. The platform re-validates the contract, re-checks evidence digests, and runs any platform-side eval gate independently. Only the platform's `202 Accepted` moves the graph. Machine-oriented CLI behavior: input from file or standard input, non-streaming stdout holds exactly one JSON document, streaming stdout holds only schema-valid NDJSON events, diagnostics go to stderr, unknown fields are rejected, extensions live in a namespaced `extensions` object, state-changing requests carry idempotency keys, and each exit code maps to one group of the failure taxonomy.

**Consequences.**

- Fast feedback on the developer's machine without giving the client authority: a tampered CLI can only waste its own attempt.
- Local eval results are evidence the platform may trust only after confirming their subjects and digests; a platform eval gate remains the deterministic decision for anything that gates promotion.
- Every contract change is a versioned schema change with compatibility rules checked at pack validation.

## ADR-006 OPA/Rego for policy gates and request authorization; CEL for edge conditions; no second rules engine

**Status:** Accepted (white paper 10.2, 10.3, 17; addendum 4.4). Rejection of GoRules is Proposed.

**Context.** Deterministic gates need a policy language for "does this work satisfy the team's or enterprise's rules" and a routing language for "which edge does the graph take given accepted results and classifier labels". The session notes added GoRules beside OPA. Each additional engine adds a bundle format, an audit story, a versioning story, and a reviewer skill set.

**Decision.** Open Policy Agent evaluates Rego policies for two separate purposes that share one engine: request authorization (who may read or act on this job now) and `opa_policy` gates (does the work satisfy a policy bundle referenced by the gate definition or served by an OPA service inside the platform). Edge and activation conditions are written in CEL, a side-effect-free expression language that reads only accepted results, job metadata, classifier labels, and pinned pack values; CEL conditions type-check at pack validation, so the same inputs always produce the same routing. OPA and OFAC remain separate gate kinds with separate evidence; the OFAC gate calls GAIP for screening and the platform keeps no copy of sanctions lists. GoRules is not adopted: a decision-table need is expressed as a Rego rule with data, and if a tabular authoring surface is later required it becomes a compile-to-Rego front end, not a second runtime. Both OPA and CEL are Apache 2.0.

**Consequences.**

- One policy engine, one bundle lifecycle, one policy-version field on every decision event.
- Policy versions are recorded on each gate attempt and authorization event, so an audit can re-evaluate a decision against the exact policy that applied.
- Rego authoring is a product-team skill for custom gates; the platform manager team owns default bundles.

## ADR-007 Context is delivered by typed manifests resolved by an Engineering Context Resolver, split between platform and CLI

**Status:** Proposed (extends addendum 6.2 and white paper 12.2 with the resolver and repository index from the session notes).

**Context.** Need-to-know context injection is a stated goal. A software factory needs more than "which documentation applies": it needs the exact combination of architecture, repository evidence, nonfunctional requirements, engineering standards, and prior approved decisions that one gate attempt must see, with everything else excluded. The platform holds no repository contents and has read-only access to GitHub, so code-level resolution cannot run in the cloud.

**Options.**

| Option | Why rejected or chosen |
| --- | --- |
| Embedding retrieval over all documentation as the primary selector | Rejected. Mandatory standards (security, NFRs) cannot depend on similarity scores. |
| A second LLM-driven context orchestration graph | Rejected. Adds a model in the control path of what the agent may see; not testable. |
| Platform resolves a typed manifest of references and budgets; the CLI materializes it locally from a Git-SHA-versioned repository intelligence index; the agent may request more only from a scoped catalog | Chosen. |

**Decision.** Context is assembled from a typed `ContextManifest`, never copied into an unstructured prompt. The manifest is immutable per attempt and has its own digest. Four classes of engineering context are resolved: project architecture (C4 references, ADRs, service boundaries, interfaces) by project and component identity; codebase intelligence (repository map, symbols, imports, call paths, test-to-code relationships) by Git SHA plus affected files and symbols with a bounded dependency closure; nonfunctional requirements by deterministic applicability rules on component scope; delivery state (approved intent and specification digests, prior findings relevant to the current retry or rework, selected evidence) from upstream ledger artifacts. Mandatory material is selected deterministically; semantic retrieval may only supplement. The platform's resolver produces the reference set, applicable rule identifiers, allowed repository paths, context template version, and size and token budgets. The CLI's resolver materializes those references in the worktree, building a repository intelligence index with Tree-sitter (and language-server metadata where available) outside the model path, cached per Git SHA. Progressive disclosure is a local command, `specops context list` and `specops context get <ref>`, which serves only resources inside the attempt's permitted scope; existing OKF and llm-wiki frontmatter is consumed as a metadata index, not as the selector. Repository files, tickets, logs, and earlier model output are data: their contents cannot add capabilities, change policy, choose a different gate, or widen the assignment.

**Consequences.**

- The context package for every attempt is reproducible from its manifest digest and Git SHA, which makes a replayed attempt comparable to the original.
- Scope control applies to context delivered through the broker; need-to-know as a security requirement must also be enforced by filesystem and process isolation in the managed sandbox.
- The resolver is a pure, testable service with no model in its path; context quality improves by adding indexes and rules, not by prompt tuning.

## ADR-008 Runtime adapters in the CLI for Claude Code and Codex, with direct subprocess execution as a supported fallback

**Status:** Accepted (white paper 17 "Local agent access"; session notes section 2), with the adapter living in the CLI per ADR-002.

**Context.** The enterprise distributes pinned, managed Claude Code and Codex binaries with their own authentication, Bedrock-backed provider configuration, and entitlement rules. The vendor SDKs default to bundled runtimes, so the approved binary must be selected explicitly, and a vendor SDK and an enterprise-pinned binary can drift out of compatibility. Both tools expose streaming JSON events (Claude Code `stream-json`; Codex `exec --json` and its app-server protocol), interactive permission callbacks, and user-input requests.

**Decision.** The CLI defines one runtime adapter interface with explicit capability negotiation: `start(assignment, manifest, profile)`, a normalized event stream, `cancel()`, and a terminal `GateResult` extraction. Two adapters are built: a Claude Code adapter that uses the Claude Agent SDK with `cli_path` pointing at the managed binary, and a Codex adapter that uses the Codex SDK with `codex_bin` pointing at the managed binary. A third adapter runs the managed binary as a direct subprocess and parses its JSON event stream; it is the escape hatch when an SDK and the pinned binary disagree. Adapters never own authentication or model selection; the managed binary keeps its enterprise configuration and AWS credentials, and the `GateResult` records the model the tool reports. The CLI normalizes provider events into a bounded set (session started, model stream activity, tool started/progress/completed, file change observed, agent checkpoint, heartbeat, warning, cancellation requested, result submitted, timeout or interruption, session completed) and generates heartbeats from observable activity, never from model text. Runtime permission and user-input callbacks are surfaced to the person at the terminal for execution-time requests only; anything that must outlive the session becomes a durable decision through the platform (ADR-011). Each attempt records the CLI version, custom agent profile, adapter, binary path and version, model reported, sandbox and capability profile, and provider session and turn identifiers.

**Consequences.**

- Claude Code and Codex are interchangeable execution providers for agent gates; a Gate Pack never names a vendor.
- Adapter compatibility is tested against each approved binary version before the CLI's minimum supported version advances.
- If an unattended session cannot hold a pending interaction, the CLI terminates it cleanly, preserves the worktree and evidence, and a fresh invocation starts after the decision.

## ADR-009 Signed in-toto evidence in S3 Object Lock; transactional outbox feeding EventBridge and SQS

**Status:** Accepted (white paper 13.1, 13.3, 17; addendum 11.4).

**Context.** Evidence must name the exact subject it covers (a Jenkins result for commit A does not satisfy a gate for commit B), be tamper-evident, be retained for 2 years, and be authorized independently of the ledger. Every platform interaction must publish an event so notifications, search, and archive export follow the work without polling, and an event must exist if and only if the change committed.

**Decision.** Each piece of evidence is an in-toto statement wrapped in a DSSE envelope and signed by the platform with a KMS key. A statement records evidence type and schema version, producer identity and method, job, run, gate instance and attempt, subject type, identifier and digest, result and reason, creation and observation times, source-system identifiers, policy and client version, and the model used. Aurora stores evidence metadata; S3 with KMS encryption, versioning, access logging, lifecycle rules, and Object Lock in compliance mode (2-year retention) stores signed bodies, specifications, check reports, and bounded agent output. The CLI uploads evidence directly to S3 with presigned URLs (placeholder decision pending confirmation of presigned URL support). When a subject changes, dependent results are marked stale and never deleted. Events are written to a transactional outbox in Aurora in the same transaction as the ledger event; an outbox publisher sends them to an Amazon EventBridge custom bus; content-based rules route each event to one SQS queue per consumer, each with a dead-letter queue: the kernel worker's resume queue, notifications, search indexing, archive export, live updates served to the CLI and web view as server-sent events, and approved external subscribers. EventBridge archive allows replay; EventBridge Scheduler runs lease expiry, blocked-gate deadlines, and the OFAC list refresh. SNS was not chosen because event volume is modest and EventBridge's content-based rules, cross-account delivery, and archive matter more than throughput.

**Consequences.**

- Idempotent consumers use the ledger sequence number to ignore duplicates and out-of-order delivery.
- An outbox that cannot reach EventBridge holds its events until it can; nothing is lost on a publisher outage.
- A later move of evidence storage behind an enterprise interface such as Raptor must preserve identifiers, digests, signatures, access rules, and history; it is not a first-release dependency.

## ADR-010 Ping OAuth identity, Entra entitlements, OPA authorization, leases on gate attempts, separation of duty

**Status:** Accepted (white paper sections 6, 9, 16).

**Context.** Many teams share one platform. Knowing a job, assignment, or lease identifier must grant nothing. Two people must not do the same gate attempt at once, a disconnected client must not block a job, and the author of a change must not approve it.

**Decision.** The CLI signs in with OAuth 2.0 Authorization Code with PKCE through Ping, opening the browser and receiving the redirect on a loopback address; device authorization is used only if the approved Ping configuration supports it; the public client holds no secret. The web view uses Ping through OpenID Connect. The API validates issuer, audience, signature, expiry, and scopes and keys users by Ping's stable subject identifier. Entitlements come from All Access groups supplied through Microsoft Entra ID on every request; the platform keeps no membership copy. OPA evaluates every read and action with the caller's subject and groups, the requested action, job, repository and team scope, the current gate and role it needs, the current lease holder, the caller's relationship to the work, separation-of-duty rules, and the policy version. Not-found is returned identically for missing and unauthorized resources. A lease is a time-limited claim by one user on one gate attempt, taken as a conditional insert in Aurora, renewed by the CLI while it works, released on completion, and expired by the platform; a result is accepted only from the current lease holder for the current attempt and subject. Human decisions bind the authenticated person to the exact subject digest reviewed; repository policy may require specific roles and forbid the author from approving. Internal AWS calls use IAM task roles; platform gates call managed systems with narrowly scoped, read-only machine credentials (a GitHub App, Jira and Jenkins service accounts); the CLI performs delivery actions under the user's identity or an approved delegated flow and never places credentials in prompts, repository files, event payloads, or evidence.

**Consequences.**

- Authorization is evaluated by the same engine as policy gates but is a separate decision with its own events.
- Queues only signal that work exists; the lease in Aurora decides ownership, so SQS redelivery cannot cause double work.
- Whether DXGW also validates tokens, DXGW's support for server-sent events, and which role may override a blocked gate remain open (ADR-012).

## ADR-011 Agent nodes have bounded outcomes; interactions that outlive a session become durable decisions through an interaction broker

**Status:** Proposed (reconciles session notes section 3 with addendum 5.4 to 5.6 and white paper 10.4, 10.5).

**Context.** An agent will sometimes discover that it cannot complete its goal within its assignment: a feature needs a schema change the approved architecture forbids, or an ambiguity in the specification needs a product decision. Allowing arbitrary conversational interaction from agents as a normal pattern would reintroduce unbounded sessions. The local tools' permission and user-input callbacks are runtime features, not durable workflow approvals.

**Decision.** An agent gate attempt ends in exactly one `GateResult` status: `passed`, `failed`, `blocked`, `needs_human`, or `cancelled`. The session notes' outcomes map as follows.

| Agent outcome | `GateResult` status | Kernel behavior |
| --- | --- | --- |
| `COMPLETED` with output valid | `passed` | Validate output and evidence, advance along the CEL edge |
| `COMPLETED` with output invalid or local eval failed | `failed` | Retry within `max_attempts`, then route to the human gate declared for exhaustion |
| `INPUT_REQUIRED` | `needs_human` with a `DecisionRequest` payload (reason, question, evidence references, proposed options) | Persist the request, suspend the node, route to the configured human gate or the eligible decider queue |
| `APPROVAL_REQUIRED` | `needs_human` with a `DecisionRequest` of kind `approval` | Evaluate pack policy; route to an existing approval gate when one is declared, else to an authorized approver; the decision is a typed, separation-of-duty-checked ledger event |
| Dependency unavailable | `blocked` | Hold the attempt, schedule the deadline, route to a human gate after it |

A transient error, timeout, or failed output schema has its own explicit execution failure state and never masquerades as `needs_human`. The interaction broker is the part of the kernel that converts runtime permission requests and workflow approval requirements into durable, authorized decisions: execution-time requests stay at the terminal with the person holding the lease; anything that must survive the session is written to the ledger as a `DecisionRequest`, the node interrupts, and the decision resumes the graph. After a decision, the kernel issues a fresh assignment carrying the decision as typed input; it never attempts to serialize a running CLI invocation mid-command.

**Consequences.**

- A review agent can provide findings, but it never decides that work passes an OPA, OFAC, test, or eval gate; the gate evaluator owns that decision.
- Human decisions, including those triggered by an agent's question, are bound to the exact subject and recorded with reason codes, so the "why" of every rework is searchable.
- Packs that never declare a human gate for `needs_human` fail validation.

## ADR-012 Decisions deliberately not taken, and open decisions carried forward

**Status:** Accepted for the "not taken" list; the open list needs owners and due dates before the related integration enters the pilot.

**Deliberately not taken for the pilot.** Recording these prevents re-litigation.

| Not taken | Reason |
| --- | --- |
| General-purpose workflow language or open plugin marketplace | Composition of approved gates covers the need; arbitrary server-side code would make specops a remote execution service. |
| Hosted models or agent sessions in the platform; calls from the CLI to GAIP | ADR-001 and ADR-002. |
| LangGraph Platform or LangGraph Server | Open-source library inside the platform service is sufficient and keeps the ledger as the only checkpoint store. |
| GoRules or a second rules engine | ADR-006. |
| A separate LLM-based context router or context orchestration graph | ADR-007; the resolver is a pure service. |
| Embeddings as the primary selector for mandatory context | ADR-007. |
| SNS as the event fan-out | ADR-009; EventBridge rules and archive matter more than throughput here. |
| CloudFront in front of the web app | Internal ALB behind DXGW with WAF suffices for an internal tool. |
| A universal regulatory framework, replacement deployment system, or production release automation | Out of pilot scope; later Gate Packs can coordinate promotion, deployment, rollback, and observation without owning those systems. |
| Every possible model or tool adapter | Two adapters plus a subprocess fallback (ADR-008). |

**Open decisions carried forward.** Each needs an owner, a due date, and a recorded outcome.

| # | Decision | Blocks |
| --- | --- | --- |
| 1 | Trial teams, repositories, Jira projects, and Jenkins jobs | Pilot start |
| 2 | Ping client registrations and the approved CLI login flow, including device authorization support | 19.2 identity stage |
| 3 | Separation-of-duty rules for intent, specification, source, and release decisions | 19.3 human gates |
| 4 | Lease length, renewal interval, human decision due dates, blocked-gate deadlines, escalation ownership | 19.2 leases |
| 5 | Classifier labels, CEL conditions, and the review sample for skipped gates | 19.3 routing |
| 6 | OFAC matching rules (exact, fuzzy, both, thresholds) and freshness of GAIP's list data | 19.3 OFAC gate |
| 7 | Initial model profiles, GAIP mappings, GAIP's real request API, and how GAIP authenticates AWS workloads and which IP ranges it uses | 19.3 GAIP gates |
| 8 | The enterprise service behind the DLP placeholder, data classifications, and DLP rules | 19.3 DLP |
| 9 | Whether the OpenAI decisions API on Bedrock is available as a Jev fallback | Risk mitigation |
| 10 | DXGW support for server-sent events, timeouts, token validation, request size limits, rate limits, onboarding | 19.4 web view, CLI live updates |
| 11 | Exact permissions of the GitHub App and the Jira and Jenkins service accounts | 19.5 |
| 12 | Approved CLI distribution, signing, update, and minimum-version process | 19.2 |
| 13 | OpenSearch domain ownership and access design | 19.6 |
| 14 | Disaster recovery objectives and support hours | Production support decision |
| 15 | Presigned S3 upload support for evidence | 19.6 |
| 16 | Who may author, approve, publish, and deprecate Gate Packs; who approves override of a blocked gate | 19.3 |
| 17 | Which context sources and selectors are allowed per gate kind | ADR-007 implementation |
| 18 | Which gates may finish while the CLI is offline | 15 offline behavior |
| 19 | How active runs adopt or reject newer Gate Pack and policy versions | 19.1 |
| 20 | The point at which Raptor should be evaluated for evidence storage | Post-pilot |
