# Platform Context with BMAD: Implementation Reference

A consolidated guide for managing platform-level context across multiple repositories in a BMAD (spec-driven AI-assisted development) workflow. Designed to be loaded into a Claude Code session as canonical reference.

---

## Core principle

In a contract-first codebase, the canonical representation of "what the system does" lives in **contracts** (OpenAPI, AsyncAPI, JSON Schema, Avro, protobuf), **ADRs**, and a small amount of **human-curated prose**. Code is implementation detail; contracts are primary. Mechanical extraction's job is to catch what isn't yet contracted.

Operational rules that follow:

- Contract-shaped artifacts are **lossless and verbatim** — never summarized, never paraphrased.
- Only implementation prose is allowed to be lossy, and lossy artifacts must be **regenerable from source**.
- The more behavior you push into `contracts/`, the less work mechanical extraction has to do.

---

## The single-artifact pattern

**One file per repo: `CONTEXT.md` at the repository root, one page maximum for the human-maintained section.** The platform-wide view is compiled, not authored.

### Template

```markdown
# <service-name>

## Purpose
One paragraph. What this service exists to do, and what it explicitly is NOT
responsible for.

## Contracts owned
- contracts/foo.openapi.yaml — handles X
- contracts/bar.avsc — emitted on Y

## Contracts consumed
- other-service/contracts/baz.openapi.yaml — for Z

## Invariants
5–10 bullets max. Things that must be true. Examples:
- DE 55 required for EMV chip transactions
- Events delivered at-least-once; consumers must be idempotent
- All amounts in minor units (cents)

## Decisions
Links to ADRs in repo or platform-docs.

## Glossary
Service-specific terms only. Platform glossary lives elsewhere.

<!-- Generated: <git-sha> at <timestamp> -->
<!-- AUTO-GENERATED BELOW -->
## API surface
## Service dependencies
```

### What does NOT belong in CONTEXT.md

| Content | Lives in |
|---|---|
| How to run the service | README |
| How to deploy | runbooks |
| How to run tests | README |
| Troubleshooting | runbooks |
| Onboarding narrative | separate doc |
| Sprint/team process | wiki |

`CONTEXT.md` exists for **cross-service understanding only**. Sixty seconds per update, max. If updating ever takes longer, the wrong content has crept in.

---

## Three enforcement mechanisms

### 1. PR gate: contracts changed → CONTEXT.md prose changed

```bash
# Crude but works. Run as a CI check on every PR.
if git diff --name-only origin/main | grep -q '^contracts/'; then
  if ! git diff origin/main -- CONTEXT.md \
       | awk '/<!-- AUTO-GENERATED BELOW -->/{exit} /^[+-][^+-]/{found=1} END{exit !found}'; then
    echo "Contract changed without CONTEXT.md prose update"
    exit 1
  fi
fi
```

The `awk` pattern walks the CONTEXT.md diff, exits at the auto-generated marker, and treats any preceding `+`/`-` line as a prose change.

### 2. Mechanical regenerator

A small script rewrites everything below the `AUTO-GENERATED` marker on every PR. The prose is human-maintained; the appendix is **never** human-maintained.

**Rule:** if a section can't be generated deterministically, it doesn't belong in the auto section.

For Java/Spring services:

| Extraction target | Tool |
|---|---|
| REST endpoint surface | `springdoc-openapi` plugin or `/actuator/mappings` |
| `@KafkaListener`, `@Scheduled`, `@FeignClient` | tree-sitter |
| `@ConfigurationProperties` keys | tree-sitter |
| Anything needing type resolution / generics | JavaParser |

The first row is often unnecessary if your spec-driven flow already produces an OpenAPI artifact under `contracts/` — listing files in `contracts/` is then the extraction.

#### Tree-sitter query example (Spring controllers)

```scheme
; queries/spring-endpoints.scm
(class_declaration
  (modifiers
    (marker_annotation
      name: (identifier) @ctrl
      (#match? @ctrl "RestController|Controller")))
  name: (identifier) @class
  body: (class_body
    (method_declaration
      (modifiers
        (annotation
          name: (identifier) @http
          arguments: (annotation_argument_list) @path
          (#match? @http "GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping")))
      name: (identifier) @method) @endpoint))
```

#### Driver script outline

```python
# scripts/regenerate_context.py
# Illustrative — adapt to current py-tree-sitter API for your version.
import tree_sitter_java as tsj
from tree_sitter import Language, Parser, Query
from pathlib import Path

JAVA = Language(tsj.language())
parser = Parser(JAVA)
endpoint_q = Query(JAVA, Path("queries/spring-endpoints.scm").read_text())

def scan_endpoints(root: Path) -> list[dict]:
    rows = []
    for f in root.rglob("src/main/**/*.java"):
        tree = parser.parse(f.read_bytes())
        for node, name in endpoint_q.captures(tree.root_node):
            # collect class, method, HTTP verb, path
            ...
    return rows

def update_context_md(sections: dict[str, str]) -> None:
    body = Path("CONTEXT.md").read_text()
    head, _ = body.split("<!-- AUTO-GENERATED BELOW -->", 1)
    rendered = "<!-- AUTO-GENERATED BELOW -->\n"
    for title, content in sections.items():
        rendered += f"## {title}\n{content}\n"
    Path("CONTEXT.md").write_text(head + rendered)

if __name__ == "__main__":
    endpoints = scan_endpoints(Path("."))
    # ... other extractions
    update_context_md({
        "API surface": render_endpoints(endpoints),
        "Service dependencies": render_deps(...),
    })
```

