# Synthesize and Distribute `PLATFORM.md` Across Submodules

A two-stage operational guide. Stage 1 uses BMAD v6.6 at a parent `platform-docs` repo to crawl ~5 submodules and synthesize a single `PLATFORM.md`. Stage 2 fans that file out to each submodule on a new branch with an open PR.

Designed to run locally from Claude Code. No GitHub Actions, no Jenkins job required.

---

## Prerequisites

- BMAD v6.6.0 installed (`npx bmad-method install` at the parent repo root)
- Node.js 20+ on the local machine
- `git` CLI with submodule support
- A GitHub PAT with `repo` scope, stored at `~/.<your-pat-file>` or in an env var
- All submodules checked out: `git submodule update --init --recursive`
- The submodules are tracked in `.gitmodules` at the parent repo root

Placeholders to fill in later are tagged `<FILL:NAME>` throughout.

---

## Stage 1: Parent BMAD workspace setup

### 1.1 Install BMAD at the parent repo

From the parent `platform-docs` repo root:

```bash
npx bmad-method install
```

When prompted, select the BMM module (the standard analyst/PM/architect/dev set). You can skip BMGD, CIS, and other domain modules unless your team needs them.

This creates `_bmad/` at the parent root. The submodule directories are siblings of `_bmad/` and are visible to any agent run from this workspace.

### 1.2 Create the custom workflow directory structure

```
platform-docs/
├── .gitmodules
├── _bmad/
│   ├── bmm/                                    # BMAD-managed, do not edit
│   └── custom/
│       └── workflows/
│           └── synthesize-platform/
│               ├── workflow.yaml               # workflow definition
│               ├── instructions.md             # agent procedure
│               └── platform-template.md        # output template
├── <submodule-1>/
├── <submodule-2>/
├── <submodule-3>/
├── <submodule-4>/
├── <submodule-5>/
└── scripts/
    └── sync-platform-md.mjs                    # distribution script (Stage 2)
```

Create the `_bmad/custom/workflows/synthesize-platform/` directory:

```bash
mkdir -p _bmad/custom/workflows/synthesize-platform
```

### 1.3 `workflow.yaml`

```yaml
name: synthesize-platform
description: Crawl all git submodules and produce PLATFORM.md at workspace root
phase: planning
agent: architect
inputs:
  - source: gitmodules
    path: ./.gitmodules
outputs:
  - path: ./PLATFORM.md
    description: Single source of truth describing the platform across all submodules
```

### 1.4 `instructions.md`

This is the procedural prompt the agent runs. Tune Step 2 to your stack (Java/Spring vs Node, etc.).

```markdown
# Synthesize PLATFORM.md from submodules

## Step 1: Enumerate submodules
Read `.gitmodules` at the workspace root. Extract each `path = ...` value.
Build a list of submodule paths to process.

## Step 2: Per-submodule context gathering
For each submodule path, read in priority order until token budget is reached:

1. `README.md` (full)
2. `docs/architecture.md` or `ARCHITECTURE.md` (full)
3. Build manifest: `package.json`, `pom.xml`, or `build.gradle`
   (extract: name, version, primary dependencies)
4. Source structure: `src/main/` or `src/` top-level packages, depth 2, directories only
5. `_bmad/manifests/architecture.md` if the submodule has its own BMAD install
6. Interface contracts: `openapi.yaml`, `proto/`, or equivalent

For each submodule, capture:
- Service name and one-line purpose
- Primary tech stack
- Public interfaces (HTTP routes, Kafka topics, events emitted/consumed, queues)
- Data stores (RDBMS, NoSQL, caches)
- Owning team / on-call rotation if discoverable

## Step 3: Synthesize using platform-template.md
Produce a single PLATFORM.md at the workspace root following the template structure.
The output is the canonical platform document that every submodule will receive.

## Step 4: Validate
- Every submodule path from `.gitmodules` appears in the output exactly once
- No `TODO`, `FIXME`, or placeholder text remains
- Output is under ~6000 tokens
- Run the bmad-checkpoint-preview skill on the result before declaring complete
```

### 1.5 `platform-template.md`

