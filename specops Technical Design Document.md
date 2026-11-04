# specops Technical Design Document

Nov 4, 2026 · @Dav

## 1. Summary

specops is an agent orchestration harness in which every gate is a deterministic check hosted in the platform, not on a user's machine. One job's data flow is centralized, people on different machines act on the same job, and a deviation is caught at the gate where it happens.

**The problem it fixes.**Any agentic loop that runs end to end with no deterministic validation between its steps hides its own failures; it never comes up for air. Spec-driven development is the first worked example: one person runs intent, specification, plan, implementation, and verification as one loop, whether inside a single agent session or across sub-agents with fresh context, and each step hands off to the next on the agent's own say-so. Deviations from the approved specification, errors, and context poisoning stay invisible until the end, which in a large distributed system is too late because the damage is already in the change set. The same failure shape appears in any loop that chains agent steps (incident analysis, data pipeline changes, document review, infrastructure change). Breaking a loop into gates, each a bounded check with a typed contract and recorded evidence, forces the loop to come up for air at every step: a deterministic check decides whether the work may advance, so problems surface at the gate where they occur, and hosting the gates centrally means the record of what happened does not live in one person's terminal.

**Generic by construction, with two standing constraints.** Nothing in the kernel, the contracts, or the ledger knows about software delivery: a Gate Pack is any composition of approved gate kinds, a work type is a label, and Business Case 1 is one pack among many. Two constraints hold for every pack in this release and are architectural, not pilot limitations: a human remains in the loop wherever a pack declares a `human` gate, and a fully cloud-driven automated loop is out of scope; and agent sessions run on the user's local machine inside the managed sandbox, with the platform never hosting a model or an agent session. Later packs may reduce the number of human gates as evidence accumulates, but the kernel never removes the ability to require one.

**How a job moves.** The walkthrough below uses Business Case 1, spec-driven delivery, because it is the most obvious case and the one most of this design is derived from; it is the reference Gate Pack, not the only one the kernel runs. A product manager runs `specops start my-intent.md`; the platform creates the job and compiles its Gate Pack to a LangGraph graph. From then on the platform behaves like an operating-system kernel: a scheduler decides which gate is ready, routers decide what each gate receives and where its output goes, and a checkpointer records every transition. The three routing services below are the ones a reader meets first because they shape what the CLI receives when it pulls work down; they are not the whole platform. Section 2 decomposes the platform into its nine components and section 6 specifies the kernel in full.

| Platform service | Decides | Example |
| --- | --- | --- |
| Message Router | Which contract, schema bundle, and prompt template apply to this work type and message type, and where each result and event is delivered | work type `intent`, message type `code-review`, output schema `implementation-result.v1` |
| Model Router | Which model profile a gate uses, resolved at run time to a GAIP model for a platform gate or to an entitled local foundation model for an agent gate, as the gate's configuration requires | profile `fast-v2` for a classifier, `standard-v3` for a specification eval |
| Decision API | A simple classifier (Jev, for example) that labels the work and decides whether each skippable gate is necessary | a small intent with no sensitive data might skip financial regulatory review; every skip is recorded with its cause |

**Work types.** A work type names the kind of artifact a gate produces, and it is the key the message router uses to select contracts and templates, so it is necessary even though its vocabulary is small. In Business Case 1 the work types are `intent` (structured requirements from an unstructured blob), `specification`, `implementation` (a source change), `findings` (a review or verification report), and `decision` (a human approval or rejection); platform-only gates produce `classification`, `policy_evaluation`, `screening`, and `fact` (a confirmed GitHub or Jenkins observation). Other packs add their own: `incident_analysis`, `migration_plan`, `document_revision`. A work type is pack-level configuration, not a kernel concept; the kernel only requires that each gate's output face declares one.

When an engineer claims work, it is the job that is locked, not the gate: a lease names one user, one job's current gate attempt, and an expiry, and no one else can submit for that job's attempt until the work is pushed back up or the lease expires. The gate definition is shared; a gate instance is one appearance of that definition in one job's history, and other jobs move through the same gate at the same time. The CLI pulls the assignment, the resolved context manifest, and the schemas, runs one isolated local agent session, validates the structured result, and submits it with session evidence and telemetry. Gates that only reach GAIP (for example `ofac_screening`, `decision_classifier`, an `enterprise_governance` eval) never touch the CLI; the platform runs them, reports their status, and retains their evidence and telemetry. Gates that only watch an external system (wait for pull request merge, wait for Jenkins deployment) hold the job as waiting and poll the managed system through read-only credentials.

**The graph is a DAG in the history people see.** Rework never returns a job to a previous node: a rejection at pull request review creates `implementation@2`, a new gate instance with a fresh retry budget, and every downstream gate whose inputs changed runs as a new instance. The status page and `specops job events` therefore read like a CI/CD pipeline run from start to finish: each gate instance in order, its attempts, blockers, evidence, decisions, and reasons, with earlier instances unchanged. Inside the compiled LangGraph the declared rework path is the only backward edge, bounded by `max_rework_cycles`, so validation proves every pack terminates.

The pilot ends at an approved pull request with a confirmed Jenkins result; promotion, deployment, and outcome observation are later Gate Packs. The companion Architecture Decision Records explain why each boundary sits where it does.

**Goals**

- Every gate is a deterministic check with a typed contract, recorded evidence, and a status visible to everyone entitled to the job.
- One durable, append-only record per job that explains every advance, decision, retry, invalidation, and external receipt.
- A job locked at its current gate while claimed; disparate users on different machines continue the same job without copying local state.
- Need-to-know context: each attempt receives an immutable, digested context manifest and nothing else.
- No sub-agent telephony: one fresh, top-level, headless agent run per attempt, returning a schema-valid result.
- Free and open-source libraries first (LangGraph, OPA, CEL, in-toto, Tree-sitter, Pydantic), AWS managed services for hosting, storage, messaging, and search.

**Non-goals**

- Hosting models or agent sessions in the platform, in any release, and calls from the CLI to GAIP, which is a constraint rather than a choice: GAIP is a privileged environment that accepts only machine-role interactions, so the platform's workload identity is its only possible caller.
- Becoming a general-purpose workflow engine: no workflow language, no open plugin marketplace, no arbitrary server-side code. Teams compose approved gate kinds; new kinds are an administrative platform change with their own lifecycle.
- Replacing the systems of record: Jira, GitHub, Jenkins One Pipeline, artifact repositories, deployment products, and monitoring stay authoritative for their facts; specops coordinates them and records what they reported.
- Removing the person from the loop: a pack may need fewer human gates as evidence accumulates, but a loop with no human gate anywhere is not a destination this design iterates toward. Pilot scope and its stopping point are in section 15.

## 2. Architecture overview

The system has three trust zones. The developer machine does agent work. The platform coordinates, authorizes, records, and calls managed systems. Managed systems own their facts. Every gate is a node in the platform; the work it waits for may be done by a local agent session, a managed system, or a person, but the gate itself, its input face, its output face, and its evaluation of the result, always runs in the platform. Wherever its work is done, a gate receives a `GateAssignment` and returns a `GateResult`.

&#91;embedded content: architecture · three trust zones, nine platform-side components, five managed systems\]

The CLI is the only path between the developer's machine and the platform, and the platform is the only caller of GAIP. The gate executor fans out to managed systems with read-only machine credentials; delivery actions that change GitHub, Jira, or Jenkins run from the CLI under the user's own identity, so a compromised platform cannot push source or deploy. The kernel's checkpoints are ledger events, which is why one Aurora store serves as both LangGraph's memory and the audit record.

**Component responsibilities**

| Component | Owns | Never does |
| --- | --- | --- |
| specops CLI | Sign-in, lease claim and renewal, worktree creation, context materialization, runtime adapter and session supervision, outbound DLP and prompt-injection filtering, schema validation, local evals, result and evidence submission, delivery actions under user identity | Gate decisions, GAIP calls, routing, holding platform credentials |
| Local agent tool | The agentic work for one attempt with its own approved model access inside the managed sandbox | Approving its own work, calling the platform, persisting state across attempts |
| API and authorization | Token validation, Entra entitlement evaluation, OPA request authorization, result acceptance transaction, queues and views | Keeping a membership directory, returning distinguishable not-found responses |
| LangGraph kernel | Gate Pack validation and compilation, scheduling the ready set, `interrupt()` and resume, retry and rework semantics, invalidation, the interaction broker | Hosting models or agent sessions |
| Context resolver (platform) | Resolving a typed `ContextManifest` of references, applicable rules, allowed paths, and budgets | Reading repository contents, using a model to choose context |
| Gate executor | Platform gates: OPA policy, CEL edges, built-in evals, aggregate, decision classifier and OFAC through GAIP, read-only GitHub, Jira, Jenkins checks; model routing for GAIP calls | Accepting agent prose as a decision |
| Ledger and leases (Aurora) | Hash-chained events, LangGraph checkpoints, lease inserts, idempotency keys, transactional outbox, state projections | `UPDATE` or `DELETE` on ledger rows |
| Evidence, events, search | Signed in-toto evidence in S3 Object Lock, EventBridge bus and SQS consumers, OpenSearch entitlement-filtered index, read-only web view | Deciding anything from the archive or the index |

## 3. Domain model