#### CI check after regeneration

```bash
python scripts/regenerate_context.py
git diff --exit-code CONTEXT.md || {
  echo "CONTEXT.md auto-generated section is stale — run regenerator and commit"
  exit 1
}
```

### 3. Aggregation (only if needed)

If — and only if — there is a real consumer who needs a single platform-wide view and isn't using Claude Code (security review, compliance audit, exec audience), run a scheduled job that pulls every service's `CONTEXT.md` and concatenates them with a TOC into one file under `platform-docs`.

If you cannot name such a consumer today, skip aggregation. It can be added later in a few hours.

---

## Path-includes: the Claude Code-native alternative

For Claude Code consumption specifically, `@path` imports in `CLAUDE.md` reference files from other repos directly — no aggregation required.

### Each service's CLAUDE.md

```markdown
# <service-name>

Service-specific context: @./CONTEXT.md

Platform-wide:
@~/work/platform-docs/architecture.md
@~/work/platform-docs/glossary.md

Upstream contracts I consume:
@~/work/auth-router/contracts/auth-events.avsc
@~/work/finipc-gateway/contracts/finipc.openapi.yaml
```

### When path-includes win
- Better token economy: pulls only the slices needed.
- Always reads current local state — no aggregation lag.
- Less infrastructure: no scheduled jobs, no parent repo to sync.
- Forces selectivity: each service declares which other-service files matter.

### When aggregation still earns its keep
- Non-Claude-Code consumer needs the aggregate (security, compliance, exec).
- CI workflows need a single pinned reference for the whole platform at a known commit.

### Required conventions
- Standardized local checkout layout (e.g., `~/work/<repo>` for everyone).
- Bootstrap script that clones canonical repos to that layout.
- Enterprise-managed `CLAUDE.md` declares the canonical layout once.

### Selectivity caveat
Don't `@`-include the aggregated `platform-context.md` from every service's `CLAUDE.md`. That recreates the worst of both worlds. Reference specific files (architecture, glossary, relevant upstream contracts) and let the working session retrieve more on demand.

---

## Consistency model

Cross-repo context is a distributed system; the messages happen to be markdown files. You cannot have both strong consistency and operational simplicity. Pick where to put the consistency boundary based on the consumer.

### Not Byzantine — eventual consistency

Byzantine implies adversarial or arbitrary failures. The actual problem is **staleness across independently-versioned working copies**. Both aggregation and path-includes have it; aggregation centralizes the staleness, path-includes distribute it.

Cannot be eliminated without monorepo or submodules. Right question: where does the consistency boundary go, and who needs which guarantee?

### Split by consumer

#### Live developer (exploratory work)
Tolerates eventual consistency. Their PR goes through CI which catches drift. They need **visible** staleness so they can decide when to sync.

```bash
#!/usr/bin/env bash
# claude-bootstrap.sh — run before a Claude Code session.
# Outside Claude Code's sandbox so it's not blocked by managed hook restrictions.
set -euo pipefail

REPOS=(platform-docs auth-router finipc-gateway settlement-matcher)
THRESHOLD_DAYS=7

for repo in "${REPOS[@]}"; do
  pushd "$HOME/work/$repo" > /dev/null
  git fetch --quiet
  behind=$(git rev-list --count HEAD..origin/main)
  last_local=$(git log -1 --format=%ct)
  age_days=$(( ($(date +%s) - last_local) / 86400 ))
  warn=""
  if [ "$age_days" -gt "$THRESHOLD_DAYS" ]; then warn=" ⚠ STALE"; fi
  printf "%-25s  %3s commit(s) behind  %3s days old%s\n" \
    "$repo" "$behind" "$age_days" "$warn"
  popd > /dev/null
done
```

#### CI / automated pipelines (producing deliverables)
Need strong consistency. Run in **fresh containers**, clone everything to HEAD at job start. Pin `platform-docs@<sha>` if it exists.

### Practical rules

- **Stamp every artifact with provenance.** `<!-- Generated: <git-sha> at <timestamp> -->` header on every `CONTEXT.md`.
- **Pin from CI, drift from local.** Different consistency contracts for different consumers.
- **Name a staleness budget.** "If platform-docs is more than N days stale, sync before relying on it."
- **Don't carry binding invariants in markdown.** Anything that must be consistent across services (critical contracts, ID schemes, security policies) belongs in shared libraries with version pinning.

