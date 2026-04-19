# Jira + GitHub Delivery Metrics: Implementation Recommendation

Target runtime: stateless AWS Lambda, 512 MB. Inputs: a known set of Jira story keys. Outputs: five metrics covering story cycle time and PR lifecycle behavior.

## Context and assumptions

- **Workflow**: Jira stories flow `Backlog → Ready → {intermediate statuses} → Accepted`. Ready is the explicit start anchor. Accepted is the explicit terminal state (equivalent to Closed/Done in this workflow).
- **Story-PR linkage**: 1:1 under BMAD Spec-Driven Development. Each Jira story maps to exactly one PR. Linkage is discovered via story key match in PR title, body, or branch ref.
- **PR scope for metrics 3, 4, 5**: Open PRs plus the last 30 closed/merged PRs, then down-sampled to only those tied to a story in the input set.
- **Metric 3 is an SLA, not a central tendency**: Ready for Review → Merged must be under 24 hours (continuous deployment rule). Compliance rate is the headline number; average is secondary.
- **PR lifecycle duration is intrinsic**: It is independent of when PRs were opened relative to one another. The 30-PR sample is valid regardless of the window it spans.

## Metrics

### 1 & 2. Story cycle time (Ready → Accepted)

Metric 2 returns per-story durations. Metric 1 is the aggregate over metric 2's list.

**API call**: one bulk Jira search with the full story-key set in a JQL `IN` clause.

```
GET /rest/api/3/search/jql
  ?jql=key in (ABC-1,ABC-2,...)
  &expand=changelog
  &fields=resolutiondate,status,created
  &maxResults=100
```

Paginate if the input exceeds 100 keys. JQL `IN` clauses have a practical upper bound around a few thousand keys; chunk the input if you ever approach that.

**Computation per story**:

1. Walk `changelog.histories` in chronological order.
2. Filter to entries where `items[].field == "status"`.
3. `ready_at` = timestamp of the **first** history entry where `toString == "Ready"`.
4. `accepted_at` = timestamp of the **last** history entry where `toString == "Accepted"`, or fall back to `fields.resolutiondate` if reopens are not permitted in your workflow.
5. If `ready_at` is missing, exclude the story and emit it as a data-quality issue. Do not impute.
6. Duration = `accepted_at − ready_at`, normalized to UTC before subtraction.

**Output shape**:

```json
{
  "stories": [
    { "key": "ABC-1", "ready_at": "...", "accepted_at": "...", "duration_hours": 47.2 }
  ],
  "average_hours": 52.8,
  "median_hours": 41.0,
  "excluded": [{ "key": "ABC-9", "reason": "never_entered_ready" }]
}
```

Report both mean and median. Cycle time distributions are right-skewed, and the mean alone will mislead consumers.

### 3. PR lead time to value (Ready for Review → Merged), 24h SLA

**Scope**: merged PRs only, filtered to those whose title, body, or `head.ref` contains a story key from the input set.

**Headline output**: compliance rate — fraction of PRs where `merged_at − ready_at < 24h`.

**ready_at resolution per PR**:

- If the PR has at least one `ready_for_review` timeline event, `ready_at` = timestamp of the **first** such event.
- If no `ready_for_review` events exist, the PR was never a draft. `ready_at` = `created_at`.

**Output shape**:

```json
{
  "total_prs": 18,
  "compliant": 16,
  "compliance_rate": 0.889,
  "violations": [
    { "number": 4821, "story": "ABC-7", "duration_hours": 31.4, "merged_at": "..." }
  ],
  "p50_hours": 3.2,
  "p95_hours": 19.7,
  "max_hours": 31.4,
  "average_hours": 6.1
}
```

The violation list is the actionable output. Percentiles show whether the team has margin against the SLA or is running close to the line.

### 4. Average time a PR is in Draft

**Scope**: all PRs in the filtered set (open and closed/merged).

**Computation per PR**:

Walk the PR timeline and build closed draft intervals:

- A draft interval opens at `created_at` if the PR was created as a draft (inferable: earliest `ready_for_review` event exists with no prior `convert_to_draft`, and `created_at < first_ready_for_review`).
- A draft interval also opens at each `convert_to_draft` event.
- Each interval closes at the next `ready_for_review` event, or at `closed_at` / now if the PR is still in draft.

Sum the intervals per PR. Average across the set.

**Recommendation**: report two numbers. Average draft time across **all** PRs treats no-draft PRs as 0 and tells you how much drafting the team does overall. Average draft time across PRs that **actually drafted** tells you how long drafts sit when they happen. Also report the fraction of PRs that used draft at all — it's a behavioral signal independent of duration.