A job is the durable record for one requested change; a run is one controlled attempt to deliver it, pinned to one Gate Pack version and one LangGraph thread; everything else hangs off the run.

| Term | Meaning | Identity and limits |
| --- | --- | --- |
| Job | The durable record for one requested change, owned by a business scope and one or more repository scopes | `JOB-184`; may get a replacement run after cancellation or a material change in intent |
| Run | One controlled attempt to deliver the job, pinned to one compiled Gate Pack digest and one LangGraph thread | `RUN-123`; a newer pack version never alters a run in progress |
| Gate Pack | A versioned, content-addressed, scope-owned definition of gates and the edges between them | Validated and compiled before use; default gates owned by the platform manager team, custom gates by product teams |
| Gate | One small, self-contained evaluation or unit of work with a declared kind and location | Kinds: `agent`, `tool`, `decision_classifier`, `opa_policy`, `ofac_screening`, `eval`, `human`, `aggregate`; locations: agent, platform, human |
| Gate instance | One appearance of a gate in a job's history | `specification@1`, `specification@2`; rework creates a new instance, earlier ones stay unchanged |
| Gate attempt | One run of a gate instance on a fixed set of inputs | `ATT-517`; bounded by the gate's `max_attempts` (pack default 2) |
| GateAssignment | The immutable unit of work the platform publishes for an agent gate | `ASSIGN-889`; carries subject, agent profile, context manifest digest, limits, eligible scope, lease |
| Lease | A time-limited claim by one user on one gate attempt | `LEASE-442`; one active lease per attempt, conditional insert in Aurora, renewed by the CLI |
| GateResult | The typed terminal result of an attempt | Status `passed`, `failed`, `blocked`, `needs_human`, `cancelled`; names the same assignment, attempt, and subject |
| Decision | A typed human approval or rejection bound to an authenticated person and an exact subject digest | `DECISION-73`; a rejection carries reason codes, requested changes, and an optional rework target |
| Ledger event | One append-only, hash-chained record of anything that happened to the run | `EV-9182`; run sequence with no gaps |
| Evidence | A signed in-toto statement naming the subject it covers | Marked stale, never deleted, when its subject changes |
| Subject | The thing a gate evaluates: specification digest, commit, pull request, build, deployment, or policy version | A result for one subject never satisfies a gate for another |

**Repetition has three forms, each with its own limit.** A transient error (network or provider failure inside an attempt) is repeated by LangGraph `RetryPolicy` and does not count as an attempt. A retry runs the same gate again after a failed attempt, with the failure details and without a person, up to `max_attempts`; exhaustion routes to a human gate. Rework is a later gate sending the job back to an earlier gate because that gate's output must change; it creates a new gate instance with a fresh retry budget, re-runs every downstream gate whose inputs changed as a new instance, and is limited per job by `max_rework_cycles` (default 3), after which the next rejection ends the job.

**Invalidation is deterministic.** When intent, context, policy, source, or another subject changes, the platform appends a subject-change event, finds results whose declared subjects no longer match, marks them stale without deleting them, propagates through dependent gates, schedules the attempts now required, and records the resulting ready set.

## 4. Workflow: Business Case 1, intent to an approved pull request

The first-release Gate Pack is the white paper's twelve gates plus an `intent` agent gate at the front, so that `specops start my-intent.md` produces a structured Intent before a person reviews it.

&#91;embedded content: Business Case 1 workflow · 13 gates, 3 declared rework paths, 3 skippable gates\]

The diagram shows the base pack; section 7.4 adds the delivery segment (tests, sabotage, code review, push and pull request, merge) between implementation and the platform checks. The graph is forward-only except for the three declared rework paths. Gates 8 to 10 run only when the Jev classifier labels the work `regulatory_content`, `sensitive_data`, or `sanctions_screening`; a CEL edge condition reads those labels, every skip is a ledger event naming the classifier decision and the condition, and a missing or failed classifier result never skips a gate. A rejection at gate 11 that names `implementation` as its rework target creates `implementation@2`, and gates 6 through 10 run again as new instances because their inputs changed. Gate 10 may also send work back when it finds a match in drafted content. Any agent gate that exhausts `max_attempts` routes to the human gate its definition declares.

**Who acts, and from where**

| Step | Command or action | Where | What the platform records |
| --- | --- | --- | --- |
| Start | `specops start my-intent.md` selects a Gate Pack, creates the job and run, claims gate 0 | Product manager's CLI | Job created, run pinned to pack digest, lease on `intent@1` attempt 1 |
| Gate 0 | CLI renders the intent template, starts one local agent session, validates the Intent contract, submits it with session evidence | Product manager's machine | `GateResult` passed, Intent digest, session events and timing as evidence |
| Gate 1 | `specops decision approve` or `reject` on the exact Intent digest | Product owner, any machine | Typed decision bound to Ping subject and digest |
| Gate 2 | Platform calls Jev through GAIP, records labels | Platform | Classifier result, model profile, resolved GAIP model |
| Gates 3, 5, 6 | `specops work claim`, `specops work run` in an isolated worktree, `GateResult` submitted | Engineer's machine | Assignment, context manifest digest, diff, structured result, evidence |
| Gate 4, 11 | Decision on the specification digest; decision on the pull request head commit by a reviewer who is not the author | Reviewer, any machine | Decision with reason codes and optional rework target |
| Gates 7 to 10 | OPA bundle evaluation; GAIP evaluations for regulatory content, sensitive data, OFAC | Platform | Policy version, evaluation inputs, result, GAIP receipts |
| Gate 12 | Platform confirms the Jenkins build for the exact head commit through its read-only service account | Platform | Build fact bound to the commit; a build for the wrong commit cannot pass |

A person can see where a job stopped and why at any time with `specops job show`, `specops job events`, or the read-only web view; no step requires the original engineer to stay online.

## 5. Data flow: one agent gate attempt

One attempt passes through thirteen exchanges between a ready gate and the next gate. Each exchange is a ledger event or a typed contract.

&#91;embedded content: data flow for one agent gate attempt · 4 lanes, 13 exchanges\]

| Step | Data that moves | Contract or record |
| --- | --- | --- |
| 1 | The kernel reaches an agent gate, publishes a `GateAssignment` with its eligible scope, appends the event, writes the outbox entry, and calls `interrupt()`; the thread is now stored rows | `GateAssignment/v1`, `LedgerEvent/v1` |
| 2 | `specops work claim` presents the user's Ping token; the API checks Entra entitlements and OPA, then takes the lease as a conditional insert; a second claimant receives a conflict | Lease row, authorization event |
| 3 | The platform returns the assignment and the resolved `ContextManifest` (references, applicable rules, allowed paths, budgets, template version) with both digests | `ContextManifest/v1` |
| 4 | The CLI creates an isolated Git worktree at the starting source digest, builds or loads the Tree-sitter index for that SHA, materializes referenced files and documents, and runs inbound DLP and prompt-injection filtering; flagged content fails the attempt with a recorded reason | Worktree record (job, assignment, instance, attempt, base commit, branch, lease, expiry) |
| 5 | The runtime adapter starts one headless session in the managed binary with the custom agent profile, rendered prompt, sandbox and capability profile, and the output schema | Adapter capability negotiation |
| 6 | The adapter normalizes provider events; the supervisor emits heartbeats from observable activity and renews the lease on its own clock; activity resets the activity timeout but never the absolute deadline | NDJSON progress events |
| 7 | The session ends with structured output; sub-agent prose, if any, is advisory | Provider-side structured output |
| 8 | The CLI validates output against the schema, runs the gate's declared local evals, derives source facts from Git (commit, changed paths), runs outbound DLP, and computes JCS digests | Local eval reports as evidence |
| 9 | Evidence bodies (diff, reports, bounded agent output) are uploaded to S3 by presigned URL; the platform signs the in-toto statements with KMS on acceptance | in-toto statement in DSSE envelope |
| 10 | `specops work run` submits the `GateResult` with the lease, the expected ledger position, and an idempotency key | `GateResult/v1` |
| 11 | One transaction validates caller and contract, authorizes, checks idempotency, lease, attempt, and subject, validates output schema and evidence digests, appends events, adds outbox entries, commits | Acceptance transaction |
| 12 | The API returns `202 Accepted` with a receipt; a repeated submission with the same key returns the same receipt; a late result from an expired lease is recorded as rejected evidence | Receipt |
| 13 | The outbox publisher sends the event to EventBridge; the kernel's resume queue delivers it; a worker loads the checkpoint, evaluates the CEL edge, and schedules the next gate | Resume event, routing decision event |

What never crosses a lane: the user's OAuth token (it stays inside the CLI's credential boundary), the model's conversation history, the sandbox's own credentials, and any platform credential. The next gate attempt starts from the ledger, not from this session.

## 6. Kernel: Gate Pack compiler, scheduler, ledger checkpointer, interrupt and resume

The kernel is named for what it is patterned on: an operating-system kernel. It owns the task scheduler (which gate is ready, which worker picks it up), the message router (which contract, schema, and template apply to a work type and message type, and where each result and event is delivered), the model router (which model profile a platform gate uses), the decision API (the classifier that decides which gates a job needs), the interaction broker, and the ledger checkpointer. Gate Packs, contracts, and the domain model expose none of LangGraph's types; LangGraph is the implementation of the scheduler, moving a job through the graph.