---

## BMAD integration

BMAD doesn't need special accommodation. Tree-sitter, regenerators, and CI gates run inside the existing PR pipeline.

### Changes in BMAD

- **Story template** gets a "Context impact" line: does this story change anything in `CONTEXT.md` prose?
- **Architecture document** declares `CONTEXT.md` the canonical per-service source of truth, displacing prior `PLATFORM_CONTEXT.md` flavors.
- **Definition of done** includes:
  - Contract changes paired with `CONTEXT.md` prose updates (mechanism #1).
  - Auto-generated section fresh (mechanism #2).
  - CI green.

The agentic flow (planning agents in platform repo, execution agents in service repos) doesn't change. The 1:1 story-to-PR contract still holds.

### What this gives BMAD
- **Stable context anchor** for execution agents: `CONTEXT.md` + `contracts/` is the ground truth, not the codebase at large.
- **Drift detection in the development loop**: if a story produces a contract change without context update, CI fails before merge.
- **Composable cross-service reasoning**: planning agents `@`-include relevant service `CONTEXT.md` files and reason against current state without source.

---

## Determinism reminders for LLM consumers

### Layered enforcement (weakest → strongest)

1. **Prompt-level schemas**: describe output in prompt. Will drift. Don't rely on for load-bearing work.
2. **Tool use / function calling**: model trained to emit schema-matching JSON.
3. **Constrained decoding**: logits masked at sampling time to enforce a grammar. Guarantees structural conformance.
4. **Semantic validation**: even with constrained decoding, values inside the structure can be wrong. Validate, retry, or use verification pass.

### Determinism notes
- `temperature=0` is necessary but not sufficient.
- Seed parameters help but aren't bit-exact across deployments.
- For load-bearing determinism, control the inference stack (vLLM, deterministic flags, fixed batch, fixed seed).

### Patterns that work
- **Pydantic + Instructor** (Python) or **Zod + ai-sdk** (TS): schema-first with constrained generation and typed retry loops.
- **Contract tests against the LLM call**: golden inputs, asserted output structures, run on every prompt or model change.
- **Two-pass verification**: generate with constraints, then verify with separate call or deterministic validator.
- **Ensemble + majority vote** for high-stakes categorical outputs.

Mental model: structured outputs make the LLM honor a wire contract, but not yet a behavioral contract. The first you enforce mechanically; the second you still test for.

---

## Failure modes to avoid

- **Summaries of summaries.** Error compounds. Always generate from source.
- **LLM-paraphrased contracts.** Softens critical constraints. Quote or link; never summarize.
- **Embedding-only RAG without structural overlay.** Loses architectural relationships.
- **Universal context inclusion.** Burns attention budget even when it fits.
- **Auto-generated sections with non-deterministic content.** If output changes between runs without source changing, it doesn't belong there.
- **Documentation-as-wiki.** No PR gate, no enforcement, decays immediately.
- **CONTEXT.md as developer documentation.** Conflates two consumers. Keep ruthlessly cross-service-only.
- **Cross-repo paths without a layout convention.** Works on author's machine, breaks for everyone else.

---

## Implementation order

1. Pick one service. Hand-write `CONTEXT.md` to the template. ~15 min.
2. Write one mechanical extractor (tree-sitter query for whichever extraction isn't already in `contracts/`). ~1 hour.
3. Add the regenerator + "fails if dirty" CI check. ~1 hour.
4. Add the contracts-changed-requires-prose-update gate. ~30 min.
5. **Apply the template unchanged to a second service.** If it doesn't fit, fix the template before scaling. Most valuable feedback in the exercise.
6. Decide path-includes vs aggregation based on whether non-Claude-Code consumers exist.
7. **If path-includes**: standardize local layout; ship `claude-bootstrap`; encode layout in enterprise managed `CLAUDE.md`.
8. **If aggregation**: scheduled job pulls per-service `CONTEXT.md` files, concatenates, commits to `platform-docs`.

---

## Decision tree

```
Is there a non-Claude-Code consumer that needs the platform-wide view?
│
├── No  →  Path-includes from each service's CLAUDE.md
│         + bootstrap script for staleness visibility
│         + provenance stamps on each CONTEXT.md
│
└── Yes →  Aggregation in platform-docs
          + per-service CONTEXT.md still owned in service repos
          + CI consumes platform-docs@<sha> for strong consistency
          + local devs may still use path-includes for token economy
```

The two approaches are not mutually exclusive. Mature setups often use both.

---

## Quick reference: what a session needs

```markdown
# CLAUDE.md

@./CONTEXT.md
@./PLATFORM_CONTEXT_PATTERN.md   # this file

# Cross-service references for current work:
@~/work/platform-docs/architecture.md
@~/work/<upstream-service>/CONTEXT.md
@~/work/<upstream-service>/contracts/<relevant>.yaml
```

Keep cross-service includes minimal — only the services genuinely involved in the current change. The point is selective hydration, not maximal context.
