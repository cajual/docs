# specops MVP Design Specification

It'sNov 6, 2026 · @Dav

## 1. What the MVP proves

The MVP is the smallest build that exercises every contract in the architecture on one machine. It runs the kernel as a localhost server, the CLI as a client of that server, one real local agent session per agent gate, and in-process stand-ins for every AWS service, through the same code paths that will run on Fargate. A prototype built on it tests the design instead of discovering it.

**The MVP proves**

| Claim | How the MVP shows it |
| --- | --- |
| A Gate Pack written in the definition language compiles to a LangGraph graph and validation rejects a bad one | Two packs compile; a third with an undeclared backward edge, an unknown kind, or a skip on a non-skippable gate is refused with a named rule |
| Every gate kind runs through one node contract | The 13-gate delivery pack runs end to end with stub managed systems and one real local agent tool |
| The identifier scheme resolves every name in a definition to concrete data | `specops resolve <id>` prints the registry entry and the digest for any identifier in a pack |
| The ledger is the checkpointer | A run interrupted at a human gate survives a kernel restart and resumes from SQLite; the event table has no update path |
| Leases, idempotency, and rework behave as specified | Two CLI processes claim the same attempt; one wins. A result submitted twice lands once. A rejection creates `implementation@2` and re-runs downstream gates |
| The CLI is an I/O path, not a decider | A prose-wrapped agent result cannot advance; the platform's acceptance transaction is the only thing that moves the graph |

**The MVP leaves out**

- Ping, Entra, DXGW: a local identity provider issues signed tokens with a subject and groups, and the API validates them with the same code it will use against Ping.
- GAIP, OFAC lists, DLP service: stub HTTP services that return fixed, schema-valid responses and record what they were asked.
- GitHub, Jira, Jenkins: a local Git remote stands in for GitHub; Jira and Jenkins are stub fact services.
- Aurora, S3, EventBridge, SQS, OpenSearch, KMS: SQLite, a local directory, an in-process bus with durable queue tables, SQLite full-text search, and a local signing key, each behind the same interface the cloud backend implements.
- The read-only web view, archive export, and notifications: deferred; `specops job events` is the status page.

None of these substitutions changes a contract, a schema, or a kernel rule. The cloud build replaces backends and leaves the kernel as it is.

## 2. Kernel runtime

The kernel is one Python process that can run as a localhost server on a laptop or as two ECS task types on Fargate, with no change to kernel code. What differs between the two is the set of backend implementations bound at startup, chosen by a profile.

&#91;embedded content: kernel runtime · one process, ten backend ports, two profiles\]

**One process, four roles.** The platform service is a FastAPI application that hosts four roles: the API (authentication, authorization, leases, the acceptance transaction, queues, reads, server-sent events), the kernel worker (Gate Pack compiler, LangGraph scheduler, routers, gate executor, resume-queue consumer), the outbox publisher, and the timer (lease expiry, blocked-gate deadlines, OFAC refresh). On Fargate the API and the worker run as separate task definitions from the same image, each started with a role flag (`specops-platform --role api`, `--role worker`); the publisher and timer ride with the worker. Locally, `specops-platform --role all` runs every role in one process with one asyncio loop. In both deployments the roles share state only through the ledger and the bus and never call each other, so splitting them across tasks changes no code path.

**Backend ports.** Every external dependency is a Python protocol with two implementations. The kernel imports the protocol, never a backend.

| Port | Local backend | AWS backend | What the kernel calls |
| --- | --- | --- | --- |
| `LedgerStore` | SQLite, WAL mode | Aurora PostgreSQL via RDS Proxy | `append(events, outbox) -> receipt` in one transaction; `read_projection(job)`; `checkpoint_get/put` for LangGraph |
| `LeaseStore` | SQLite | Aurora | \`claim(attempt, user, ttl) -> lease |
| `EvidenceStore` | Local directory | S3 Object Lock | `put_url(evidence_id) -> upload target`; `head(evidence_id) -> digest`; `get_url` |
| `EventBus` | In-process dispatcher over durable queue tables | EventBridge | `publish(event)` |
| `QueueConsumer` | SQLite queue table with visibility timeout | SQS with DLQ | `receive(queue) -> message`; `ack`; `nack` |
| `SearchIndex` | SQLite FTS5 | OpenSearch | `index(summary)`; `query(text, scopes)` |
| `Signer` | Local Ed25519 key | KMS asymmetric key | `sign(statement) -> DSSE envelope`; `verify` |
| `IdentityVerifier` | Dev IdP (local JWKS) | Ping JWKS, Entra group claims | `verify(token) -> subject, groups` |
| `Clock` | Controllable in tests | Wall clock | `now()` |
| `ManagedSystem` (one per system) | Stub HTTP services | GAIP, DLP, GitHub App, Jira, Jenkins clients | `call(request) -> response, receipt` |

**Running on a laptop.** The command `specops-platform --role all --profile local` listens on `http://127.0.0.1:8470`, and the CLI talks to it exactly as it will talk to DXGW, with `SPECOPS_PLATFORM_URL` pointing at it. The dev identity provider issues tokens for `specops auth login --dev-user alice --groups team-a,repo-x`; the API validates them with the same JWKS path it uses for Ping. The local profile is the development and CI profile for the platform's own test suite as well, so the acceptance transaction, lease conflict, and rework tests run against SQLite in seconds and against Aurora in the pipeline.

**LangGraph inside the process.** Each compiled Gate Pack is a `StateGraph` compiled once per pack digest and cached. The checkpointer is the `LedgerStore`'s `checkpoint_get/put`, so a thread's state is a ledger projection. The worker consumes the resume queue; on each message it loads the thread by run identifier, injects the accepted result into state, and calls `graph.invoke` until the next `interrupt()` or terminal node. One worker handles many runs because a paused run holds no memory.

**Process boundaries that stay fixed.** The local agent tool runs under the CLI, never under the platform, in both profiles. The CLI is a separate binary in both profiles. Stub managed systems are separate local processes (started by `specops-platform --with-stubs`), so the platform's clients exercise real HTTP.

## 3. Identifiers and the resolution model

Every name in a definition is a key into a registry, and every registry entry resolves by the same rule to one immutable document with a digest. A name such as `code-review/fast-v2` is therefore a lookup key, the registry entry it names is the data, and the entry's digest is what the ledger records.

**Identifier grammar.** `<registry>:<name>/<version>` with an optional `@<digest>` pin.

| Part | Rule | Example |
| --- | --- | --- |
| registry | One of the fixed registry names in the table below | `model-profile` |
| name | Lowercase, digits, `-`, `.` and `/` for grouping; never spaces; 1 to 96 characters | `code-review`, `delivery/implementation` |
| version | `v` plus an integer for schemas and kinds; a semantic version or a free label for profiles and templates | `v1`, `fast-v2`, `standard-v3` |
| digest | `sha256:` and 64 hex characters, JCS over the registry entry; optional when writing, always present once resolved | `@sha256:9f3c…` |

A short form drops the registry prefix when the field already fixes it: `model_profile: code-review/fast-v2` is complete because the field type is `model-profile`. The pack compiler expands every short form to the full identifier and pins the digest, so the compiled pack carries only full, pinned identifiers.

**Registries.** A registry is a Git directory of YAML or JSON entries, one file per name and version, validated against the entry schema for that registry. The platform loads registries at startup and on publish; the CLI receives the subset a Gate Pack pins as the schema bundle.

| Registry | Entry schema | What an entry holds | Who may publish |
| --- | --- | --- | --- |
| `schema` | JSON Schema 2020-12 | A contract: `GateAssignment/v1`, `implementation-result/v1` | Platform manager team; product teams for their own output contracts |
| `kind` | `GateKind/v1` | The executor binding and the fields a gate of this kind must declare | Platform administrators |
| `gate` | `GateDefinition/v1` | One gate: kind, faces, context, limits, policy, evidence, ownership | Platform manager team for defaults; product teams for custom gates |
| `pack` | `GatePack/v1` | Gates, edges, rework paths, budgets | Product teams; validated and compiled on publish |
| `agent-profile` | `AgentProfile/v1` | Instructions, runtime adapter, sandbox and capability profile, allowed tools and MCP servers, skills | Platform manager team; product teams within allowed bounds |
| `model-profile` | `ModelProfile/v1` | Capability need and routing policy, resolved at run time to a model | Platform manager team |
| `route` | `MessageRoute/v1` | For a work type and message type: contracts, template, destinations | Platform manager team |
| `context-template` | `ContextTemplate/v1` | Which context classes, selectors, exclusions, and budgets apply | Platform manager team; product teams for their components |
| `policy` | OPA bundle manifest | Rego bundle reference and version | Platform manager team; product teams for custom policy |

Five smaller registries hold the entries that profiles and kinds reference by id and that section 7 and section 9 describe: `instruction` (harness instruction layers), `hook` (harness hooks), `skill`, `mcp` (approved MCP server definitions), and `command-set` (command allowlists), together with the `eval`, `command`, and `watch` sub-registries owned by the platform manager team. They follow the same identifier grammar and the same resolution rule.