### 5. Full PR lifetime (Created → Merged)

**Scope**: merged PRs only, filtered to story-linked set.

Trivial: `merged_at − created_at`. No timeline call needed — both fields are on the PR list response. Report average, median, and max.

## Recommended API strategy

### Jira

One bulk search call. Request `expand=changelog` only if reopens are possible in your workflow; otherwise `resolutiondate` alone is sufficient and the response is dramatically smaller. For a 512 MB Lambda, the smaller response matters — changelogs on old stories can be verbose.

### GitHub: use GraphQL

REST would require one call each for open PRs and closed PRs, then N timeline calls for metrics 3 and 4. GraphQL collapses this to one query.

```graphql
query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    open: pullRequests(states: OPEN, first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes { ...prFields }
    }
    closed: pullRequests(states: [MERGED, CLOSED], first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes { ...prFields }
    }
  }
}

fragment prFields on PullRequest {
  number
  title
  body
  headRefName
  createdAt
  mergedAt
  closedAt
  isDraft
  timelineItems(first: 50, itemTypes: [READY_FOR_REVIEW_EVENT, CONVERT_TO_DRAFT_EVENT]) {
    nodes {
      __typename
      ... on ReadyForReviewEvent { createdAt }
      ... on ConvertToDraftEvent { createdAt }
    }
  }
}
```

Filter client-side on `title`, `body`, `headRefName` for story keys via `/([A-Z]+-\d+)/g`.

Watch the timeline `first: 50` cap. A PR that has toggled draft/ready more than 25 times is pathological but possible. If you see the cap hit, page the timeline for that specific PR. In practice this will be rare enough that a fallback path is acceptable.

### Total API cost for a typical run

- 1 Jira call (bulk search, paginated if needed)
- 1 GitHub GraphQL call

For N up to roughly 100 stories and the fixed 30-closed-PR window, this fits comfortably in a 512 MB Lambda with room for computation and response assembly.

## Lambda-specific considerations

- **No state between invocations**: every run is a full fetch. Don't cache changelog data across invocations unless you add external storage. For this scope, it's not worth it.
- **Memory ceiling**: the Jira changelog response is the largest payload. If you start hitting memory pressure at high N, stream-parse the JSON rather than loading the full response into memory, or drop the `expand=changelog` and rely on `resolutiondate`.
- **Timeout budget**: one Jira call plus one GraphQL call is well under typical Lambda timeouts. The risk is Jira pagination for large N — respect page size and parallelize page fetches with `Promise.all` if needed.
- **Timezone**: Jira and GitHub both return ISO 8601 with offset. Parse to UTC epoch before any subtraction. Never diff raw strings.
- **Error surfaces to handle explicitly**:
  - Story key present in input but not in Jira response (deleted, moved project, typo).
  - PR matched to a story key but PR is from a fork with restricted timeline access.
  - Merged PR with `merged_at` null (shouldn't happen, but guard against it).
  - Timeline cap hit on a PR (log and flag, don't silently truncate).

## Output contract

One recommended top-level shape for the Lambda response. Consumers can pick the fields they need:

```json
{
  "generated_at": "2026-04-18T14:22:00Z",
  "input": { "story_keys": ["ABC-1", "ABC-2"], "pr_window": "open + last 30 closed" },
  "story_cycle_time": { /* metrics 1 & 2 */ },
  "pr_lead_time_sla": { /* metric 3 */ },
  "pr_draft_time": { /* metric 4 */ },
  "pr_full_lifetime": { /* metric 5 */ },
  "data_quality": {
    "stories_missing_ready_transition": [],
    "prs_with_truncated_timeline": [],
    "stories_not_found": []
  }
}
```

The `data_quality` block is not optional. Silent exclusion is how metrics lie. Surface every excluded item with a reason so consumers can fix inputs or workflows.

## Summary of changes from a naive implementation

| Concern | Naive approach | Recommended approach |
|---|---|---|
| Jira fetch | N calls, one per story | 1 bulk search with `IN` clause |
| GitHub fetch | REST list + N timeline calls | 1 GraphQL query with timeline inline |
| Metric 3 framing | Average duration | Compliance rate + violation list + percentiles |
| Cycle time central tendency | Mean only | Mean and median |
| Excluded data | Silently dropped | Surfaced in `data_quality` block |
| Draft time metric | Single number | Two numbers (all PRs vs drafted PRs) + draft adoption rate |