**Nodes with two faces.** A gate is a node with an input face and an output face. The input face is the typed `GateAssignment` the kernel builds for it (subject, context manifest digest, limits, eligible scope); the output face is the typed `GateResult` it must return. Edges connect one node's output face to the next node's input face, and a CEL condition on an edge reads only the output face it leaves from. Because both faces are schemas, the compiler can check at validation time that every edge connects compatible faces, and the ledger can record exactly what entered and left each gate instance.

**Gate Pack compiler.** A pack is a declarative YAML or JSON document validated against `GatePack/v1`, then compiled to a `StateGraph`: each gate becomes a node keyed by gate identifier; each CEL edge condition becomes a conditional edge function that reads only accepted results, job metadata, classifier labels, and pinned pack values; each declared rework path becomes the only kind of backward edge. The compiler rejects packs that fail the validation list in ADR-003 and records the compiled graph's digest beside the pack digest. A run pins both; publishing a newer pack version starts no change in an active run (adoption of newer versions is open decision 19).

**Node execution contract.** Every node, whatever its kind, implements one interface: receive the current run state and the gate definition, produce either a `GateResult` or an interrupt carrying a `GateAssignment` or `DecisionRequest`. The scheduler does not know whether a node will invoke OPA, call GAIP through the model router, confirm a Jenkins build, or wait for a person.

| Gate kind | Node behavior |
| --- | --- |
| `agent` | Resolve the context manifest, publish `GateAssignment` to the eligible scope, append the event, `interrupt()`; resume on an accepted `GateResult` |
| `human` | Append a `DecisionRequest`, publish to the eligible decider queue, `interrupt()`; resume on a typed decision |
| `decision_classifier` | Route a model profile to a GAIP model, call Jev, record labels, model, and reasoning configuration on the attempt |
| `opa_policy` | Evaluate the referenced Rego bundle against accepted results and subject facts; record policy version and inputs |
| `ofac_screening` | Call GAIP's screening with the names and entities in the work; record the GAIP receipt; never consult a platform-held list |
| `eval` | Run a built-in deterministic operation over accepted results (schema conformance, evidence freshness, subject match, test report parsing) |
| `tool` | Run an approved deterministic command or service call, on the platform or through the CLI depending on declared location |
| `aggregate` | Combine accepted predecessor results by declared logic (all-of, any-of, quorum) |

**Wait gates.** A `tool` gate at platform location with a watch condition (`wait_for: pull_request_merged`, `wait_for: jenkins_deployment`) holds the job as waiting, polls the managed system through its read-only credential on a schedule run by EventBridge Scheduler, binds the observed fact to the exact subject, and returns `passed` when the condition holds or `blocked` when the system cannot be reached. It never touches the CLI; its status, evidence, and telemetry appear on the status page like any other gate.

**Ledger checkpointer.** A custom `BaseCheckpointSaver` writes every checkpoint and every pending write as a hash-chained ledger event in the same Aurora transaction. `put` appends; `get_tuple` and `list` read projections; there is no update path. The database role has no `UPDATE` or `DELETE` rights, so replaying or forking a run can only add events. Checkpoint payloads reference artifacts and evidence by identifier and digest instead of embedding them, which keeps checkpoints small and keeps transcripts out of the ledger.

**Interrupt and resume.** When a node needs work from outside the platform, it calls `interrupt()`; LangGraph saves the thread state through the ledger checkpointer, and the worker moves on. No compute is held while a job waits. When a result or decision is accepted, the API returns `202 Accepted` and writes a resume event to the outbox. A kernel worker consumes the resume queue, loads the checkpoint, injects the accepted result into the thread state, evaluates the outgoing CEL edges, and schedules the next ready set. The `202` means recorded, not that the next gate has run; callers follow progress through `specops job events` or the live stream.

**Retry, rework, invalidation, and blocked handling** are kernel semantics, not pack logic: transient errors repeat inside the attempt through LangGraph `RetryPolicy`; a `failed` result creates attempt N+1 until `max_attempts`, then routes to the gate's declared human gate; a rejection with a rework target follows the declared rework edge and creates new instances downstream; a subject change invalidates dependent results and schedules the now-required attempts; a `blocked` result holds the attempt, schedules a deadline with EventBridge Scheduler (default `PT2H`), resumes when the dependency returns, and routes to a human gate after the deadline. An authorized approver may override a blocked gate with a typed decision.

**Interaction broker.** The part of the kernel that turns an agent's `needs_human` result or a runtime approval requirement into a durable `DecisionRequest`, routes it by pack policy to a declared approval gate or an eligible decider queue, and converts the resulting decision into typed input for the fresh assignment that follows. It never resumes a half-finished CLI invocation.

## 7. CLI: session supervision, runtime adapters, local evals, filtering

The CLI is a signed, versioned binary distributed through the approved internal software channel; the platform may require a minimum supported version when a contract or security change makes an older client unsafe. It is the I/O path for agent gates and the only interactive command path for people, so there is one place to secure, version, and audit.

**Commands**

| Command | Effect |
| --- | --- |
| `specops auth login` | OAuth 2.0 Authorization Code with PKCE through Ping; loopback redirect; device flow only if approved |
| `specops start <intent-file>` | Create a job and run against a selected Gate Pack, claim the `intent` gate, run it, submit the structured Intent |
| `specops job start`, `show`, `events`, `cancel` | Create, inspect, list the ordered ledger, cancel (an authorized decision) |
| `specops work list`, `claim`, `run`, `release` | List assignments and decisions awaiting a role; take a lease and fetch assignment and context; create the worktree, run the session, renew the lease, submit; release a lease |
| `specops decision list`, `approve`, `reject` | Record a human decision bound to the exact subject digest; a rejection carries reason codes, comments, requested changes, optional rework target |
| `specops context list`, `get <ref>` | Progressive disclosure within the attempt's permitted scope; refused outside it |

**Machine contract.** Input from file or standard input; non-streaming stdout holds exactly one JSON document; streaming stdout holds only schema-valid NDJSON events; human diagnostics go to stderr; every stream ends with exactly one terminal event; core objects reject unknown fields; optional extensions live in a namespaced `extensions` object; schema and contract incompatibilities fail closed; state-changing requests carry idempotency keys; identifiers, assignment digests, and subject digests are checked at every boundary; each exit code stands for one group of the shared failure taxonomy.

**Runtime adapters.** One interface, three implementations: Claude Code through the Claude Agent SDK with `cli_path` set to the managed binary; Codex through the Codex SDK with `codex_bin` set to the managed binary; and a direct subprocess adapter that parses the managed binary's JSON event stream (`stream-json` or `exec --json`) as the escape hatch. Adapters negotiate capabilities (structured output, streaming, permission callbacks, cancellation) and never own authentication or model selection. The custom agent profile selects focused developer instructions, the model and reasoning configuration the tool uses, sandbox policy, available MCP servers and tools, and applicable skills; it cannot enforce a result schema on its own, so the production path is always custom profile plus isolated session plus provider-side structured output plus platform-side schema validation plus authoritative receipt.

**Session supervision.** Three independent clocks: the lease (lives in Aurora, renewed by the CLI, detects a dead or disconnected CLI), the activity timeout (detects a stalled model or tool call; activity resets it), and the absolute deadline (never extended). The supervisor normalizes provider events into a bounded set (session started, model stream activity, tool started, progress, completed, file change observed, agent checkpoint, heartbeat, warning, cancellation requested, result submitted, timeout or interruption, session completed) and generates heartbeats from observable activity; model text such as "still working" is not evidence of liveness. The supervisor only reports a timeout or interruption; the platform decides what happens to the attempt. Cancellation reaches the session, is recorded once, and is followed by exactly one terminal state.

**Templating and local evals.** The CLI downloads the schema bundle pinned by the pack digest and renders the assignment, manifest references, and output schema into the agent's prompt template. After the session it validates the structured output, runs the gate's declared local evals, derives source facts from Git instead of trusting the agent's description, and records each check as evidence. A failed check produces a `failed` result with structured failures; the CLI never repairs output silently and never decides that a gate passed.

**Two filtering boundaries.** Before context reaches the local agent tool, and before results or evidence leave the machine, the CLI runs PII and DLP filtering and prompt-injection detection. The DLP filter removes or blocks personal data, credentials, and content the data classification does not allow; the injection filter flags instructions embedded in repository files, Jira descriptions, pull request comments, logs, and earlier agent output. A flagged item fails the attempt with a recorded reason; the session does not run on partial context. If the DLP service is unavailable, the attempt is blocked.

**Offline behavior.** The platform schedules the shared graph, so an offline CLI cannot advance a job. A CLI that loses connectivity can finish the attempt it holds a lease for and submit when the platform returns; the result is accepted if the lease is still current and rejected otherwise, with the work kept as evidence. Local-only work stays on the machine until the user claims a new lease and submits it.

### 7.1 Project and branch binding

The engineer should never have to work out which repository, branch, or commit an assignment belongs to; the assignment says so and the CLI enforces it. A `GateAssignment` for an agent gate names the repository, the base commit (the subject of the upstream gate), and the branch naming rule from the Gate Pack. `specops work claim` then:

1. Looks up the repository in the CLI's per-machine configuration, a one-time human mapping of repository identity (the GitHub remote, not a path) to a local checkout. If the repository is not configured, the CLI prints the clone command and stops; it does not guess a directory.
2. Verifies the checkout's remote matches the assignment's repository, fetches, and confirms the base commit exists.
3. Creates an isolated Git worktree on a deterministic branch, `specops/JOB-184/implementation@1`, at the base commit, and records the worktree (job, assignment, gate instance, attempt, base commit, branch, lease, expiry).
4. Refuses to start a session if the worktree is dirty, on the wrong base, or already bound to a different attempt.

The human drives only the one-time repository mapping and the choice to claim. Everything after the claim is automated, and the platform's source verification gate later confirms that the submitted commit descends from the assigned base, so a session started in the wrong place cannot pass.

### 7.2 Long-running implementation: the task workbook

A specification worth claiming includes the designs, decisions, and an ordered task list. The implementation gate declares `decomposition: per_task`, and the CLI runs the attempt as a workbook: one fresh, bounded agent session per task, each receiving the specification, the task, the current worktree state, and the results of earlier tasks as typed input, and each returning a structured task result. The CLI commits after every task, validates the task result against its schema, records it as evidence, and emits a progress event; the platform sees one gate attempt with per-task sub-results, not dozens of gates. The lease is renewed throughout and the activity timeout and absolute deadline apply per session, not per attempt, so a day-long implementation is a long lease, not a long session. If the engineer stops partway, the worktree keeps the completed tasks and `specops work continue` resumes at the next one; if the lease expires, the completed commits stay on the branch and the next claimant resumes from them.

### 7.3 Human checkpoints inside an attempt

Not every attempt should go straight from agent session to submission. A gate may declare `handoff: human_checkpoint`, which makes the CLI pause after the agent session instead of submitting, print the summary and the diff, and wait. From that state the engineer has three commands:

| Command | Effect |
| --- | --- |
| `specops work review` | Opens the worktree for inspection: run `npm run dev`, click through the change, perform user acceptance testing. Nothing is recorded except the pause event. |
| `specops work continue --feedback <file>` | Starts a fresh agent session in the same attempt with the engineer's feedback as typed input (requested changes, naming conventions to apply, a failing scenario). Each continuation is a sub-session of the attempt with its own evidence. |
| `specops work submit` | Ends the checkpoint and submits. The CLI derives the diff from Git, so edits the engineer made by hand, or in their own agent session inside the worktree, are included and attributed as human-authored commits in the evidence. |

The recommended path for changes after UAT is `specops work continue`, because the resulting session is recorded with its context and output; editing in a separate agent session outside specops still produces a valid submission but leaves no session evidence for those edits. Standing conventions (variable naming, formatting, test layout) belong in the custom agent profile and the repository standards the context manifest references, so they apply to every session without being re-stated as feedback. While the attempt is at a checkpoint the platform shows the job as waiting on the lease holder, and the lease switches to the human-paced due date from the short renewal interval.

### 7.4 Delivery gates after code complete

Every interaction after code complete is its own gate so the job's status is always visible. The Business Case 1 pack gains a delivery segment between implementation and the existing platform checks.

&#91;embedded content: delivery segment · implementation to merge, fix loops inside tests, sabotage, and code review\]

| Gate | Kind | What happens | Fix step |
| --- | --- | --- | --- |
| Tests | agent | A session runs the unit and integration suites and returns a structured report (suite, counts, failures with locations, coverage reference); the CLI captures the raw report as evidence and the platform's test eval gate parses it independently | A failed attempt starts a fix session with the failures as typed input, up to `max_attempts` |
| Sabotage | agent | Mutation testing: a session removes or mutates the implemented code and runs the suite; the structured result lists mutants that survived, which means the tests do not cover the change | Fix session writes or strengthens tests for surviving mutants |
| Code review | agent plus Decision API | A fresh review session produces findings with locations and severities; the Decision API labels each finding low, medium, high, or critical and the gate's CEL rule dispositions them: low and medium are recorded; high triggers a fix session; critical routes to a human | Fix session addresses high findings; the review re-runs as a new attempt |
| Platform checks 6 to 10 | platform | Source verification, repository policy (OPA), and the GAIP screenings as already defined | Retry per existing rules |
| Push and PR | tool, at the engineer's machine | The CLI, not the agent, pushes the branch and opens the pull request by repository convention (title, template, labels, linked job) under the user's identity; the GitHub MCP connector is preferred and `gh` is the fallback when it is down | A failed push is a `blocked` result, not a retry |
| Pull request review | human | A reviewer who is not the author approves the exact head commit | Rejection follows the rework path |
| Jenkins verification | platform | Build fact bound to the head commit | Blocked while Jenkins is unreachable |
| Merge | human in the pilot | The engineer or reviewer merges with `specops work merge`, which performs the merge under their identity after the platform confirms every required gate passed; a later pack may declare the merge gate as `tool` where repository policy allows automated merge | None; a merge conflict is a `blocked` result with a rework target of implementation |

A fix loop is the gate's retry policy: each fix is a new attempt within the same gate instance, carrying the failure details, and exhaustion routes to a human gate. The CLI never decides that tests passed; it carries the report, and the platform's eval gate reads it.

### 7.5 Headless permissions and the `gh` CLI

A headless agent session cannot answer an interactive approval prompt, so the design keeps prompts out of the session. Write actions against GitHub (push, pull request, merge, issue creation) are performed by the specops CLI itself as `tool` steps outside the agent session, under the user's identity, through the GitHub MCP connector with `gh` as the fallback. Read actions the agent needs are pre-approved: the assignment's allowed-command list is loaded into the local agent tool's permission configuration for the session, so `gh pr view` or `gh api` on an allowed path runs without a prompt. When the local tool raises a permission callback anyway, the runtime adapter surfaces it: in attended mode the CLI prompts the engineer at the terminal and records the answer; in unattended mode the CLI answers only from the allowed-command list and denies everything else, recording the denial. The CLI never approves on the user's behalf beyond that list; an agent that needs more ends its session with `needs_human` and a request naming the command.

### 7.6 Findings and out-of-scope issues

Agents notice things outside the change: a latent defect, a risky dependency, a missing test, a design question. `GateResult` carries a `findings` array (kind `out_of_scope`, `defect`, `risk`, `question`; location; description; suggested action), and the CLI accepts findings on every result, including passed ones. The platform records them as evidence on the job and routes them through a findings disposition step: the Decision API labels severity and category, a `tool` gate assigns each finding a target (GitHub issue, Jira ticket, or recorded only), and because the platform's GitHub access is read-only, the issues themselves are created by the CLI under the user's identity, with the issue identifier written back to the ledger. Findings never block the gate that reported them unless a human disposition says so.

## 8. Engineering Context Resolver and context manifests

For each attempt the resolver answers one question: which architecture references, repository evidence, nonfunctional requirements, engineering standards, and prior approved decisions this node must see. Anything outside that set is excluded. The resolver is a pure, testable service with no model in its path, split between the platform (what may be seen) and the CLI (materializing it from the local checkout).

**Four classes of engineering context**

| Class | Examples | Resolution strategy | Resolved by |
| --- | --- | --- | --- |
| Project architecture | C4 references, ADRs, service boundaries, interfaces | Project and component identity | Platform |
| Codebase intelligence | Repository map, symbols, imports, call paths, test-to-code relationships | Git SHA plus affected files and symbols; dependency closure to a bounded depth | CLI, from a Tree-sitter index cached per SHA |
| Nonfunctional requirements | Availability, latency, security, data retention, throughput | Deterministic applicability rules on component scope | Platform |
| Delivery state | Approved intent and specification digests, prior findings for this retry or rework, selected evidence | Upstream ledger artifacts | Platform |

Mandatory material (security standards, NFRs, approved decisions) is selected by deterministic rules; semantic retrieval over documentation may supplement but never decides whether a mandatory item is included. Existing OKF and llm-wiki frontmatter is consumed as a metadata index that feeds the rules, not as the selector.

**Context manifest.** Resolved before the session starts, immutable for the attempt, with its own JCS digest recorded on the attempt. It references approved intent and specification digests, the current source revision and a bounded diff, selected evidence, applicable rule identifiers, allowed repository paths, prior findings relevant to the current retry or rework, the context template version, and size and token budgets.

```yaml
id: implement-auth-change
type: agent
version: 1
context:
  project: bank-auth
  component: auth-processor
  include:
    - approved_intent
    - approved_specification
    - component_architecture
    - applicable_adrs
    - applicable_nfrs
    - repository_symbol_map
    - relevant_code
  scope:
    strategy: dependency_closure
    max_depth: 2
  exclusions:
    - unrelated_components
    - unapproved_designs
    - prior_agent_transcripts
  retrieval:
    mode: scoped_on_demand
    allow_scope_expansion: false
  budgets:
    max_files: 60
    max_tokens: 120000
contracts:
  input: implementation-input.v1
  output: implementation-result.v1
execution:
  location: agent
  isolation: worktree
  timeout_seconds: 1800
evidence:
  capture:
    - context_manifest
    - session_events
    - git_diff
    - structured_result
```