**Resolution happens at three moments, all of them outside the agent session.**

1. **Pack publish.** The compiler resolves every identifier in the pack and its gates to a registry entry, checks the entry's schema, pins the digest, and records the full closure (pack, gates, kinds, schemas, profiles, routes, templates, policies) as the pack's bill of materials. A run pins that closure. If an entry is later changed, a new version is published; the running pack still sees the pinned digest.
2. **Assignment build.** When the scheduler reaches a gate, it reads the pinned entries, resolves the ones that depend on run state (the model profile against current availability, the context template against the job's component and Git SHA), and writes the resolved values and their digests into the `GateAssignment`. The CLI therefore receives resolved values and has no registry to consult.
3. **Acceptance.** The acceptance transaction re-resolves the assignment's pinned schema digest to validate the `GateResult`, so a result is always checked against the same contract its assignment named.

`specops resolve model-profile:code-review/fast-v2` prints the entry, its digest, and for a given job the model it resolved to and why. `specops pack bom <pack>` prints the full pinned closure.

**Three layers, kept apart.**

| Layer | What it is | Example | Where it lives |
| --- | --- | --- | --- |
| Schema | The shape data must have | `implementation-result/v1`: required `changed_paths`, `commit`, `task_results[]`, `findings[]` | `schema` registry; JSON Schema |
| Definition | A named, versioned configuration that references schemas and other definitions | gate `delivery/implementation/v1` names output schema `implementation-result/v1`, agent profile `implementer/standard-v1`, context template `component-change/v2` | `gate`, `pack`, `*-profile`, `route`, `context-template` registries; YAML |
| Instance data | A document produced during a run that conforms to a schema and carries the digests of the definitions that produced it | `GateResult` for `ATT-517`, with `output` valid against `implementation-result/v1@sha256:…` and `definition_digests` listing the gate, profile, and template digests | Ledger and evidence store; JSON |

Definitions hold no instance data, and instance documents hold no definitions, only the identifier and digest of each definition that applied. Because of that separation a replayed attempt can be compared with the original, and an audit can re-evaluate a decision against the exact policy and template in force at the time.

## 4. Gate Definition Language

A gate definition is a YAML document validated against `GateDefinition/v1`. It is declarative: it names what the gate is, what goes in and out, what it may use, and how its outcomes map to edges. Anything executable is reached by reference, so a kind binds to an executor, a policy to a Rego bundle, and an eval to a registered built-in, and the definition itself holds no code.

**Structure.** Eight top-level blocks, in this order so a reader meets identity first and routing last.

| Block | Required | Holds |
| --- | --- | --- |
| `gate` | yes | `id`, `version`, `kind`, `display_name`, `purpose`, `owner` (scope and whether this is a default gate), `work_type` |
| `faces` | yes | `input`: schema reference for the assignment payload; `output`: schema reference for the result payload; `subject`: the subject type this gate evaluates |
| `context` | agent gates | `template`: a context-template reference; `overrides`: include and exclude lists allowed by the template; `budgets` |
| `execution` | yes | kind-specific binding: `agent_profile` and `model_profile` for agent gates; `model_profile` for GAIP gates; `policy` for OPA gates; `eval` for built-in evals; `wait_for` for wait gates; `handoff` and `decomposition` flags; `limits` (startup, activity, absolute, output size, usage) |
| `evidence` | yes | `required`: evidence types that must accompany a passing result; `capture`: what the CLI or executor records; `subject_binding`: which fields bind the result to the subject |
| `policy` | yes | `retry.max_attempts`; `blocked.deadline`; `blocked.human_gate`; `skippable`; `exhaustion.human_gate`; `invalidate_on`: subject changes that mark this gate's results stale |
| `authorization` | yes | `eligible_roles` to claim; `decider_roles` for human gates; `separation_of_duty` rules |
| `outcomes` | yes | For each result status, the edge label the pack may bind: `passed`, `failed`, `blocked`, `needs_human`, `cancelled`, plus named sub-outcomes a CEL edge may read (`labels`, `severity`) |

**An annotated example: the delivery pack's implementation gate.**

```yaml
gate:
  id: delivery/implementation          # registry name; full id is gate:delivery/implementation/v1
  version: v1
  kind: agent                     # kind:agent/v1; fixes which execution fields are legal
  display_name: Implementation
  purpose: Produce the source change the approved specification describes.
  owner:
    scope: product-team/payments  # who may edit this definition
    default_gate: false           # true only for platform-manager-owned gates
  work_type: implementation       # key the message router uses

faces:
  input: schema:implementation-input/v1
  output: schema:implementation-result/v1
  subject: specification          # this gate evaluates a specification digest

context:
  template: context-template:component-change/v2
  overrides:
    include: [approved_specification, prior_findings]
    exclude: [prior_agent_transcripts]
  budgets:
    max_files: 60
    max_tokens: 120000

execution:
  agent_profile: agent-profile:implementer/standard-v1
  model_profile: model-profile:code-implementation/standard-v2
  decomposition: per_task         # one session per task in the specification
  handoff: human_checkpoint       # CLI pauses for review before submit
  limits:
    startup: PT2M
    activity: PT10M
    absolute: PT8H
    output_bytes: 2000000

evidence:
  required: [context_manifest, git_diff, task_results, structured_result]
  capture: [session_events, local_eval_reports]
  subject_binding:
    base_commit: from_assignment
    result_commit: from_git

policy:
  retry:
    max_attempts: 2
  blocked:
    deadline: PT2H
    human_gate: gate:delivery/engineering-escalation/v1
  skippable: false
  exhaustion:
    human_gate: gate:delivery/engineering-escalation/v1
  invalidate_on: [specification, base_commit]

authorization:
  eligible_roles: [engineer]
  separation_of_duty:
    - rule: claimant_not_in
      roles: [reviewer_of_same_job]

outcomes:
  passed: [implemented]
  failed: [retry]
  blocked: [hold]
  needs_human: [decision]
  readable_by_edges: [output.findings.max_severity, output.task_results.count]
```

**Validation rules** (each has a stable rule id the compiler prints):

| Rule | Check |
| --- | --- |
| `GD001` | `kind` resolves to a registered kind, and only the execution fields that kind allows are present |
| `GD002` | `faces.input` and `faces.output` resolve to schemas; the output schema declares a `status` enum matching the five statuses |
| `GD003` | Every profile, template, policy, and human-gate reference resolves and its entry is published |
| `GD004` | `skippable: true` is set only when `owner.default_gate` is true and the publisher holds the platform manager role, or when the gate is a custom gate owned by the publisher |
| `GD005` | A gate whose `policy.exhaustion.human_gate` or `blocked.human_gate` is absent fails unless `kind` is `human` |
| `GD006` | `limits.absolute` is set and greater than `limits.activity`, which is greater than `limits.startup` |
| `GD007` | `evidence.required` is non-empty and every entry is a registered evidence type |
| `GD008` | `outcomes` lists every status and `readable_by_edges` names paths that exist in the output schema |
| `GD009` | `decomposition: per_task` requires the input schema to declare a `tasks[]` array |
| `GD010` | `handoff: human_checkpoint` is set only on agent gates |

## 5. Gate Pack definition

A Gate Pack composes gate references into a graph. Apart from the per-pack overrides a gate definition permits, it holds no gate configuration of its own. The pack compiles to a LangGraph `StateGraph` whose nodes are gate identifiers and whose conditional edges are CEL expressions.

**Structure**

| Block | Holds |
| --- | --- |
| `pack` | `id`, `version`, `display_name`, `owner.scope`, `budgets.max_rework_cycles`, `defaults.max_attempts` |
| `gates` | Ordered list of `{ ref, as }`: a gate reference and the node name used in this pack; the same gate may appear twice under different names |
| `entry` | The node name where a run starts |
| `edges` | List of `{ from, to, when }`: `when` is a CEL expression over the from-node's accepted output and the job's labels; omitted means unconditional |
| `rework` | List of `{ from, to, max_cycles }`: the only backward edges; `from` must be a human gate or a gate whose outcomes include `rework` |
| `terminal` | Node names whose `passed` ends the run |
| `overrides` | Per-node overrides a gate definition marks overridable: `max_attempts`, `blocked.deadline`, `limits.absolute` |

**Annotated example: the delivery pack, abridged to its first nine gates.**

```yaml
pack:
  id: delivery/spec-driven-delivery
  version: v1
  display_name: Spec-driven delivery
  owner:
    scope: product-team/payments
  budgets:
    max_rework_cycles: 3
  defaults:
    max_attempts: 2

gates:
  - { ref: gate:delivery/intent/v1,               as: intent }
  - { ref: gate:delivery/intent-review/v1,        as: intent_review }
  - { ref: gate:default/work-classification/v2, as: classify }
  - { ref: gate:delivery/specification/v1,        as: specification }
  - { ref: gate:delivery/specification-review/v1, as: spec_review }
  - { ref: gate:delivery/implementation/v1,       as: implementation }
  - { ref: gate:delivery/source-verification/v1,  as: source_verify }
  - { ref: gate:default/repository-policy/v3, as: repo_policy }
  - { ref: gate:default/regulatory-content/v1, as: regulatory }

entry: intent

edges:
  - { from: intent,          to: intent_review }
  - { from: intent_review,   to: classify,        when: "decision.outcome == 'approved'" }
  - { from: classify,        to: specification }
  - { from: specification,   to: spec_review }
  - { from: spec_review,     to: implementation,  when: "decision.outcome == 'approved'" }
  - { from: implementation,  to: source_verify }
  - { from: source_verify,   to: repo_policy }
  - { from: repo_policy,     to: regulatory,      when: "'regulatory_content' in job.labels" }
  - { from: repo_policy,     to: pr_review,       when: "!('regulatory_content' in job.labels)" }

rework:
  - { from: intent_review,   to: intent,          max_cycles: 2 }
  - { from: spec_review,     to: specification }
  - { from: pr_review,       to: implementation }

terminal: [jenkins_verify]

overrides:
  implementation:
    limits.absolute: PT12H
```

**How the compiler reads it.**

- Each `gates[]` entry becomes a node whose function is the kind's executor, closed over the pinned gate definition. The node name is the `as` value; the gate instance name in the ledger is `<as>@<n>`.
- Each `edges[]` entry becomes a conditional edge. The `when` expression is compiled with the CEL type-checker against a declared environment: `output` (the from-gate's output schema), `decision` (for human gates), `job.labels` (set by the classifier), and `pack.values`. An expression that references a path outside that environment fails `GP004`.
- Each `rework[]` entry becomes an edge from the from-node's `needs_human` or `rejected` outcome to the target node, guarded by the job's remaining rework budget. The compiler verifies that removing all rework edges leaves a DAG (`GP002`) and that every rework target is upstream of its source (`GP003`).
- Every node's `passed` outcome must have at least one outgoing edge or be terminal (`GP005`); every `failed` goes to the retry policy, not to an edge; `blocked` and `needs_human` route by the gate's own policy.
- The compiler emits the bill of materials (section 3) and the compiled graph digest, and stores both beside the pack digest. A run pins all three.

**Per-task decomposition is not in the pack.** The pack sees one `implementation` node. The CLI's workbook loop (section 10) is inside the attempt; the platform sees one attempt with task sub-results as evidence. The graph stays small and the status page stays readable.

## 6. Alpha schema catalog

Twelve schemas cover the MVP. Each is a JSON Schema 2020-12 document in the `schema` registry with `additionalProperties: false` on core objects and an optional `extensions` object for namespaced additions. Digests are JCS. Every instance document carries `schema` (its identifier with digest) as its first field.

**Common fields.** Every instance of a run-scoped schema carries `job_id`, `run_id`, and where it applies `gate_instance` (`<node>@<n>`), `attempt_id`, and `definition_digests` (a map of registry identifier to digest for every definition that shaped the document).

| Schema | Produced by | Consumed by | Key fields beyond the common set |
| --- | --- | --- | --- |
| `GateKind/v1` | Platform administrators | Compiler | `id`, `executor` (Python entry point), `location` (agent, platform, human), `required_execution_fields[]`, `allowed_execution_fields[]`, `produces_evidence[]` |
| `GateDefinition/v1` | Gate authors | Compiler, scheduler | The eight blocks of section 4 |
| `GatePack/v1` | Pack authors | Compiler | The seven blocks of section 5 |
| `CompiledPack/v1` | Compiler | Scheduler, `specops pack bom` | `pack_digest`, `graph_digest`, `bill_of_materials{}`, `nodes[]`, `edges[]`, `rework[]`, `validated_at` |
| `GateAssignment/v1` | Scheduler | CLI, executor | `assignment_id`, `assignment_digest`, `subject{type,id,digest}`, `input` (valid against the gate's input schema), `agent_profile` (resolved entry), `model` (resolved for agent gates: provider, model, reasoning), `context_manifest_digest`, `limits{}`, `allowed{paths[],commands[],tools[]}`, `eligible_scope{roles[],teams[]}`, `lease{}` once claimed, `schema_bundle_digest` |
| `ContextManifest/v1` | Platform resolver | CLI resolver | `template` (identifier and digest), `references[]` each `{class, ref, digest, mandatory}`, `rule_ids[]`, `allowed_paths[]`, `prior_findings[]`, `budgets{}`, `manifest_digest` |
| `GateResult/v1` | CLI, executor, API | Acceptance transaction, scheduler | `status` (passed, failed, blocked, needs\_human, cancelled), `output` (valid against the gate's output schema), `failures[]` from the failure taxonomy, `evidence[]` `{type, id, digest}`, `findings[]` `{kind, severity, location, description, suggested_action}`, `decision_request{}` when `needs_human`, `runtime{cli_version, adapter, binary_version, model_reported}`, `session{provider_session_id, turns, started_at, ended_at, usage{}}`, `local_evals[]`, `expected_ledger_position`, `idempotency_key` |
| `DecisionRequest/v1` | Kernel broker, agent via result | Human gate, decider queue | `kind` (question, approval, override), `reason_code`, `question`, `options[]`, `evidence_refs[]`, `eligible_deciders{}` |
| `Decision/v1` | API on a human's call | Scheduler, ledger | `decider_subject`, `decided_at`, `subject_digest_reviewed`, `outcome` (approved, rejected, override), `reason_codes[]`, `comments`, `requested_changes[]`, `rework_target` or `end_job: true` |
| `Lease/v1` | Lease store | API, CLI | `lease_id`, `attempt_id`, `holder_subject`, `issued_at`, `expires_at`, `renewal_interval`, `kind` (work, decision) |
| `LedgerEvent/v1` | Ledger store | Projections, search, archive | `seq`, `prev_hash`, `hash`, `event_type`, `actor{type,id}`, `occurred_at`, `received_at`, `correlation_id`, `causation_id`, `subject{}`, `payload_ref{}`, `authz_ref`, `policy_version`, `versions{cli,pack,model_profile}`, `display_reason` |
| `EvidenceStatement/v1` | Signer on acceptance | Evidence store, audit | in-toto statement: `_type`, `subject[]`, `predicateType` (one per evidence type), `predicate{producer, method, result, reason, observed_at, source_ids{}, model, policy_version}`; wrapped in a DSSE envelope |

**Gate-specific output schemas** are ordinary entries in the `schema` registry, named by work type: `intent-result/v1`, `specification-result/v1`, `implementation-result/v1`, `findings-result/v1` (reviews and verification), `classification-result/v1`, `policy-evaluation-result/v1`, `screening-result/v1`, `fact-result/v1` (GitHub and Jenkins observations), `test-report/v1`, `mutation-report/v1`. The MVP ships the first eight with the delivery pack; `test-report` and `mutation-report` arrive with the delivery segment.

**The failure taxonomy** is one enum shared by `GateResult.failures[].code`, CLI exit codes, and the NDJSON `command.completed` event: `schema_invalid`, `eval_failed`, `evidence_missing`, `subject_mismatch`, `lease_expired`, `lease_conflict`, `unauthorized`, `dependency_unavailable`, `timeout_activity`, `timeout_absolute`, `cancelled`, `filter_blocked`, `contract_incompatible`, `internal`. Exit code groups: 0 success, 10 to 19 contract and validation, 20 to 29 authorization and lease, 30 to 39 dependency and timeout, 40 to 49 filtering, 90 to 99 internal.

**Versioning.** A schema version is immutable once published. A compatible addition (new optional field) ships as a new version with a `compatible_with` list; the compiler accepts a pack whose gates reference any version in a result schema's compatible set. A breaking change is a new version with no compatibility claim, and packs that reference the old version keep running until republished.

## 7. Kind registry

A kind is the binding between a gate definition and the code that executes it. Kinds are the only place code is named, and only platform administrators publish them. Every executor implements one interface: `execute(assignment, state) -> GateResult | Interrupt`.

| Kind | Location | Executor (Python entry point) | Required execution fields | Produces evidence |
| --- | --- | --- | --- | --- |
| `agent/v1` | agent | `specops.executors.agent:AgentGate` publishes the assignment and interrupts; the CLI does the work | `agent_profile`, `model_profile` (may be `none`), `limits` | context\_manifest, session\_events, structured\_result, plus what the gate declares |
| `tool/v1` | agent or platform | `specops.executors.tool:ToolGate` runs a registered command or service call; at agent location the CLI runs it | `command` (registered command id) or `service` (managed-system call), `wait_for` for watch mode, `limits` | command\_output, receipt |
| `decision_classifier/v1` | platform | `specops.executors.classifier:ClassifierGate` calls the Decision API through the model router | `model_profile`, `label_set` | classification\_result, model\_receipt |
| `opa_policy/v1` | platform | `specops.executors.opa:PolicyGate` evaluates a Rego bundle in-process | `policy` (bundle reference), `input_mapping` | policy\_evaluation, policy\_version |
| `ofac_screening/v1` | platform | `specops.executors.gaip:ScreeningGate` calls GAIP screening | `model_profile`, `entity_selector` | screening\_receipt |
| `eval/v1` | platform | `specops.executors.eval:EvalGate` runs a registered deterministic check | `eval` (registered eval id), `inputs` | eval\_report |
| `human/v1` | human | `specops.executors.human:HumanGate` writes a DecisionRequest and interrupts | `decider_roles`, `due` | decision |
| `aggregate/v1` | platform | `specops.executors.aggregate:AggregateGate` combines predecessor results | `logic` (all\_of, any\_of, quorum), `inputs[]` | aggregate\_result |

**Registered commands, evals, and label sets** are small sub-registries owned by the platform manager team, referenced by id from gate definitions:

- Commands (`tool` at agent location): `git.push`, `github.pr.open`, `github.pr.merge`, `github.issue.create`, `jira.issue.create`. Each has an argument schema and a receipt schema; the CLI runs them under the user's identity.
- Watch conditions (`tool` with `wait_for`): `github.pr.merged`, `jenkins.build.completed`, `jira.status.equals`. Each names the managed-system client, the poll interval, and the fact schema it binds.
- Evals: `schema.conforms`, `evidence.fresh`, `subject.matches`, `test_report.parse`, `mutation_report.parse`, `diff.within_allowed_paths`, `commit.descends_from_base`. Each is a pure function over accepted results and evidence references.
- Label sets for the classifier: `delivery/work-labels/v1` lists `regulatory_content`, `sensitive_data`, `sanctions_screening`, `external_party`, `schema_change`.

A new kind, command, eval, or watch condition ships as a platform release with its own tests, while a new gate or pack is published as configuration.

## 8. Profiles and registries

Four registries hold the named configuration that gate definitions reference. Each entry is a schema-validated document that resolves to concrete values when an assignment is built. One entry of each kind follows, with the table the resolver uses for model profiles.

**Agent profile.** What the local agent tool is started with.

```yaml
# agent-profile:implementer/standard-v1
profile:
  id: implementer
  version: standard-v1
  display_name: Implementer
adapter:
  preferred: claude-code-sdk        # claude-code-sdk | codex-sdk | subprocess
  fallback: subprocess
  capabilities_required: [structured_output, streaming, cancellation]
instructions:
  system_ref: artifact://profiles/implementer/system-v3.md   # content-addressed
  conventions_ref: repo://.specops/conventions.md            # read from the worktree if present
sandbox:
  profile: managed-sandbox/standard
  network: none
  filesystem: worktree_only
capabilities:
  tools: [read, edit, bash]
  mcp_servers: [github-readonly]
  skills: [test-runner, repo-conventions]
  allowed_commands_ref: command-set:implementer/v1
output:
  mode: provider_structured_output   # the tool's own structured-output feature
```

**Model profile.** A capability need plus a routing policy; never a model name.

```yaml
# model-profile:code-implementation/standard-v2
profile:
  id: code-implementation
  version: standard-v2
needs:
  capability: code_generation
  context_window_min: 128000
  reasoning: standard            # none | fast | standard | deep
  data_classification_max: internal
routing:
  cost_tier: standard
  prefer: [anthropic/claude-sonnet-4-5, openai/gpt-5-codex]
  fallback_on_unavailable: true
  pin_on_retry: true             # a retry uses the model the first attempt resolved to
resolution:
  platform_gate: gaip_catalog    # resolve against GAIP's catalog for platform gates
  agent_gate: local_entitlements # resolve against the tool's entitled models for agent gates
```

**Resolution table for model profiles.** The resolver evaluates rows in order and takes the first match.

| Gate location | Classification of context | Availability | Resolves to |
| --- | --- | --- | --- |
| platform | at or below `data_classification_max` | first `prefer` entry available in GAIP | that GAIP model, with reasoning and budget from `needs` |
| platform | at or below max | first entry unavailable, `fallback_on_unavailable` | next available `prefer` entry; recorded as fallback |
| platform | above max | any | `blocked` with reason `classification_exceeds_profile` |
| agent | any | the CLI reports the tool's entitled models | first `prefer` entry the tool is entitled to; else the tool's default; recorded in `GateResult.runtime.model_reported` |

**Message route.** Which contracts and template apply to a work type and message type, and where outputs go.

```yaml
# route:implementation/v1
route:
  work_type: implementation
  message_types:
    assignment:
      input_schema: schema:implementation-input/v1
      prompt_template: template:implementation-assignment/v2
    result:
      output_schema: schema:implementation-result/v1
      deliver_to: [acceptance, next_node_input]
    progress:
      schema: schema:session-event/v1
      deliver_to: [telemetry, live_stream]
    decision_request:
      schema: schema:DecisionRequest/v1
      deliver_to: [human_queue]
    findings:
      schema: schema:finding/v1
      deliver_to: [findings_disposition]
```

**Context template.** Which context classes apply and how each is selected.

```yaml
# context-template:component-change/v2
template:
  id: component-change
  version: v2
classes:
  architecture:
    select: by_component          # project + component identity from the job
    include: [c4_component, adrs_applicable, interfaces]
    mandatory: true
  codebase:
    select: dependency_closure
    max_depth: 2
    seeds: [specification.affected_paths]
    resolved_by: cli              # built from the worktree index at the Git SHA
  nfrs:
    select: applicability_rules
    rules_ref: policy:nfr-applicability/v1
    mandatory: true
  delivery_state:
    include: [approved_intent, approved_specification, prior_findings_same_gate]
exclusions: [unrelated_components, unapproved_designs, prior_agent_transcripts]
retrieval:
  mode: scoped_on_demand
  allow_scope_expansion: false
budgets:
  max_files: 60
  max_tokens: 120000
```

**From template to manifest.** The platform resolver reads the template, the job's project and component, and the pinned upstream artifacts, and emits a `ContextManifest` of references with digests; it cannot resolve `codebase` because it holds no repository, so it emits the seeds and the closure rule and marks the class `resolved_by: cli`. The CLI resolver reads the manifest, builds or loads the Tree-sitter index at the base commit, materializes the closure, and records the materialized set and its digest as evidence. The agent sees the files in its worktree and a short index of what it was given, and neither the template nor the manifest.

**Prompt templates** (`template:` registry) are Jinja documents rendered by the CLI from the assignment, the manifest, and the output schema. The template is pinned by digest in the route; the rendered prompt's digest is recorded on the attempt, so two attempts with the same inputs are shown to have received the same prompt.

## 9. Harnesses, harness instructions, and learning loops

A harness is the program that runs an agent: Claude Code, Codex, or another approved local agent tool, together with the configuration surface it exposes (instruction files, permission rules, hooks, MCP servers, skills, memory). The platform sits outside both the harness and the agent. It never runs a harness and never talks to a model; it decides what the CLI hands to the harness for one attempt, and it records what came back. Custom harness instructions are therefore configuration the platform owns and versions, and a learning loop is a Gate Pack that proposes new versions of that configuration, never a mechanism inside the kernel.

**Where harness configuration lives.** The agent profile gains a `harness` block. Everything the harness would otherwise read from the developer's own settings is declared here, pinned by digest, and materialized by the CLI into the session's configuration at start-up.

```yaml
# agent-profile:implementer/standard-v1 (harness block)
harness:
  kinds: [claude-code, codex]          # harnesses this profile may run on
  instructions:
    layers:                            # composed in this order; each layer's digest is recorded
      - ref: instruction:platform/base/v4          # owned by the platform manager team
      - ref: instruction:team/payments/implementer/v2   # owned by the product team
      - source: repository                          # the repository's own CLAUDE.md or AGENTS.md
        path: [CLAUDE.md, AGENTS.md]
        treat_as: data                              # filtered, cannot widen the assignment
    render: harness_native               # written as CLAUDE.md / AGENTS.md in the worktree
  permissions:
    mode: allowlist
    allowed_commands_ref: command-set:implementer/v1
    deny: [network.outbound, filesystem.outside_worktree]
    interactive_prompts: attended_only   # unattended sessions answer only from the allowlist
  hooks:
    - event: before_tool_call
      ref: hook:platform/path-guard/v1   # refuses writes outside allowed paths
    - event: after_session
      ref: hook:platform/collect-evidence/v1
  mcp_servers: [mcp:github-readonly/v1]
  skills: [skill:test-runner/v2, skill:repo-conventions/v3]
  memory:
    mode: none                           # none | job | profile
    read_from: []
    write_to: []
```

**Instruction layering.** The CLI composes the layers in order and writes the result in the harness's native form (a `CLAUDE.md` for Claude Code, an `AGENTS.md` for Codex) into the worktree before the session starts. The platform layer carries the rules that apply to every session (structured output, no credentials in files, how to end with a `needs_human` request); the team layer carries conventions and standards; the repository layer is whatever the repository already contains and is passed through the prompt-injection filter as data. Each layer's digest, and the digest of the composed file, go on the attempt, so a change to any instruction file is visible in the ledger and a replay can reproduce the exact instructions.

**Memory.** The default is `none`: a session starts with its assignment, its context manifest, and its instructions, and nothing from any earlier session. Two bounded alternatives exist. `job` memory lets a session read the typed artifacts of earlier gates in the same job (which the context template already provides as prior findings) and write nothing. `profile` memory lets a harness read a versioned notes document attached to the agent profile and propose changes to it through the learning loop below; it never writes directly. Harness-native memory features (auto-memory files, persistent session state) are disabled by the permissions block, because anything they would carry across attempts is untracked context.

**Learning loops as Gate Packs.** Self-improvement runs through the same machinery as delivery. A learning pack reads the ledger and proposes a new version of a registry entry; a human approves it; a tool gate publishes it. The kernel contributes the evidence and the publish step and makes no changes on its own.

| Gate | Kind | What it does |
| --- | --- | --- |
| Observe | `eval` | Reads a window of ledger events for one agent profile: rejection reason codes, repeated failure fingerprints, findings by kind, reviewer changes after agent review, retry counts, and human feedback given at checkpoints |
| Propose | `agent` | A session receives the observations and the current instruction layer as typed input and returns a proposed revision as a diff plus a rationale, valid against `instruction-proposal/v1` |
| Evaluate | `eval` | Replays a fixed set of past assignments against the proposed instructions in a sandbox and compares eval pass rates with the current version |
| Review | `human` | The profile owner approves or rejects the proposal with reason codes |
| Publish | `tool` | Writes the new instruction version to the registry under the user's identity; packs that pin the old digest keep it until republished |

The same shape serves a conventions document, a command allowlist, an eval set, or a prompt template. What the loop may change is bounded by the registry entry's owner and by pack validation: a proposal cannot add tools, widen paths, or alter a default gate, because the publish step is subject to the same rules as a hand-written change.

**Signals the loop reads.** All of them already exist in the ledger: `GateResult.findings[]`, `Decision.reason_codes[]` and `requested_changes[]`, failure fingerprints, the feedback file from `specops work continue --feedback`, reviewer edits after agent review (the diff between the agent's commit and the reviewer's), and skipped-gate samples. No new telemetry is needed for the first learning pack.

**What stays outside the platform.** Harness vendors ship their own improvements, and a developer may tune their personal harness for work that is not a specops attempt. Inside an attempt the harness runs with the profile's configuration and nothing else; outside an attempt the platform has no opinion.

## 10. Worked example: the implementation gate, definition to ledger

This section follows the implementation gate through every artifact it produces, in the order they come into existence. Digests are abbreviated.

**1. Publish.** The product team publishes `gate:delivery/implementation/v1` (section 4) and `pack:delivery/spec-driven-delivery/v1` (section 5). The compiler resolves the closure and writes the bill of materials:

```json
{
  "schema": "schema:CompiledPack/v1@sha256:a1…",
  "pack": "pack:delivery/spec-driven-delivery/v1@sha256:b2…",
  "graph_digest": "sha256:c3…",
  "bill_of_materials": {
    "gate:delivery/implementation/v1": "sha256:d4…",
    "kind:agent/v1": "sha256:e5…",
    "schema:implementation-input/v1": "sha256:f6…",
    "schema:implementation-result/v1": "sha256:07…",
    "agent-profile:implementer/standard-v1": "sha256:18…",
    "model-profile:code-implementation/standard-v2": "sha256:29…",
    "context-template:component-change/v2": "sha256:3a…",
    "route:implementation/v1": "sha256:4b…",
    "template:implementation-assignment/v2": "sha256:5c…"
  }
}
```

**2. Schedule.** `spec_review@1` is approved; the CEL edge `decision.outcome == 'approved'` selects `implementation`. The scheduler creates `implementation@1`, attempt 1, builds the assignment, appends `gate.assigned` to the ledger with the outbox row, and interrupts.

```json
{
  "schema": "schema:GateAssignment/v1@sha256:…",
  "assignment_id": "ASSIGN-889",
  "job_id": "JOB-184", "run_id": "RUN-123",
  "gate_instance": "implementation@1", "attempt_id": "ATT-517",
  "subject": { "type": "specification", "id": "SPEC-42", "digest": "sha256:6d…" },
  "input": {
    "specification_ref": "evidence://EV-9100",
    "base_commit": "7f3e…",
    "repository": "github.com/org/payments",
    "branch_rule": "specops/{job}/{instance}",
    "tasks": [ {"id": "T1", "title": "Add table"}, {"id": "T2", "title": "Wire handler"} ]
  },
  "agent_profile": { "ref": "agent-profile:implementer/standard-v1@sha256:18…", "adapter": "claude-code-sdk", "fallback": "subprocess", "sandbox": "managed-sandbox/standard", "tools": ["read","edit","bash"], "allowed_commands_ref": "command-set:implementer/v1@sha256:…" },
  "model": { "profile": "model-profile:code-implementation/standard-v2@sha256:29…", "resolution": "local_entitlements", "prefer": ["anthropic/claude-sonnet-4-5", "openai/gpt-5-codex"], "reasoning": "standard" },
  "context_manifest_digest": "sha256:7e…",
  "limits": { "startup": "PT2M", "activity": "PT10M", "absolute": "PT12H", "output_bytes": 2000000 },
  "allowed": { "paths": ["src/payments/**", "tests/payments/**"], "commands": ["npm test", "npm run lint"] },
  "eligible_scope": { "roles": ["engineer"], "teams": ["payments"] },
  "decomposition": "per_task", "handoff": "human_checkpoint",
  "definition_digests": { "gate": "sha256:d4…", "pack": "sha256:b2…", "route": "sha256:4b…", "template": "sha256:5c…" },
  "schema_bundle_digest": "sha256:8f…"
}
```

The assignment holds resolved values (adapter, tools, preference list, limits) and digests. There are no registry names in it for the CLI to look up.

**3. Claim.** `specops work claim ASSIGN-889` sends the dev token for `alice` (groups `engineer`, `payments`). The API verifies the token, evaluates OPA with the action `claim_lease` and the eligible scope, and inserts the lease conditionally. Ledger: `lease.claimed` with `LEASE-442`, holder `alice`, expiry 15 minutes, renewal 5 minutes.

**4. Materialize.** The CLI reads the `ContextManifest`, creates the worktree at `7f3e…` on It's`specops/JOB-184/implementation@1`, builds the Tree-sitter index, resolves the `codebase` class to 23 files, runs inbound DLP, renders `template:implementation-assignment/v2` with the assignment and manifest, and records the rendered prompt digest. The schema bundle gives it `implementation-result/v1` for validation.

**5. Run.** Two tasks, two sessions through the Claude Code adapter with `cli_path` on the managed binary. Each session returns provider structured output for `task-result/v1`; the CLI commits after each, emits `session.*` NDJSON events, renews the lease on its own clock. After T2 the CLI pauses at the human checkpoint. Alice runs `specops work review`, tries the change, runs `specops work continue --feedback naming.md`; a third session applies the feedback. `specops work submit`.

**6. Validate locally.** The CLI validates the combined output against `implementation-result/v1@sha256:07…`, runs the gate's local evals `diff.within_allowed_paths` and `commit.descends_from_base`, runs outbound DLP, uploads the diff and task results to the evidence store with presigned targets, and builds the result:

```json
{
  "schema": "schema:GateResult/v1@sha256:…",
  "assignment_id": "ASSIGN-889", "attempt_id": "ATT-517",
  "subject": { "type": "specification", "id": "SPEC-42", "digest": "sha256:6d…" },
  "status": "passed",
  "output": { "commit": "9a1c…", "changed_paths": ["src/payments/ledger.ts", "tests/payments/ledger.test.ts"], "task_results": [ {"id": "T1", "status": "done", "commit": "8b0d…"}, {"id": "T2", "status": "done", "commit": "9a1c…"} ], "findings": [ {"kind": "out_of_scope", "severity": "low", "location": "src/payments/refund.ts:88", "description": "Unused import", "suggested_action": "issue"} ] },
  "evidence": [ {"type": "context_manifest", "id": "EV-9182", "digest": "sha256:7e…"}, {"type": "git_diff", "id": "EV-9183", "digest": "sha256:…"}, {"type": "task_results", "id": "EV-9184", "digest": "sha256:…"}, {"type": "session_events", "id": "EV-9185", "digest": "sha256:…"} ],
  "local_evals": [ {"id": "diff.within_allowed_paths", "result": "pass"}, {"id": "commit.descends_from_base", "result": "pass"} ],
  "runtime": { "cli_version": "0.1.0", "adapter": "claude-code-sdk", "binary_version": "2.1.4", "model_reported": "anthropic/claude-sonnet-4-5" },
  "session": { "sessions": 3, "started_at": "2026-11-06T14:02:11Z", "ended_at": "2026-11-06T15:48:40Z", "usage": {"input_tokens": 212000, "output_tokens": 31000} },
  "definition_digests": { "gate": "sha256:d4…", "agent_profile": "sha256:18…", "model_profile": "sha256:29…", "context_template": "sha256:3a…", "prompt": "sha256:9b…" },
  "lease_id": "LEASE-442", "expected_ledger_position": 61, "idempotency_key": "ATT-517:submit:1"
}
```

**7. Accept.** One transaction: verify token; OPA `submit_result` with lease holder; idempotency key unseen; lease current; attempt and subject match the assignment; output valid against the pinned schema; every required evidence type present and its digest matches the store; sign the evidence statements; append `result.accepted` (seq 62), `evidence.recorded` (63 to 66), `finding.recorded` (67); outbox row `run.resume`; commit; return `202` with receipt `{seq: 62, hash: …}`.

**8. Resume.** The worker takes `run.resume` from the queue, loads the checkpoint for `RUN-123`, injects the result, evaluates the unconditional edge to `source_verify`, and creates `source_verify@1`. The findings disposition step labels the finding `low` and records it; no issue is created until a human says so.

Each object above can be fetched by its identifier: `specops job events JOB-184` lists seq 60 to 67 with their types and display reasons; `specops evidence get EV-9183` returns the signed diff; `specops resolve gate:delivery/implementation/v1@sha256:d4…` returns the exact definition that governed the attempt.

## 11. Local prototype plan

The prototype is one repository holding three packages and starts with one command. The platform and the CLI are separate packages so that the CLI can later be built as a signed binary without untangling it from the platform.

**Repository layout**

```text
specops/
  contracts/                 # the registries, in Git
    schema/                  #   JSON Schema 2020-12 documents
    kind/                    #   GateKind entries
    gate/                    #   GateDefinition entries (default/ and delivery/)
    pack/                    #   GatePack entries
    agent-profile/  model-profile/  route/  context-template/  template/  policy/
    taxonomy/failures.yaml   #   the shared failure enum and exit-code groups
  platform/                  # Python: specops-platform
    specops/api/             #   FastAPI routes, auth, acceptance transaction
    specops/kernel/          #   compiler, scheduler, routers, resolver, broker
    specops/executors/       #   one module per kind
    specops/ports/           #   the backend protocols
    specops/backends/local/  #   SQLite, directory, in-process bus, FTS5, Ed25519, dev IdP
    specops/backends/aws/    #   Aurora, S3, EventBridge, SQS, OpenSearch, KMS, Ping
    specops/stubs/           #   GAIP, DLP, Jira, Jenkins stub servers
  cli/                       # TypeScript: specops (Node for the prototype; Go later if a single static binary is required)
    src/commands/            #   auth, start, job, work, decision, context, resolve, pack
    src/adapters/            #   claude-code-sdk, codex-sdk, subprocess
    src/supervisor/          #   three clocks, event normalizer, heartbeat
    src/resolver/            #   worktree, Tree-sitter index, manifest materialization
    src/filters/             #   DLP and injection filters (local rules in the prototype)
    src/evals/               #   local eval runners
  codegen/                   # Pydantic and TypeScript types generated from contracts/schema
  examples/payments/         # a small repository the pilot pack runs against
```

**Bring-up**

```text
specops-platform --role all --profile local --with-stubs      # kernel on 127.0.0.1:8470, stubs on 8471 to 8474
specops auth login --dev-user pm --groups product-owner,payments
specops pack publish contracts/pack/delivery/spec-driven-delivery.yaml   # compiles, prints the BOM or the failing rule id
specops start examples/payments/intent.md --pack delivery/spec-driven-delivery/v1
specops decision approve JOB-1 --as pm                        # intent review
specops auth login --dev-user alice --groups engineer,payments
specops work list
specops work claim ASSIGN-3 && specops work run
specops job events JOB-1
```

**Build order.** Each step has a test that fails before it and passes after.

| Step | Deliverable | Proof |
| --- | --- | --- |
| 1 | Contracts and codegen: the twelve schemas, the kinds, the delivery gates and pack, generated types | `pytest contracts/` validates every registry entry against its entry schema; a deliberately broken gate fails with `GD004` |
| 2 | Compiler and resolver | `specops pack publish` emits a BOM; the three negative packs (backward edge, unknown kind, skip on non-skippable) are refused |
| 3 | Ledger store and checkpointer on SQLite | Append-only enforced by trigger; projection rebuild equals live; a LangGraph thread survives process restart |
| 4 | API: dev IdP, OPA authorization, leases, acceptance transaction | Two concurrent claims, one lease; duplicate submit, one event; stale subject, rejected |
| 5 | Worker: scheduler, interrupt and resume, in-process bus and queues | A pack with only `eval` and `human` gates runs end to end with `specops decision` driving it |
| 6 | CLI core: auth, work claim and run, supervisor, subprocess adapter | An `agent` gate runs with a scripted fake agent binary that emits the JSON event stream |
| 7 | Real adapters and the context resolver | The implementation gate runs with the managed Claude Code binary against `examples/payments`; manifest digest and materialized set recorded |
| 8 | Platform gates with stubs: classifier, OPA, screening, GAIP eval, facts | The delivery pack runs end to end; gates 8 to 10 skip when the stub classifier returns no labels |
| 9 | Rework, invalidation, blocked handling, human checkpoint, findings | Rejection at PR review creates `implementation@2`; stub GAIP outage blocks and resumes; `work review` and `continue` round trip |
| 10 | AWS backends behind the same ports | The platform test suite passes against the aws profile in a sandbox account |

Steps 1 to 5 need no agent tool and no network, so the kernel's rules are proven before any model is involved.

**What the first demo shows.** A product manager starts a job from an intent file, approves the structured intent, and an engineer on a second terminal (or second machine on the same network) claims, implements through a real local session, reviews, submits; a reviewer rejects with a rework target; `implementation@2` appears; the second pass is approved; `specops job events` reads like a pipeline from seq 1 to the end, every row carrying its digests.

## 12. Architecture Decisions

This section records the thirteen design decisions that shape the MVP. Each record states the context in which the decision arose, the options that were considered, a scored comparison of those options, the assessment that produced the scores, the decision taken, and the consequences that follow from it. Every record uses the same scoring rubric so that the records can be compared with one another.

**Rubric.** Each option is scored against six criteria. Each criterion receives a score from 0 to 4, drawn as a row of dots that runs from `○○○○` (0) to `●●●●` (4). The six scores add up to a total out of 24. The total supports the reasoning in the assessment paragraph and does not replace it, so when a record chooses an option with a lower total, the assessment explains the reason.

| Criterion | What a high score means |
| --- | --- |
| Boundary | The option preserves the division of responsibility in which the platform decides whether work advances, the CLI carries assignments and results, and the local agent performs the work. No component gains an authority the architecture withholds from it. |
| Parity | The local profile and the Fargate profile run the same code and enforce the same rules. |
| Audit | Every effect of the option is pinned to a version, carries a digest, and can be replayed from the ledger. |
| Build cost | The option is inexpensive to build for the MVP. A higher score means a cheaper build. |
| Reversibility | The option is inexpensive to change after the prototype has proved or disproved it. |
| Operational risk | The option has few failure modes in production, and recovery from each is clear. A higher score means a safer option. |

### 12.1 Process model for the kernel

**Context.** The kernel has to run as a single process on a laptop and as separately scaled API and worker tasks on Fargate, and the decision is how one codebase serves both.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. One container image starts with a role flag, and the roles share state only through the ledger and the bus. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●●○ | 21 |
| B. The API and the worker are separate services with separate codebases. | ●●●● | ●●○○ | ●●●○ | ●○○○ | ●●○○ | ●●●○ | 15 |
| C. A single process holds every role and is scaled as one unit. | ●●●○ | ●●●● | ●●●● | ●●●● | ●●○○ | ●○○○ | 18 |

**Assessment.** Option A keeps every rule in one codebase, and the local profile runs the same worker code that Fargate runs. The cost of option A is a discipline: the roles must never call each other. A test that starts the API alone and the worker alone enforces that discipline. Option B scales most cleanly, but it splits the acceptance transaction and the resume logic across two repositories, so parity between them depends on keeping two codebases in step by hand. Option C is the cheapest to build and matches the laptop exactly, but it cannot scale the worker independently of request load, and a worker crash takes the API down with it.

**Decision.** The decision is option A. One image is started with `--role api`, `--role worker`, or `--role all`.

**Consequences.** A continuous-integration test boots each role alone against the local profile and confirms that the other roles are not reachable from it. The number of worker tasks and the number of API tasks are independent Fargate service settings. If a third role is needed later, for example a dedicated outbox publisher, it is added as one more flag rather than as a new service.

### 12.2 Identifier grammar

**Context.** Every definition refers to schemas, profiles, templates, and policies by name, and the ledger has to record which version of each one applied to a given attempt. The decision is the form those names take.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Names take the form `registry:name/version@digest`, and a short form is allowed where the field already fixes the registry. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●○○ | ●●●● | 21 |
| B. Names are flat and global, in one namespace, with the version as a suffix. | ●●●○ | ●●●● | ●●○○ | ●●●● | ●●●○ | ●●○○ | 18 |
| C. Names are URIs, such as `specops://gate/delivery/implementation/v1`. | ●●●● | ●●●● | ●●●● | ●●○○ | ●●○○ | ●●●○ | 19 |

**Assessment.** Option A puts the registry in the name, so the resolver has one rule to apply and a bill of materials can be read without a legend. The digest suffix is the value the ledger records. Option B requires the least typing, but names collide as the registries grow, and a reader cannot tell from a name what kind of thing it denotes. Option C is as precise as option A, but it is verbose in YAML and brings URI parsing rules that nothing in the platform needs. Options A and C both score low on reversibility because identifiers appear in every stored document. That low score is a reason to decide the grammar now, and not a reason to prefer option B.

**Decision.** The decision is option A.

**Consequences.** The compiler expands every short form to its full identifier and rejects any short form that could refer to more than one registry. One regular expression validates identifiers, and the platform and the CLI both receive it through code generation. A digest is required in every stored document and is optional in documents that people write.

### 12.3 Where registries live

**Context.** The registries hold the schemas, kinds, gates, packs, profiles, and policies, and each change to them needs review, a history, and access control. The decision is where the registries are stored.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. The registries are directories of YAML and JSON files in Git, and the platform loads them when an entry is published. | ●●●● | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | 22 |
| B. A registry service with its own database and API holds the entries. | ●●●● | ●●○○ | ●●●○ | ●○○○ | ●●○○ | ●●○○ | 14 |
| C. The entries are packaged inside the platform's container image. | ●●●○ | ●●●● | ●●●○ | ●●●● | ●○○○ | ●●○○ | 17 |

**Assessment.** Option A obtains review, signing, history, and ownership from the repository the enterprise already governs, and a publish is a commit that has passed validation. Its weakness is that a running platform instance has to be told to reload, and the publish command does that. Option B adds a service that must be built, run, and secured before a single gate exists. Option C ties every change to a gate to a deployment of the platform, and it takes ownership of gates away from the product teams.

**Decision.** The decision is option A.

**Consequences.** The command `specops pack publish` validates the entry, compiles it, and posts the entry and its digest to the platform, which caches it by digest. The ownership rules, including rule `GD004` for default gates, are enforced at publish time from the roles of the person who committed the change. If a registry service is ever needed, it would serve the same Git content.

### 12.4 Where gate configuration lives

**Context.** A gate's behavior, meaning its profiles, limits, evidence, and policy, could be declared in the gate definition, in the pack that uses the gate, or in both places. The decision is which.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Gate definitions hold the configuration, and packs compose gates and may override a short list of fields. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●●● | 22 |
| B. Packs configure gates inline, and gate definitions serve only as templates. | ●●○○ | ●●●● | ●●○○ | ●●●● | ●●●○ | ●●○○ | 17 |
| C. Configuration may appear in either place, and the pack's value wins when they conflict. | ●●○○ | ●●●● | ●●○○ | ●●●○ | ●●●● | ●○○○ | 16 |

**Assessment.** Option A gives each gate one owner and one digest, so a pack that uses a default gate such as repository policy cannot weaken it, and the same gate can be reused across packs. Option B is convenient when there is only one pack, but it defeats the split of ownership between the platform manager team and product teams that the architecture depends on. Option C is the most flexible and the hardest to audit, because the configuration that applied exists only after the two sources are merged.

**Decision.** The decision is option A. A pack may override only `max_attempts`, `blocked.deadline`, and `limits.absolute`, and only where the gate definition marks that field as overridable.

**Consequences.** Pack validation rule `GP006` rejects an override of any field the gate does not expose. The bill of materials records the gate's digest and the override values that applied.

### 12.5 What a CEL edge may read

**Context.** Routing conditions on edges decide which gates run. The set of values those conditions are allowed to read determines whether routing can be type-checked when a pack is published and whether a routing decision can be explained from the ledger afterwards.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. A condition may read only `output`, `decision`, `job.labels`, and `pack.values`, and it is type-checked at publish. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●●● | 22 |
| B. A condition may read the full ledger history and the evidence store. | ●●○○ | ●●●● | ●●○○ | ●●○○ | ●●●○ | ●○○○ | 14 |
| C. There are no expressions, and routing is written in executor code for each pack. | ●●●○ | ●●●● | ●●●○ | ●●○○ | ●○○○ | ●●○○ | 15 |

**Assessment.** Under option A the compiler can check every condition against declared schemas, and the inputs to a routing decision are small enough to be recorded on the routing event. Under option B a condition can depend on history that changes after the pack was published, and such a condition cannot be type-checked. Option C moves routing back into platform releases, which is the situation Gate Packs were introduced to avoid.

**Decision.** The decision is option A.

**Consequences.** A gate that needs a routing fact which is not in its output adds that fact to its output schema and lists it in `readable_by_edges`. Each routing event records the expression that was evaluated, the inputs it read, and the result.

### 12.6 Where per-task decomposition runs

**Context.** An implementation can consist of many tasks, and some component has to loop over them. The decision is whether that loop lives in the CLI, in the pack, or in the kernel.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. The CLI loops over tasks inside one attempt, and each task's result is recorded as evidence. | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●●○ | ●●●○ | 20 |
| B. The pack declares one gate per task. | ●●●○ | ●●●● | ●●●● | ●●○○ | ●●○○ | ●●○○ | 17 |
| C. The kernel expands a subgraph for the tasks at run time. | ●●○○ | ●●●○ | ●●●○ | ●○○○ | ●○○○ | ●○○○ | 11 |

**Assessment.** Option A keeps the graph at the level of detail people review, and it keeps the handoff from one task to the next on the machine where the worktree already is. Its audit score is one point lower than option B's because task boundaries appear as evidence rather than as ledger gates. Option B gives each task its own lease and attempt, which is precise, but a change with twenty tasks becomes a status page with twenty nodes and twenty lease round trips. Option C makes the compiled graph differ from the published one, and that breaks the rule that a run pins one graph digest.

**Decision.** The decision is option A.

**Consequences.** Each `task-result/v1` document is evidence with its own digest, and `specops job events` shows task progress as rows beneath the attempt. If the pilot shows that tasks need independent review, option B can be reached by publishing a pack that splits them into gates, with no change to the kernel.

### 12.7 How a gate names a model

**Context.** Platform gates and agent gates both need a model, and the enterprise's policy on which models are allowed changes more often than packs do. The decision is how a gate expresses what it needs.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. A gate names a model profile that states a capability need and a preference list, and the profile is resolved according to where the gate's work runs. | ●●●● | ●●●● | ●●●● | ●●○○ | ●●●● | ●●●○ | 21 |
| B. Each gate definition names a specific model. | ●●●○ | ●●●○ | ●●●● | ●●●● | ●●○○ | ●●○○ | 18 |
| C. One default model applies across the platform, with no choice per gate. | ●●●○ | ●●●● | ●●●○ | ●●●● | ●●●○ | ●●○○ | 19 |

**Assessment.** Option A separates what a gate needs from what the enterprise currently allows, so a change of model is a new profile version and no pack has to be edited. It also lets agent gates resolve against the harness's own entitlements instead of GAIP. Option B is the simplest, but it spreads model names across every gate, and retiring a model forces every affected pack to be republished. Option C removes a choice that a classifier and an implementation gate need to make differently.

**Decision.** The decision is option A.

**Consequences.** The resolution table in section 8 is implemented as a tested function. The `pin_on_retry` setting guarantees that a retry runs on the model the first attempt resolved to. Every attempt records both the profile digest and the model that was resolved.

### 12.8 Shape of a gate result

**Context.** The kernel needs the same few fields from every result, and each work type needs a payload of its own shape. The decision is how those two needs share one document.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. A fixed envelope carries status, evidence, findings, runtime, and session, and an `output` field is validated against the gate's declared output schema. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●●● | 22 |
| B. One generic result shape carries a free-form `data` object. | ●●●○ | ●●●● | ●○○○ | ●●●● | ●●●● | ●○○○ | 17 |
| C. Each gate has a fully custom schema and there is no shared envelope. | ●●○○ | ●●●● | ●●●○ | ●●○○ | ●●○○ | ●●○○ | 15 |

**Assessment.** Option A lets the acceptance transaction validate every result in the same way while still type-checking the work-type payload, and CEL edges read `output` through its schema. Under option B nothing beyond the envelope can be validated, so a malformed payload reaches the next gate. Option C makes every gate kind a special case in the acceptance transaction and in the status page.

**Decision.** The decision is option A.

**Consequences.** A new work type adds an output schema and nothing else. The envelope fields are the only fields the kernel, the search index, and the status page depend on.

### 12.9 Local ledger store

**Context.** The local profile needs a transactional store that is append-only, supports the conditional insert the lease depends on, and holds LangGraph checkpoints. The decision is which store plays that role on a laptop.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. SQLite runs in write-ahead-log mode with a trigger that forbids updates and deletes. | ●●●● | ●●●○ | ●●●● | ●●●● | ●●●● | ●●●○ | 22 |
| B. PostgreSQL runs in a local container. | ●●●● | ●●●● | ●●●● | ●●○○ | ●●●● | ●●●○ | 21 |
| C. State is held in memory and appended to a JSONL log. | ●●●○ | ●○○○ | ●●○○ | ●●●● | ●●●● | ●○○○ | 15 |

**Assessment.** Option A needs no daemon and starts in milliseconds, which matters for a test suite that runs hundreds of acceptance cases. It loses one parity point because SQLite's SQL dialect and its locking behavior differ from Aurora's. Option B is the closest to production, and its cost is a container dependency for every developer and every continuous-integration job. Option C cannot express the conditional lease insert and cannot survive a restart without losing state.

**Decision.** The decision is option A for the default local profile. Option B is also provided as `--profile local-postgres` from step 3 onward, so that two implementations of the port are tested side by side before step 10.

**Consequences.** By step 10 the `LedgerStore` port has three implementations, and the contract test suite runs against all three. Differences in SQL dialect stay inside the backend modules.

### 12.10 CLI implementation language

**Context.** The CLI hosts the runtime adapters, the session supervisor, the context resolver, and the filters, and it will eventually have to ship as a signed binary. The decision is the language the prototype is written in.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. The prototype CLI is written in TypeScript and runs on Node. | ●●●● | ●●●● | ●●●● | ●●●● | ●●●○ | ●●○○ | 21 |
| B. The CLI is written in Go from the start. | ●●●● | ●●●● | ●●●● | ●●○○ | ●●○○ | ●●●● | 20 |
| C. The CLI is written in Python and shares the platform's generated types. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●○ | ●●○○ | 20 |

**Assessment.** Option A uses the language of both vendor SDKs, so the adapters stay thin and the subprocess fallback is tested against the same event types the SDKs produce. Its weak point is distribution, because a signed single binary is harder to produce from Node **Rubric.** Six criteria, each scored 0 to 4, shown as a gradient from `○○○○` (0) to `●●●●` (4). The total is out of 24 and is a guide to the reasoning, never a substitute for it; where a lower-scoring option is chosen the record says why.than from Go. Option B is the strongest on distribution, but it cannot use the vendor SDKs, so every adapter would be a subprocess adapter from the first day. Option C shares code generation with the platform, but it has the same distribution problem as option A and none of the SDK advantage.

**Decision.** The decision is option A for the prototype. The signed-binary distribution decision, which is open decision 12 in the architecture record, is the event that would trigger a rewrite in Go, and the adapter interface is kept narrow so that such a rewrite has a known size.

**Consequences.** The CLI's contract types are generated from the same schemas as the platform's. The subprocess adapter is a required and tested path in every release, so that a Go port would have a proven design to copy.

### 12.11 Authorization in the local profile

**Context.** The local profile has to start quickly, and authorization bugs are the kind of bug the pilot cannot afford to discover in production. The decision is how much of the production authorization path the local profile runs.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. A development identity provider issues signed tokens with group claims, and the same OPA policies as production evaluate them. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●● | ●●●● | 23 |
| B. Authorization is disabled in the local profile and enabled on Fargate. | ●○○○ | ●○○○ | ●●○○ | ●●●● | ●●●● | ●○○○ | 13 |
| C. Static API keys in a local file are mapped to roles. | ●●●○ | ●●○○ | ●●●○ | ●●●● | ●●●● | ●●○○ | 18 |

**Assessment.** Option A runs the production token verification and the production Rego policies against a local key set, so the authorization test suite is identical in both profiles, and a change to Ping or Entra stays inside the `IdentityVerifier` backend. Option B leaves the most dangerous class of bug untested until deployment. Option C exercises OPA but not token handling, and it invites shortcuts that could reach production.

**Decision.** The decision is option A.

**Consequences.** The command `specops auth login --dev-user` exists only in the local profile and is refused when `SPECOPS_PROFILE=aws`. The authorization scenarios listed in the architecture record run on every commit.

### 12.12 Where findings are reported

**Context.** Agents notice defects, risks, and questions outside the scope of their assignment, and the platform has to capture those observations without blocking the gate that produced them. The decision is where in the result they travel.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. Every `GateResult` carries a `findings[]` array, and a platform step decides what happens to each finding. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●● | ●●●○ | 22 |
| B. Findings are carried only on failed results. | ●●●○ | ●●●● | ●●○○ | ●●●● | ●●●● | ●●●○ | 19 |
| C. A separate findings gate runs after each agent gate. | ●●●○ | ●●●● | ●●●● | ●●○○ | ●●●○ | ●●○○ | 17 |

**Assessment.** Option A captures observations on passing work, which is where most of them occur, and it keeps the gate's outcome separate from the observations made along the way. Disposition is a platform step, so no issue is created until the Decision API has assigned a severity, and nothing that changes an external system happens without a person. Option B loses the majority of findings. Option C doubles the number of gates and still needs a field in the envelope to carry the data.

**Decision.** The decision is option A.

**Consequences.** The `finding/v1` schema is part of the result envelope. Creating an issue or a ticket remains a CLI command that runs under the user's identity after a disposition, and the platform never creates one directly.

### 12.13 Harness configuration and learning

**Context.** The platform sits outside both the harness and the agent, and yet custom harness instructions and improvement over time are both required. The decision is where harness configuration lives and how it changes.

| Option | Boundary | Parity | Audit | Build cost | Reversibility | Op. risk | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A. The agent profile carries a harness block, and learning loops are Gate Packs that publish new registry versions through a human gate. | ●●●● | ●●●● | ●●●● | ●●●○ | ●●●● | ●●●● | 23 |
| B. The harness uses its own memory and tunes itself inside the session. | ●○○○ | ●●○○ | ●○○○ | ●●●● | ●●●○ | ●○○○ | 12 |
| C. A learning service inside the platform rewrites profiles from telemetry. | ●●○○ | ●●●○ | ●●○○ | ●○○○ | ●●○○ | ●○○○ | 11 |

**Assessment.** Option A keeps everything a harness runs with pinned and recorded, and it routes improvement through the same machinery as delivery, so every change to instructions has an owner, a review, and a digest. Option B lets context cross from one attempt to the next without being tracked, so two runs of the same assignment can differ for reasons the ledger cannot show. Option C puts a model in the control path of what other models see, and it gives the platform authority over profiles that product teams own.

**Decision.** The decision is option A.

**Consequences.** The permissions block disables the harness's own memory features. The first learning pack ships after the delivery pack is stable, and it reads only signals the ledger already holds.

**Summary of decisions**

| # | Decision | Score of chosen option | Nearest alternative |
| --- | --- | --- | --- |
| 12.1 | One image is started with a role flag. | 21 | Single process, no split (18) |
| 12.2 | Names take the form `registry:name/version@digest`. | 21 | URI form (19) |
| 12.3 | Registries are stored in Git. | 22 | Packaged in image (17) |
| 12.4 | Gates hold configuration and packs hold composition. | 22 | Inline in packs (17) |
| 12.5 | CEL conditions read a restricted, type-checked environment. | 22 | Routing in code (15) |
| 12.6 | Task decomposition runs inside the attempt. | 20 | One gate per task (17) |
| 12.7 | Gates name model profiles rather than models. | 21 | Platform-wide default (19) |
| 12.8 | A fixed envelope carries a work-type output payload. | 22 | Generic result (17) |
| 12.9 | SQLite is the default local store, with a Postgres container as a second local profile. | 22 | Postgres only (21) |
| 12.10 | The prototype CLI is TypeScript, with Go on the distribution trigger. | 21 | Go from the start (20) |
| 12.11 | A development identity provider feeds the production OPA policies. | 23 | Static keys (18) |
| 12.12 | Every result carries findings. | 22 | Failed results only (19) |
| 12.13 | The agent profile carries the harness block, and learning runs as Gate Packs. | 23 | Harness-native memory (12) |

The closest comparisons are in records 12.9 and 12.10, where the chosen option won by a single point. Both of those records state the condition under which the alternative would replace the decision. Three questions are left open on purpose because they belong to the architecture record rather than to this document: the lengths of leases, the context sources each gate kind may use, and the process for signing the CLI.

**Next steps**

- [ ] Name the `examples/payments` repository and the two-task specification the first demo will implement.
- [ ] Start step 1: contracts and codegen.