```markdown
# Platform: <FILL:PLATFORM_NAME>

## Overview
<One paragraph describing the platform's purpose, business domain, and scope.>

## Services

| Service | Purpose | Tech Stack | Owner |
|---------|---------|------------|-------|
<One row per submodule>

## Cross-Cutting Concerns

### Authentication & Authorization
<How services authenticate to each other and to external callers.>

### Observability
<Logging, metrics, tracing standards across the platform.>

### Settlement / Domain Flows
<Key end-to-end flows that touch multiple services.>

## Inter-Service Contracts

<Diagram or prose describing who calls whom. Include event topics, queues,
and synchronous APIs. Source-of-truth for contract validation work.>

## Data Stores
<List of databases, caches, and queues. Which service owns which.>

## Glossary
<Platform-specific terms. Include domain language that reviewers should know.>

---
_Generated by the `synthesize-platform` BMAD workflow at `<FILL:PARENT_REPO_NAME>`._
_Source commit: `<FILL: filled in by the workflow at runtime>`_
```

---

## Stage 1 execution: run the synthesis

From the parent repo root, in Claude Code:

```
*workflow synthesize-platform
```

(Use whatever invocation pattern your v6.6 install uses; the slash command varies by IDE adapter.)

The agent will:
1. Read `.gitmodules` and build the submodule list
2. Walk each submodule and gather context
3. Write `PLATFORM.md` at the parent root
4. Run `bmad-checkpoint-preview` for human review

**Critical:** review the output before continuing. The fan-out script in Stage 2 will push this content to 5 PRs. Hallucinated platform claims will land in real repos if you skip the review step.

If the output is wrong or thin, iterate on `instructions.md` and re-run. Common fixes:
- Add more priority files to Step 2 if a submodule's surface area isn't being captured
- Tighten Step 3 if the output is too verbose
- Restrict to specific submodules during testing by editing the workflow input filter

---

## Stage 2: Distribution script

### 2.1 Create the script

`scripts/sync-platform-md.mjs`:

```javascript
// Sync the parent's PLATFORM.md into every submodule on a new branch with a PR.
// Run from the parent repo root: node scripts/sync-platform-md.mjs

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const TOKEN = process.env.GH_TOKEN;
const GH_HOST = process.env.GH_HOST || 'api.github.com';
const ORG = process.env.GH_ORG;
const STAMP = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const BRANCH = `chore/platform-md-${STAMP}`;
const SOURCE = 'PLATFORM.md';

if (!TOKEN || !ORG) {
  console.error('Missing GH_TOKEN or GH_ORG environment variable.');
  process.exit(1);
}

const parentSha = execSync('git rev-parse HEAD').toString().trim();
const gitmodules = readFileSync('.gitmodules', 'utf8');
const paths = [...gitmodules.matchAll(/path\s*=\s*(.+)/g)].map(m => m[1].trim());
const platformContent = readFileSync(SOURCE, 'utf8');

const results = [];

for (const path of paths) {
  const repoName = basename(path);
  console.log(`\n=== ${repoName} ===`);
  const sh = (cmd) => execSync(cmd, { cwd: path, stdio: 'pipe' }).toString().trim();

  try {
    // Resolve actual default branch; do not assume main
    const defaultBranch = sh('git symbolic-ref refs/remotes/origin/HEAD')
      .replace('refs/remotes/origin/', '');

    sh(`git fetch origin ${defaultBranch}`);
    sh(`git checkout -B ${BRANCH} origin/${defaultBranch}`);

    writeFileSync(join(path, 'PLATFORM.md'), platformContent);

    sh('git add PLATFORM.md');
    sh(
      `git -c user.name="<FILL:BOT_NAME>" -c user.email="<FILL:BOT_EMAIL>" ` +
      `commit -m "chore: sync PLATFORM.md from <FILL:PARENT_REPO_NAME>" ` +
      `-m "Source commit: ${parentSha}"`
    );
    sh(`git push -u origin ${BRANCH}`);

    const res = await fetch(`https://${GH_HOST}/repos/${ORG}/${repoName}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: 'chore: sync PLATFORM.md from <FILL:PARENT_REPO_NAME>',
        head: BRANCH,
        base: defaultBranch,
        body: [
          'Auto-generated by the `synthesize-platform` BMAD workflow at `<FILL:PARENT_REPO_NAME>`.',
          '',
          `Source commit: \`${parentSha}\``,
          '',
          'Review for accuracy before merge. Reject if synthesis hallucinated platform claims.',
        ].join('\n'),
      }),
    });

    const pr = await res.json();
    if (pr.html_url) {
      console.log(`PR: ${pr.html_url}`);
      results.push({ repo: repoName, status: 'opened', url: pr.html_url });
    } else {
      console.log(`Failed: ${pr.message || JSON.stringify(pr)}`);
      results.push({ repo: repoName, status: 'failed', error: pr.message });
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
    results.push({ repo: repoName, status: 'error', error: err.message });
  }
}