**Repository intelligence index.** The CLI builds a per-worktree index with Tree-sitter (and language-server metadata where the sandbox provides it) outside the model path: module and package ownership, symbol-level dependency relationships, public interfaces and call chains, test-to-code relationships, and component-specific architecture references. The index is keyed by Git commit, refreshed incrementally, and used to locate the handler, its dependencies, contracts, and tests for a change; it does not pull in a whole platform's documentation hierarchy. The index's digest is recorded as evidence so a replayed attempt can be compared with the original.

**Progressive disclosure.** The session starts with a small base package. If the agent needs more, it runs `specops context list` and `specops context get adr:014`, which serve only resources inside the attempt's permitted scope; `allow_scope_expansion: false` makes any other request a recorded refusal. This governs context delivered through the broker; need-to-know as a security requirement is also enforced by the managed sandbox's filesystem and process isolation.

**Data, never authority.** Repository files, tickets, logs, and earlier model output are treated as data. Their contents cannot add capabilities, change policy, choose a different gate, or widen the assignment; the `GateAssignment` built by the platform from the pinned pack and policy defines authority, and the prompt-injection filter flags content that tries to override it.

## 9. Contracts and schemas

Contracts are JSON Schema 2020-12 documents in Git with generated TypeScript and Pydantic types and one shared failure taxonomy; digests are JCS (RFC 8785) so the same object always hashes the same way. Each schema is versioned independently.

| Schema | Produced by | Key fields |
| --- | --- | --- |
| `GateDefinition/v1` | Gate authors; platform manager team for defaults | identifier, display name, purpose, version; dependencies and CEL activation conditions; input and output schema references; kind and location; model profile and reasoning policy (platform gates that call GAIP); content-addressed context inputs and budget; required evidence and subject-binding rules; allowed capabilities, tools, commands, paths; startup, activity, absolute time limits; retry policy (`max_attempts`, default 2); `skippable` and ownership; blocked deadline (`PT2H` default); human gate for exhaustion; outcome-to-edge rules; invalidation conditions; authorization, ownership, separation-of-duty requirements |
| `GatePack/v1` | Product teams (custom gates), platform manager team (defaults) | gates, edges, declared rework paths, `max_rework_cycles` (default 3), owner scope, version, digest |
| `GateAssignment/v1` | Platform | assignment identifier and digest; job, run, gate instance, attempt; subject (specification digest, commit, pull request, or build); named agent definition; context manifest digest; limits (tools, paths, time, output size, usage); eligible scope; lease identifier and expiry once claimed |
| `ContextManifest/v1` | Platform resolver | references, rule identifiers, allowed paths, prior findings, template version, budgets, digest |
| `GateResult/v1` | CLI (agent gates), platform (platform gates), API (human gates) | same assignment, attempt, subject; status `passed`, `failed`, `blocked`, `needs_human`, `cancelled`; typed output; evidence references; structured failures; model reported; CLI version and adapter; session and turn identifiers; timing and usage; context manifest digest |
| `DecisionRequest/v1` | Kernel (interaction broker) | kind (`question`, `approval`, `override`), reason code, question, evidence references, proposed options, eligible deciders |
| `Decision/v1` | API on a human's authenticated call | decider subject, decision time, subject digest reviewed, outcome, reason codes, comments, requested changes, rework target or end-of-job |
| `LedgerEvent/v1` | Platform | event type and schema version; per-job sequence; job, run, gate, attempt, assignment, session, turn identifiers; actor; client occurrence time and platform receipt time; terminal status; correlation and causation identifiers; subject type, identifier, digest; payload or evidence reference and digest; previous and current event hash; authorization and policy decision references; CLI, Gate Pack, model-profile versions |
| CLI command envelope | CLI | the standard output format for every command |

**Example: an agent asks for a decision.** An implementation agent finds that the feature needs a new database table the approved architecture does not permit. The attempt ends `needs_human`:

```json
{
  "status": "needs_human",
  "assignment_id": "ASSIGN-889",
  "attempt_id": "ATT-517",
  "subject": { "type": "specification", "digest": "sha256:…" },
  "decision_request": {
    "kind": "question",
    "reason": "architecture_decision",
    "question": "May the implementation introduce a new table?",
    "evidence_refs": [
      "artifact://design/adr-014",
      "artifact://changes/schema-proposal"
    ],
    "options": ["allow_new_table", "use_existing_table", "reject_change"]
  },
  "evidence": ["evidence://EV-9182"],
  "model_reported": "…",
  "cli_version": "1.4.2",
  "adapter": "claude-code-sdk"
}
```

The kernel persists the request, suspends the node, and routes it to the architecture approval gate if the pack declares one, otherwise to the eligible decider queue. The decision becomes typed input to a fresh `implementation` assignment.

**Example: an NDJSON session stream.**

```json
{"type":"session.started","sequence":1,"attempt_id":"ATT-517"}
{"type":"session.activity","sequence":2,"activity":"tool.started"}
{"type":"session.heartbeat","sequence":3,"elapsed_ms":15000}
{"type":"gate.result_submitted","sequence":4,"result_digest":"sha256:…"}
{"type":"command.completed","sequence":5,"status":"passed"}
```

Progress events show liveness. Only the validated terminal `GateResult` decides the gate outcome.

**Service interface** (REST with server-sent events behind DXGW; stays small):

```text
createJob(intent, gatePack) -> job and run
listWork(filters) -> authorized assignments and decisions awaiting a role
claimLease(assignment, idempotencyKey) -> lease or conflict
renewLease(lease) -> lease or expired
submitResult(lease, GateResult/v1, idempotencyKey) -> 202 Accepted with receipt, or rejection
submitDecision(gate, decision, idempotencyKey) -> 202 Accepted with receipt, or rejection
read(job or run) -> authorized current projection
search(query, filters) -> authorized history results
```

## 10. Policy, routing, and gate execution kinds

Three mechanisms stay separate so a change to one never leaks into another: gate routing decides which gates run, model routing decides which model a platform gate uses, and gate execution produces the result.

**Gate routing (CEL).** A decision classifier gate (Jev, hosted in GAIP) runs early and labels the work: `regulatory_content`, `sensitive_data`, `sanctions_screening`, an external party, and so on. Conditional edges read those labels and route around gates that do not apply. CEL is side-effect-free and type-checked at pack validation, so a condition is evaluated and audited without running code. Only a gate whose definition sets `skippable: true` can be skipped; the platform manager team sets that flag on default gates and product teams on their custom gates; entitlements enforce the split. Every skip is a ledger event naming the classifier decision and the condition. A missing or failed classifier result never skips a gate: the classifier retries, then routes to a human gate.

**Model routing.** Gate Packs name model profiles, never specific models: `code-review/fast-v2`, `decision-classifier/standard-v1`, `spec-eval/standard-v3`. The model router picks a profile for each gate from the gate type, the data classification of its context, context size, cost tier, and current availability. Where the profile resolves depends on the gate's location: for a platform gate the platform resolves it to a model offered through GAIP with a reasoning effort and budget; for an agent gate the profile travels in the `GateAssignment` and the CLI resolves it against the models the developer's local agent tool is entitled to use, passing the resolved model and reasoning configuration to the runtime adapter, which never chooses on its own. The resolved model is recorded on the attempt; a retry uses the same rules, so it is never silently sent to a different model. A gate may also declare no profile, in which case the local agent tool uses its default approved model. In every case the `GateResult` records the model the tool reports, so the ledger shows what actually ran.

**Message routing.** The message router resolves, for a work type (`intent`, `specification`, `implementation`, `review`) and a message type (`code-review`, `spec-eval`, `decision-request`), which contract versions, schema bundle, and prompt template the CLI pulls down with the assignment, and where each output goes: progress events to telemetry, the terminal `GateResult` to the acceptance transaction and then to the next node's input face, a `DecisionRequest` to the human approval queue, a gate outcome to the scheduler. It is table-driven configuration pinned by the Gate Pack digest, so a run never sees a template or schema change mid-flight.

**Policy gates (OPA).** An `opa_policy` gate evaluates a Rego bundle referenced by the gate definition, or runs the policy in an OPA service inside the platform, against accepted results, subject facts, and job metadata: "a change to a payments module needs a second reviewer", "no schema migration without an approved ADR reference". The policy version and evaluation inputs are recorded. Request authorization uses the same engine but is a separate decision (section 11).

**OFAC gate.** A platform gate that calls GAIP to screen names and entities in the work against the sanctions lists GAIP manages (including the Specially Designated Nationals list). The platform keeps no copy of the lists; the evidence records GAIP's screening receipt. OPA and OFAC are always separate gates with separate evidence, owners, and retry policy. Matching rules (exact, fuzzy, both, thresholds) and the freshness of GAIP's list data are open decisions 6 in the ADR set.

**Execution contract by kind**

| Kind | Location | What it needs | What it returns |
| --- | --- | --- | --- |
| `agent` | agent | `GateAssignment`, `ContextManifest`, agent profile, sandbox profile | `GateResult` from the CLI with evidence |
| `tool` | agent or platform | an approved command or service call, inputs by reference | `GateResult` with the command's captured output as evidence |
| `decision_classifier` | platform | model profile, bounded content | labels, model, reasoning configuration |
| `opa_policy` | platform | Rego bundle reference, accepted results, subject facts | decision, policy version, inputs |
| `ofac_screening` | platform | names and entities, GAIP screening endpoint | screening receipt |
| `eval` | platform | accepted results, evidence references | deterministic check result |
| `human` | human | `DecisionRequest`, subject digest, eligible deciders, separation-of-duty rules | `Decision` |
| `aggregate` | platform | accepted predecessor results, declared logic | combined result |

**Result acceptance** is one transaction in every case: validate the authenticated caller and the contract; authorize the action; check the idempotency key, that the lease is current, and that the result names the current attempt and subject; validate output against the gate's schema and check the required evidence; append the result, decisions, and evidence references; add the resulting events, including the resume event, to the outbox; commit and return `202 Accepted` with a receipt. A result for an expired lease, a superseded attempt, or an outdated subject is recorded as rejected and selects no outgoing edge.

**Structured results advance work; prose does not.** Agent prose, summaries, and statements such as "tests pass" are not gate decisions. The test gate runs the tests and records an evidence reference; a review agent may provide findings that a reviewer reads, but it never decides that work passes an OPA, OFAC, test, or eval gate.

## 11. Identity, authorization, leases, and security boundaries

This section separates three questions: authentication (who called), authorization (whether that caller may read or act on this job now), and leases (who owns a gate attempt). Knowing a job, assignment, or lease identifier grants no access on its own.

**Sign-in.** The CLI uses OAuth 2.0 Authorization Code with PKCE through Ping, opens the browser, and receives the redirect on a loopback address; the device authorization grant is used only if the approved Ping configuration supports it; the public client contains no secret. The web application uses Ping through OpenID Connect. Access tokens are short-lived; refresh and local token storage follow the approved enterprise client pattern. The API validates issuer, audience, signature, expiry, and required scopes and keys users by Ping's stable subject identifier, never an email address. Whether DXGW also validates tokens is open; the platform validates them either way.

**Authorization.** Each job belongs to a business scope and one or more repository scopes. All Access maps people to team and repository role groups and Microsoft Entra ID supplies those entitlements on every request; the platform keeps no membership copy that could drift. OPA evaluates every request with: caller subject and current groups; requested read or action; job, repository, and team scope; the job's current gate and the role it needs; the current lease holder; the caller's relationship to the work (creator, contributor, reviewer, administrator); separation-of-duty rules; policy version.

| Action | Required relationship |
| --- | --- |
| View or search | Member of an entitled scope, named participant, or approved support role |
| Claim a lease | Member of the eligible scope for the gate's role |
| Submit a gate result | Current lease holder for that attempt |
| Approve or reject | Named or eligible decider who passes separation-of-duty rules |
| Cancel | Job owner or scoped administrator |
| Configure custom gates in a team's Gate Packs | Member of the owning product team's administration role |
| Configure default gates, including `skippable` | Platform manager team |
| Change entitlements | Separate platform administration role |

The API returns the same not-found response for resources that do not exist and resources the caller cannot view, which limits identifier probing.

**Leases.** One user, one gate attempt, one expiry. Claiming is a conditional insert in Aurora: the API confirms the attempt has no active lease, verifies eligibility, and records the lease in one transaction; two callers cannot hold the same attempt. The CLI renews on a short interval while it works; a longer due date applies to human decisions. On expiry the platform appends a lease-expired event, returns the same attempt to its eligible queue without spending it, and rejects any late result submitted under the old lease. A lease identifies who is doing the current attempt; it does not expand that person's permissions.

**Separation of duty.** A human decision binds the authenticated person to the exact subject digest reviewed. Repository policy may require a product owner and a technical reviewer, or forbid the author of a source change from approving it. A new commit makes an approval of the earlier commit stale. Agents may draft, implement, review, and analyze; they cannot approve their own work, grant an entitlement, raise a retry limit, or declare that an independent system passed.

**Service identity and credential boundaries**

| Boundary | Rule |
| --- | --- |
| Internal AWS calls | IAM task roles and signed requests |
| Platform gates to managed systems | Narrowly scoped, read-only machine credentials: a GitHub App, Jira and Jenkins service accounts; GAIP over private networking restricted by network ACLs and security groups |
| CLI to GitHub, Jira, Jenkins, DevNavHub | The user's own approved identity or delegated flow; receipts with correlation identifiers come back in the `GateResult` |
| Local agent tool | Receives neither the user's OAuth material nor any platform credential; uses its own approved model access inside the managed sandbox |
| Prompts, repository files, event payloads, evidence | Never contain credentials; the CLI keeps the OAuth token inside its credential boundary and never passes it as an argument, environment leak, or file |

**Trust-surface controls for composable gates.** Gate Packs are versioned, integrity-protected, scoped, and authorized; runs pin an immutable digest; gate authors cannot select unapproved models, tools, capabilities, or kinds; platform service identities are separate from human identities; gate results are schema-validated and checked against the expected assignment; evidence freshness and subject matching fail closed; unknown gate kind, policy, entitlement, approval, or evidence states do not pass.

**Threat model coverage.** Guessing identifiers to view another team's work; claiming a lease for an ineligible team; submitting without the current lease; replaying an approval or result; approving a stale commit; a modified client reporting false GitHub or Jenkins facts (the platform confirms facts with the source system); a Gate Pack that skips a required gate through a crafted CEL condition or changed `skippable` setting; prompt injection in repository or ticket content; a local agent reaching user or platform credentials; search counts or suggestions revealing unauthorized records; forged client binaries or outdated contract versions; duplicate or out-of-order events.

**Data minimization.** The platform stores structured results and selected evidence, not full conversations. Logs exclude tokens, credentials, authorization headers, and sensitive document bodies. Evidence, ledger events, sealed segments, and audit logs are kept 2 years. AWS controls: private networking, TLS, WAF rules, KMS encryption, security groups and network ACLs with narrow outbound access, an egress allowlist for github.com, CloudTrail, image scanning, signed releases, dependency review, and alarms on unusual access or rejection rates.

## 12. Failure handling

Stopped clients, expired leases, failed checks, unavailable managed systems, and repeated submissions are normal operating conditions, and each has one defined behavior.

| Condition | Meaning | Platform behavior | Spends an attempt |
| --- | --- | --- | --- |
| Transient error | Network or provider failure inside an attempt (GAIP timeout, throttled request) | LangGraph `RetryPolicy` repeats the call | No |
| Failed attempt | The work was wrong (schema failure, failed local or platform eval, failed check) | Run the same gate again with the failure details, no person involved, up to `max_attempts` (pack default 2); exhaustion routes to the gate's declared human gate | Yes |
| Rework | A later gate (usually a human review or a check such as OFAC) says an earlier gate's output must change | Follow the declared rework edge; new gate instance with a fresh retry budget; downstream gates whose inputs changed run as new instances; limited by `max_rework_cycles` (default 3), after which the next rejection ends the job | New instance |
| Blocked | Something the gate depends on is unavailable: GAIP outage, Jira or Jenkins down, DLP service down, required context over budget | Hold the attempt; show blocked with the reason; resume when the dependency returns; after the configurable deadline (`PT2H` default) route to a human gate; an authorized approver may override with a typed decision | No |
| Needs human | An agent cannot complete within its assignment and asks a structured question | Persist the `DecisionRequest`, interrupt, route to the declared gate or eligible deciders, issue a fresh assignment with the decision as input | No |
| Expired lease | The CLI stopped renewing | Append lease-expired; return the attempt to the eligible queue unspent; reject any late result under the old lease, keeping it as evidence | No |
| Stale result | Lease expired, attempt superseded, or subject changed before acceptance | Record as rejected; select no edge | No |
| Repeated submission | Same idempotency key | Return the earlier receipt; the ledger contains the result once | No |
| Cancellation | An authorized decision | Reject further results for that run; keep the prior ledger; the CLI stops local work when its next renewal is refused | Ends the run |
| Platform restart | Task replaced or Region failover | Each thread resumes from its last committed checkpoint; a submission that did not commit was never accepted and the CLI resends it with the same key | No |

**Failed-check fingerprints.** A failed check gets a fingerprint from the check, its category, and normalized details; the commit and the model and tool versions are recorded on the attempt but kept out of the fingerprint, so a fix commit or an upgrade does not hide a repeated failure.

**Session supervision outcomes.** The CLI's supervisor reports a stalled session (activity timeout) or an interrupted one (absolute deadline, cancellation, process exit); the platform decides whether the attempt is failed, retried within policy, or routed to a person. A healthy CLI can hold a stalled agent session, and an active agent stream can continue briefly while the CLI renews its lease; both conditions are represented and handled separately; neither is collapsed into one wall-clock timeout.

**External actions that are interrupted.** If a delivery action through GitHub, Jira, Jenkins, or DevNavHub is interrupted, the CLI checks the source system for its correlation identifier before asking the user to try again. A job waiting on a long Jenkins build shows as waiting; the Jenkins verification gate checks the build again. A fact that cannot be confirmed fails the gate; if the source system cannot be reached, the gate is blocked, not failed. Unknown never means passed.

**Recovery.** Aurora uses automated backups and point-in-time recovery; OpenSearch is rebuilt from the ledger and the evidence store; every SQS dead-letter queue has a named owner and a replay procedure; an outbox that cannot reach EventBridge holds events until it can. Recovery tests stop the platform before and after a result commits and stop the CLI before, during, and after a submission; the ledger must contain each accepted result exactly once.