console.log('\n=== Summary ===');
console.table(results);
```

### 2.2 Configuration placeholders

| Placeholder | What to fill in |
|-------------|-----------------|
| `<FILL:PARENT_REPO_NAME>` | Name of the parent repo, e.g., `platform-docs` |
| `<FILL:PLATFORM_NAME>` | Human-readable platform name |
| `<FILL:BOT_NAME>` | Git committer name (service account or your name) |
| `<FILL:BOT_EMAIL>` | Git committer email |
| `GH_TOKEN` env var | PAT with `repo` scope |
| `GH_ORG` env var | GitHub org that owns the submodule repos |
| `GH_HOST` env var | Optional. Default `api.github.com`. For GHES, use `<your-ghes>/api/v3` |

### 2.3 Run the distribution

```bash
GH_TOKEN=$(cat ~/.<FILL:PAT_FILE>) \
GH_ORG=<FILL:GH_ORG> \
node scripts/sync-platform-md.mjs
```

Output is per-repo PR URLs and a summary table at the end.

---

## End-to-end execution

The full flow, in order:

1. **Refresh submodules** (always do this before synthesis):
   ```bash
   git submodule update --init --recursive --remote
   ```

2. **Synthesize** in Claude Code:
   ```
   *workflow synthesize-platform
   ```

3. **Review** the generated `PLATFORM.md`. The `bmad-checkpoint-preview` skill walks you through this. Do not skip.

4. **Commit the source-of-truth** at the parent:
   ```bash
   git add PLATFORM.md
   git commit -m "Update PLATFORM.md via synthesize-platform"
   git push
   ```

5. **Distribute**:
   ```bash
   GH_TOKEN=$(cat ~/.<FILL:PAT_FILE>) GH_ORG=<FILL:GH_ORG> \
     node scripts/sync-platform-md.mjs
   ```

6. **Track PRs**. Each submodule team owns the merge of their PR. The bot identity in the commit makes it clear these are auto-generated.

---

## Troubleshooting

**Submodule directory is empty.** Run `git submodule update --init --recursive`. If a submodule is missing a `.git` directory or marker file, the script's `cwd: path` exec will fail with confusing errors instead of a clear "not initialized" message.

**Branch already exists on a re-run.** The branch name is timestamped to the minute, so a re-run within 60 seconds will collide. Either wait, or change the timestamp granularity in the script. Avoid `--force-with-lease` if your enterprise branch protection blocks force pushes on shared remotes.

**Default branch mismatch.** The script resolves each repo's default branch via `git symbolic-ref refs/remotes/origin/HEAD`. If a submodule's `origin/HEAD` is unset, this fails. Fix at the submodule with `git remote set-head origin --auto`, or hardcode a fallback in the script.

**PAT lacks scope.** The PR creation will fail with a 403 or 404. The token needs `repo` scope (or fine-grained equivalents: contents:write, pull-requests:write) on every target repo.

**Workflow output is too generic.** The agent is reading too few files per submodule, or the wrong files. Update Step 2 in `instructions.md` with stack-specific paths (e.g., `application.yaml` for Spring Boot, `serverless.yml` for Lambda repos). Run a single-submodule test first by temporarily filtering `.gitmodules`.

**Synthesis hallucinates contracts.** Add a Step 2.5 to `instructions.md` that requires the agent to cite the file path for every claim about an interface. If a claim has no source file, drop it. This is the single biggest accuracy lever.

---

## Extending the pattern

Once this works for `PLATFORM.md`, the same scaffold supports:

- `CONTRIBUTING.md` distribution from a central source
- Shared `.editorconfig` or lint configs synced across repos
- Architecture decision records (ADRs) that need to be visible from each component repo
- BMAD `instructions.md` skill files synced from a platform-docs canonical location

The synthesis workflow is reusable; only the template and the file written by the distribution script change.