## 13. Evidence, ledger, event bus, and search

This section covers four stores and the rules that keep them consistent: the ledger is the single source of truth, evidence is signed and bound to its subject, an event is published only when its change committed, and search is a view that is re-authorized on every hit.

**Evidence.** Each item is an in-toto statement in a DSSE envelope signed by the platform with a KMS key, naming a subject and a producer. Aurora stores evidence metadata; S3 with KMS encryption, versioning, access logging, lifecycle rules, and Object Lock in compliance mode (2-year retention) stores signed bodies, specifications, check reports, and bounded agent output. Each item carries its own authorization, retention, classification, digest, and subject binding; the ledger references evidence without copying it. When a subject changes, dependent evidence is marked stale, never deleted. The platform-side `evidence` table records per attempt: resolved context references and hashes, Git SHA, CLI path and binary version, selected model and provider, validated structured contract and artifact references, policy version and evaluation inputs for each gate decision, test reports, traces, code diff, approvals, and the event timeline with durations, errors, and resource usage.

**Ledger.** One logical ledger per job: events from every user, CLI, gate, decision, retry, invalidation, and external receipt, with user and session attribution on each event and no per-user ledgers to reconcile. Storage is the append-only hash-chained table in Aurora described in section 6, with a trusted service signing the latest chain position periodically. Database backups, S3 Object Lock, and retained signatures are separate recovery and integrity layers. JSONL files are not on the write path; an archive export subscriber writes sealed JSONL segments with their hashes to S3 under Object Lock, kept 2 years or longer under enterprise retention policy, and the platform never reads them back to decide anything.

**Event bus.** Every platform interaction (job created, gate started, gate skipped, gate blocked, lease claimed, lease expired, result accepted, result rejected, decision recorded, and so on) is written to a transactional outbox in Aurora in the same transaction as the ledger event. An outbox publisher sends events to an Amazon EventBridge custom bus; content-based rules route each event to one SQS queue per consumer, each with a dead-letter queue.

| Consumer | Queue | Purpose |
| --- | --- | --- |
| Kernel worker | resume queue | Load the checkpoint, inject the accepted result or decision, route the next gate |
| Notifications | notify queue | Tell a team when work reaches its queue, a decision is waiting, or a gate is blocked |
| Search indexer | index queue | Write approved event and evidence summaries to OpenSearch |
| Archive export | archive queue | Seal and store JSONL ledger segments |
| Live updates | live queue | Server-sent events to the CLI and web view |
| External subscribers | approved per subscriber | Cross-account delivery through EventBridge rules |

Consumers use the ledger sequence number to ignore duplicates and out-of-order delivery. EventBridge archive allows replay; EventBridge Scheduler runs lease expiry, blocked-gate deadlines, and the OFAC list refresh.

**Search.** The indexer writes approved event and evidence summaries to Amazon OpenSearch Service; each document carries stable access scopes (owning team, participating teams, repository, named participants, support classification). Users never connect to OpenSearch directly: the search API resolves the caller's current entitlements and applies them as server-side filters to hits, counts, suggestions, and aggregations, so counts cannot reveal other teams' records; a selected result is authorized again against Aurora before details or an S3 download link are returned. Search may trail the ledger slightly; the job page reads Aurora directly, shows when the index last processed the job, and offers direct identifier lookup. Useful fields: gate, team, repository, role, commit, pull request, Jenkins job, blocked reason, decision reason, dates, outcome. Sensitive content stays in the evidence object and needs a separate authorized read.

**Read-only web view.** Personal and team queues; each job's current gate, owner, age, and blocked reason; the next role and eligible scope; specifications, decisions, source revisions, pull requests, and build results; skipped gates and the classifier decision behind each; an ordered timeline with each gate instance shown separately; filtered history search; copyable CLI commands for permitted next actions. The interface has no controls that change a job; "continue in terminal" hands the user a command that still needs CLI authentication and platform authorization.

## 14. AWS deployment topology and technology choices

The platform service runs on Amazon ECS on Fargate in us-east-1 with us-west-2 as the recovery Region, across several Availability Zones, as one modular Python service with a small surface: authenticated reads, lease operations, result and decision submission, evidence upload, and the kernel worker. The first release favors AWS managed services the platform team already supports and permissive open-source libraries.

**Request path.** User (CLI or browser) → Ping (OAuth, OIDC) → DevExchange Gateway (enterprise API gateway) → internal Application Load Balancer with AWS WAF → platform API on ECS Fargate (and the read-only web app as static assets in private S3 behind the same ALB) → LangGraph kernel, entitlement and OPA authorization, Aurora (through RDS Proxy), S3, in-platform gates (OPA, built-in evals), managed gates (GAIP including Jev, DLP service, read-only GitHub, Jira, Jenkins). Aurora outbox → EventBridge custom bus → SQS queues (resume, notify, index, archive, live) → kernel worker, notification subscriber, OpenSearch indexer, archive export, server-sent event streams. CLI → GitHub, Jira, Jenkins, DevNavHub under the user's identity.

| Service | Responsibility |
| --- | --- |
| DevExchange Gateway (DXGW) | Enterprise API gateway in front of the platform; SSE support, timeouts, token validation, limits are open decision 10 |
| Internal ALB and AWS WAF | Origin behind DXGW, request limits, network protections; no CloudFront |
| ECS on Fargate | Platform API, LangGraph kernel and worker, platform gates, outbox publisher |
| Aurora PostgreSQL Serverless v2, RDS Proxy | Ledger events, state projections, leases, decisions, evidence metadata, outbox; stable connections |
| S3 with KMS and Object Lock | Signed evidence bodies, bounded agent output, exports, the static web app |
| EventBridge and SQS | Event bus rules, one queue per consumer with a dead-letter queue, archive for replay |
| EventBridge Scheduler | Lease expiry, blocked-gate deadlines, OFAC list refresh timer |
| OpenSearch Service | Entitlement-filtered search over authorized event and evidence summaries |
| KMS | Encryption keys and evidence signing keys |
| CloudWatch and X-Ray | Logs, metrics, traces, alarms, service health |
| AWS CDK in TypeScript | Infrastructure code, following the approved infrastructure pattern |

**Managed systems and how the platform reaches them**

| Managed system | Use | Reach |
| --- | --- | --- |
| Gen-AI Platform (GAIP) | Model calls for platform gates, including the Jev decision classifier and OFAC screening | Private network, restricted by network ACLs and security groups (no PrivateLink) |
| GitHub | Pull request, commit, and check facts | github.com organization over the internet through the egress allowlist, with a GitHub App |
| Jira | Issue facts | Internally hosted in AWS, private network, service account |
| Jenkins One Pipeline | Build facts | Service account |
| DLP service | Personal data and credential detection before GAIP calls | Placeholder name until the enterprise service is chosen |

OFAC screening calls GAIP; OPA evaluation runs inside the platform; neither is a managed system in its own right.

**Technology choices (free and open-source first)**

| Need | Choice | License | Reason |
| --- | --- | --- | --- |
| Orchestration kernel | LangGraph open-source Python library | MIT | Durable graphs, `interrupt()` and resume, conditional edges, retry policies; no LangGraph Platform or Server |
| Service runtime | Python on ECS Fargate | - | Runs LangGraph and the generated Pydantic types in one language with the API |
| Policy | Open Policy Agent and Rego | Apache 2.0 | One engine for request authorization and policy gates |
| Edge conditions | CEL (cel-python or the Go evaluator behind a small service) | Apache 2.0 | Side-effect-free, type-checked, auditable routing |
| Contracts | JSON Schema 2020-12, JCS (RFC 8785), generated TypeScript and Pydantic | - | Language-neutral, canonical digests |
| Evidence format | in-toto statements in DSSE envelopes, signed with KMS | Apache 2.0 | Stable subject and producer model with standard signing |
| Evidence objects | S3 with Object Lock in compliance mode | - | Versioned, encrypted, retained internal storage |
| Run state and records | Aurora PostgreSQL Serverless v2 with the ledger checkpointer | - | Transactions, append-only ledger, conditional lease inserts |
| Event bus | Transactional outbox, EventBridge, SQS | - | Committed events only, content-based rules, archive and replay |
| Search | OpenSearch Service | - | Searchable summaries with server-enforced scope filters |
| Repository intelligence | Tree-sitter grammars; language-server metadata where available | MIT | Symbol-level index built outside the model path, cached per Git SHA |
| Local agent access | Claude Agent SDK and Codex SDK adapters pointed at managed binaries, plus a subprocess adapter | vendor SDK licenses | Bounded adapters to the developer's approved local agent tool |
| CLI | TypeScript or Go, signed binary (open decision 12 covers distribution) | - | One signed client, machine-oriented JSON and NDJSON |

Apache 2.0, MIT, BSD, and similar permissive licenses are the preferred set; exact versions and dependency trees go through normal enterprise review.

## 15. Delivery sequence, pilot scope, acceptance and test plan

Six stages, each with a concrete proof, take the design from contracts to a multi-user pilot that stops at an approved pull request with a confirmed Jenkins result.

| Stage | Build | Accepted when |
| --- | --- | --- |
| 1 Contracts and graph compilation | Gate Pack, gate definition, `GateAssignment`, `GateResult`, `ContextManifest`, `DecisionRequest`, ledger event, and CLI envelope schemas; pack validation; compilation to a `StateGraph`; CEL edge conditions; per-gate retries; rework paths; `skippable` and ownership checks; invalidation | Two Gate Packs compose the same reusable gates into different valid graphs; an undeclared backward edge is rejected before a run starts |
| 2 Local CLI and local record | CLI as the I/O path for agent gates: custom agent profiles, runtime adapters, provider-side structured output, schema validation, local evals, event streaming, three-clock supervision, DLP and prompt-injection filtering at both boundaries | A malformed or prose-wrapped agent result cannot advance; a healthy stream is not cut by the activity timeout but cannot exceed the absolute deadline |
| 3 Shared coordination | Ledger checkpointer on Aurora, Gate Pack pinning, leases with expiry, assignment publishing, interrupt and resume for agent and human gates, blocked-gate handling and overrides, outbox and EventBridge, notifications, conflict handling, archive export | Two users on different machines continue one job; the database role cannot update or delete ledger events; a restarted task resumes from the last checkpoint; a repeated submission has one effect; an unauthorized user cannot discover, claim, submit, or decide |
| 4 Platform gates | Jev decision classifier in GAIP, one GAIP eval gate, one OPA policy gate, one OFAC screening gate that calls GAIP, DLP service integration, model router | Each gate records its model profile and resolved GAIP model; OPA and OFAC evidence stay separate; a GAIP outage blocks instead of failing and spends no attempt |
| 5 Delivery evidence | GitHub and Jenkins facts bound to exact subjects through read-only platform gates; CLI connectors for user-authenticated actions with correlation identifiers | Jenkins success for a different commit cannot pass; a new commit makes earlier evidence stale, not missing |
| 6 Multi-user pilot | Selected teams run work through the 13-gate pack from intent to Jenkins verification | Measured queue wait, lease conflicts and expiries, gate duration, stalled sessions, retries, blocked time, rework cycles, skipped gates, invalidations, schema failures, evidence staleness, human interventions |

**Pilot boundaries.** The pilot authorizes a limited service implementation for selected teams and repositories. It does not authorize production deployment by agents, a general workflow language, an open plugin marketplace, arbitrary server-side code, hosted models or agent sessions, calls from the CLI to GAIP, a universal regulatory framework, a replacement deployment system, or every possible adapter. Production release support needs a later decision based on the pilot's security, recovery, and operating evidence.

**Pilot acceptance scenarios**

1. A product manager creates and approves an intent; an engineer on another machine implements it; a reviewer on a third machine approves the exact passing commit.
2. Two eligible engineers claim the same assignment at once; one receives the lease.
3. A user outside the owning and participating teams cannot view the job through a queue, direct lookup, search, counts, or an evidence link.
4. Jenkins reports success for a different commit; the Jenkins verification gate does not pass.
5. A new commit arrives after checks and review; earlier evidence stays in the ledger and becomes stale.
6. A client disconnects; its lease expires; another eligible engineer claims the same attempt and continues.
7. The CLI submits the same result twice; the ledger contains it once.
8. The classifier finds no regulatory content, sensitive data, or sanctions exposure; gates 8 to 10 are skipped and each skip is visible with its cause.
9. A reviewer rejects the specification with requested changes; `specification@2` receives them, downstream gates run as new instances, and the rejection is visible in the timeline.
10. Implementation fails twice; the job routes to a human gate instead of trying a third time.
11. GAIP is unavailable during a platform gate; the gate shows blocked with the reason, spends no attempt, and continues when GAIP returns.
12. The platform is unreachable during local work; the CLI finishes the attempt and submits it when the platform returns.
13. OpenSearch is unavailable; current work remains usable and the index catches up after recovery.
14. A job reaches a team queue and the team receives a notification.
15. An agent returns `needs_human` with a structured question; the decision is recorded and the fresh assignment carries it as typed input.

**Test plan by area**

| OPAArea | Tests |
| --- | --- |
| Kernel | Every accepted and rejected submission; cancelled run accepts no new results; stale approval cannot pass a current gate; late result under an expired lease is rejected; one idempotency key has one effect; projections rebuilt from events match the live projection; contract tests against each LangGraph upgrade |
| Ledger | Database role cannot update or delete; hash chain detects a changed event; archive segments match the ledger |
| Routing | Each label combination yields exactly the expected gates; `skippable: false` always runs; every skip records its cause |
| Retry, blocked, rework | Pack default and per-gate overrides; transient errors do not count; exhaustion routes to a human gate; blocked attempts are not spent and resume on recovery; rework creates new instances for the target and every changed downstream gate; `max_rework_cycles` ends the job |
| Authorization | Each action across creator, contributor, reviewer, team member, unrelated user, support operator, product team administrator, platform manager, administrator; missing Entra claims, expired tokens, altered audience, guessed identifiers, expired leases, separation-of-duty conflicts, product team changing a default gate |
| Leases | Simultaneous claims, renewal, release, expiry, reclaim, disconnected client |
| Connectors and platform gates | Success, terminal failure, transient error, malformed response, timeout, wrong repository, wrong source commit, wrong Jenkins job; user credentials stay on the user's device; receipts carry correlation identifiers |
| Filtering | Context with credentials, personal data, and embedded instructions is blocked or flagged before the local agent tool, before GAIP, and before upload |
| Recovery | Platform stopped before and after a commit; CLI stopped before, during, and after a submission; each accepted result exactly once |
| Search | Hits, totals, suggestions, aggregations, and evidence links stay in scope; deleted index rebuilt from the ledger and S3 |
| Adapters | Each adapter against each approved managed binary version; subprocess fallback parity |

## 16. Risks, open decisions, and next steps

The design limits what a compromised or faulty component can do, but several external dependencies and unconfirmed enterprise capabilities carry risk until the pilot proves them.

| Risk | Response |
| --- | --- |
| A compromised platform exposes or falsifies records | Delivery-system access is read-only; encryption, OPA authorization, hash chains, signed evidence, Object Lock, and complete access records limit and expose misuse |
| A modified or disconnected CLI | Only signed clients at a supported version are accepted; results bind to the current user and lease; GitHub and Jenkins facts are confirmed with the source system |
| The classifier mislabels work and skips a gate that should have run | Every skip records the classifier decision; only `skippable: true` gates can be skipped; hard-control gates (repository policy, Jenkins verification) are not skippable; the pilot samples skipped jobs for review |
| Jev runs in GAIP, so a GAIP outage blocks classification | Blocked gates spend no attempt and resume; the owner has named the OpenAI decisions API on Bedrock as a fallback once available (unverified) |
| LangGraph's checkpointer interface changes | The ledger format is owned by specops; contract tests run against each upgrade before it ships |
| DXGW cannot hold long-lived server-sent event streams or has short request timeouts | The CLI and web view fall back to polling job events |
| A user working offline finishes after the lease expired | The platform rejects the late result; if the work is still open the user claims a new lease and resubmits; if someone else took it, the user reconciles locally |
| OpenSearch document filters are misconfigured | No direct domain access; the search API builds filters from trusted entitlements; detail reads re-check Aurora; security tests cover counts and suggestions |
| Evidence volume grows faster than expected | Structured summaries in the ledger, large objects in S3 with record-class lifecycle policies after retention, index limited to discovery fields |
| Vendor SDK and enterprise-pinned binary drift | Subprocess adapter as a supported fallback; adapter compatibility tests per approved binary version |
| Context resolver misses a mandatory standard | Mandatory items are rule-selected and listed in the manifest; a missing applicable rule is a pack validation or resolver test failure, not a runtime surprise |
| Raptor looks attractive before its fit is known | Evidence stays behind an internal storage interface; any later move needs a separate evaluation and migration proof |

**Open decisions** are consolidated as ADR-012 in the companion record set (20 items with the stage each blocks); each needs an owner, a due date, and a recorded outcome before the related integration enters the pilot.

**Measurement from the ledger.** Time waiting for each role; lease expiry and reclaim; attempts and agent usage per accepted pull request; gates skipped by classification, by gate; check failures and repeated failure fingerprints; rejections by reason code and rework target, rework cycles per job; runs that reach an approved change compared with runs that stop, grouped by failure condition; stale evidence and stale approval rejections; reviewer changes after agent review; client-reported facts a platform gate could not confirm; cancellation and blocked time. Operators also need views for API health, Aurora connections, rejections by reason, active and expired leases, blocked gates by dependency, outbox lag, dead-letter depth, managed system errors, index lag, and client version distribution.

**Next steps**

- [ ] Review the ADR set; confirm or amend the three Proposed records (ADR-007 context resolver, ADR-011 agent outcomes, the `intent` gate in ADR-003).
- [ ] Assign owners and due dates to the 20 open decisions; close items 2, 4, 7, 10, and 12 before stage 2 starts.
- [ ] Author the schema bundle (stage 1) and the first-release 13-gate Gate Pack with its CEL conditions and rework paths.
- [ ] Confirm GAIP's request API, authentication, and IP ranges, and the DLP service, before stage 4.
- [ ] Stand up the pilot environment with CDK and run the recovery and authorization test suites before any trial team is onboarded.
