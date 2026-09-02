# Dashboard Widget Experience Simplification Proposal

**Status:** Proposed  
**Stack:** React + Vite 8 + TypeScript  
**Scope:** Dashboard metric widgets with independent components and domain-specific IDLs

## Executive summary

The dashboard widgets currently expose the metric, status, target, context, chart, labels, help, favorite, and export controls at the same visual priority. The information is useful, but the cards are difficult to scan because the user must process all of it at once.

This proposal introduces a **glance → inspect → act** experience:

1. **Glance:** The default card shows the metric name, current value, meaningful change, context, target, and a quiet trend.
2. **Inspect:** Selecting the card opens a right-side inspector without leaving or resetting the dashboard.
3. **Act:** Help, export, favorite, and other utility actions live in one overflow menu or inside the inspector.

The implementation should remain intentionally small. Each widget keeps its existing IDL, data logic, and React component. Widgets map their domain data to a tiny shared view model and render it through a small set of shared presentation components. This avoids a universal widget schema, a generic runtime renderer, or a large migration.

---

## Problem statement

The current cards present too many simultaneous signals:

- title, qualifier pills, favorite, help, and export controls;
- primary value, zero-value delta, numerator/denominator, target, and status badge;
- traffic-light chart segments, target lines, reference lines, points, grids, and dense axis labels.

Several elements communicate the same fact. For example, a value above a visible target, a green chart segment, and an `On Track` pill all say that the metric is healthy. Repetition adds visual weight without adding meaning.

The result is a dashboard made of independently understandable cards that is nevertheless hard to scan and compare.

## Goals

- Make the current state of every metric understandable in a few seconds.
- Make exceptions easier to find than healthy metrics.
- Keep the user on the dashboard while inspecting details.
- Preserve all existing capability, data calculations, time filters, and widget ownership.
- Standardize information placement across widgets without forcing every widget into one data IDL.
- Make migration incremental and reversible.

## Non-goals

- Rewriting widget data-fetching or calculation logic.
- Replacing the existing chart library.
- Creating a universal JSON-driven widget renderer.
- Combining all widget IDLs into one large schema.
- Redesigning the dashboard navigation, filtering model, or data pipeline.
- Adding a new state-management or design-system dependency unless the application already needs one.

---

## Experience design

### 1. Default card: answer three questions

Every default metric card should answer:

1. What is this metric?
2. What is its current value?
3. Does it require attention?

Use the same four visual zones in the same order:

| Zone | Default content |
| --- | --- |
| Header | Metric title, optional inline qualifier, overflow menu |
| Summary | Primary value and meaningful delta |
| Context | Numerator/denominator or short qualifier, plus quiet target |
| Trend | Minimal trend line and target threshold |

Anything else belongs in the inspector or overflow menu.

### 2. Use exception-based status

Do not permanently display `On Track` or equivalent healthy-state pills. A value above a clearly labeled target already communicates health.

Show explicit status only when the user needs to notice or understand an exception:

| Status | Default-card treatment |
| --- | --- |
| Healthy / on track | No badge |
| At risk | Amber label or icon with text |
| Off track | Red label or icon with text |
| Stale data | Neutral warning with last-updated context |
| Incomplete data | Neutral warning with coverage context |

Status must never rely on color alone.

### 3. Remove low-information values

- Hide deltas that resolve to zero, including `0%` and `-0%`.
- Prefer `12 of 13 repositories` to a bare `12 / 13 repos` when space permits.
- Use percentage **points** for changes between percentages, such as `↑ 8 pts`, unless the underlying calculation is truly percent change.
- Keep target copy compact, such as `Target ≥90%`.
- Place qualifiers inline with the title, such as `Heavy AI Users · Core`, instead of using another pill.

### 4. Make charts quieter

Default chart rules:

- Use one neutral or brand-colored trend line.
- Use a single dashed target line with a short endpoint label.
- Remove persistent point markers except for the latest value or keyboard/hover focus.
- Reduce grid lines to the minimum needed for interpretation.
- Reduce x-axis labels based on card width; do not label every period by default.
- Do not color the entire line red, yellow, and green as it crosses thresholds.
- Use semantic color for exceptions, annotations, and selection—not as constant decoration.
- Preserve exact values in the tooltip and accessible description.

### 5. Consolidate utility actions

Replace the permanent favorite, help, and download icons with one overflow menu:

- About this metric
- View details
- Download data
- Add to or remove from favorites

If favorite is a high-frequency action supported by usage evidence, it may appear on card hover and keyboard focus. It should still be available in the menu for touch users.

### 6. Inspect without navigating away

Selecting the card—or choosing `View details`—opens a right-side inspector. The dashboard remains mounted and retains its scroll position, filters, and date range.

The inspector may contain:

- current value, target, status, and last updated time;
- a larger chart with richer axes and tooltips;
- metric definition and calculation;
- breakdown or contributing entities;
- data-quality notes;
- export and favorite actions.

Only build inspector sections for information the widget already has. Do not add empty placeholders or invent data to make every inspector identical.

---

## Proposed component design

Keep each existing widget component. Introduce only three shared UI concepts:

1. `MetricCard` — common card layout, keyboard behavior, header, summary, context, status exception, and overflow trigger.
2. `MetricTrend` — a thin adapter around the existing chart library that applies the simplified card-chart defaults.
3. `MetricInspector` — one dashboard-level side panel whose content is supplied by the selected widget.

The dashboard owns only the selected inspector state:

```ts
type SelectedWidget = {
  id: string;
  inspector: React.ReactNode;
} | null;
```

Avoid a new global store for this. Local state or the dashboard's existing state mechanism is sufficient.

### Suggested file layout

Adapt names to the existing repository rather than creating a parallel convention.

```text
src/
  components/metrics/
    MetricCard.tsx
    MetricTrend.tsx
    MetricInspector.tsx
    metric-card.css
    metric-types.ts
  widgets/
    open-spec/
      OpenSpecWidget.tsx
      openSpec.idl.ts
      toMetricCardModel.ts
    heavy-ai-users/
      HeavyAiUsersWidget.tsx
      heavyAiUsers.idl.ts
      toMetricCardModel.ts
```

If equivalent shared components or folders already exist, extend them instead of duplicating them.

## Preserve domain IDLs with a small presentation model

Each widget should keep its own IDL as the source of truth. The widget maps its IDL result to a small, internal presentation model:

```ts
export type MetricStatus =
  | "healthy"
  | "at-risk"
  | "off-track"
  | "stale"
  | "incomplete";

export interface MetricCardModel {
  id: string;
  title: string;
  qualifier?: string;
  value: string;
  delta?: {
    text: string;
    direction: "up" | "down" | "flat";
    meaning: "positive" | "negative" | "neutral";
  };
  context?: string;
  target?: {
    label: string;
    value: number;
  };
  status: MetricStatus;
  accessibleSummary: string;
}
```

Keep chart series and action callbacks as component props rather than forcing them into this model:

```tsx
<MetricCard
  model={model}
  actions={actions}
  onInspect={() => openInspector(widgetId, inspectorContent)}
>
  <MetricTrend
    series={series}
    target={model.target?.value}
    formatValue={formatPercent}
  />
</MetricCard>
```

This boundary provides consistent presentation while leaving each widget responsible for domain semantics. For example, only the widget knows whether an upward delta is good, bad, or neutral.

### IDL changes

Do not change an IDL merely to match the shared component. First derive the presentation model from fields that already exist.

Add optional IDL fields only when the information is genuinely part of the widget contract and cannot be derived safely—for example, a missing target comparator, human-readable denominator label, or data freshness timestamp. Keep such changes additive and backward compatible.

Do not put the following in the IDL:

- React component names;
- CSS classes or colors;
- icon names;
- drawer state;
- menu callbacks;
- chart-library configuration.

---

## Concrete examples

### OpenSpec for SDD

Default card content:

- Title: `OpenSpec for SDD`
- Value: `92%`
- Delta: hidden if zero; otherwise something meaningful such as `↑ 46 pts since May`
- Context: `12 of 13 repositories`
- Target: `Target ≥90%`
- Healthy status: no `On Track` pill
- Trend: one-color line, quiet dashed 90% target, latest point only

### Heavy AI Users

Default card content:

- Title: `Heavy AI Users · Core`
- Value: `83%`
- Delta: hidden if zero
- Context: `30 of 36 team members`
- Target: `Target ≥70%`
- Healthy status: no `On Track` pill
- Trend: one-color line instead of continuous red/yellow/green segments

---

## Interaction and accessibility requirements

- The card may be selectable, but nested buttons and menu items must remain independently operable.
- Use a real button for the overflow trigger and a proper menu implementation from the existing design system.
- Open the inspector from keyboard activation as well as pointer input.
- Move focus into the inspector on open and restore it to the invoking card on close.
- Support `Escape` to close the inspector.
- Give charts a concise accessible summary; do not require screen-reader users to traverse every plotted point.
- Ensure status text is available alongside semantic color.
- Tooltips must work with keyboard focus, not hover alone.
- Respect reduced-motion preferences.
- Preserve a minimum 44×44 CSS-pixel touch target for interactive controls.

## Responsive behavior

- Keep information order identical at every breakpoint.
- Allow the header title to wrap before hiding meaningful content.
- Reduce chart ticks at narrower widths.
- On narrow screens, render the inspector as a full-height modal sheet instead of squeezing the dashboard and panel side by side.
- Never reveal controls only on hover; hover may duplicate controls that remain accessible elsewhere.

---

## Implementation plan

### Phase 1: Shared foundation and pilot

1. Inventory the existing card shell, chart wrapper, menu, drawer/dialog, tokens, and accessibility primitives.
2. Capture current screenshots and tests for `OpenSpec for SDD` and `Heavy AI Users`.
3. Add the small `MetricCardModel` type and shared `MetricCard` layout.
4. Add simplified chart defaults through the existing chart wrapper.
5. Create per-widget mapping functions for the two pilot widgets.
6. Remove redundant healthy badges, zero deltas, permanent utility icons, and qualifier pills from the pilot cards.
7. Verify behavior with existing dashboard date controls and responsive layouts.

### Phase 2: Inspector and actions

1. Add one dashboard-level `MetricInspector` using existing drawer/dialog primitives.
2. Move metric explanation, richer detail, download, and favorite actions into the inspector or overflow menu.
3. Preserve focus, scroll position, filters, and selected date range.
4. Add analytics only if the application already has an analytics convention: card inspection, menu action, inspector close.

### Phase 3: Incremental migration

1. Migrate remaining metric widgets one at a time.
2. Keep specialized widgets specialized; use the shared shell only where the four-zone metric layout fits.
3. Delete obsolete duplicated card styling after the final consumer migrates.
4. Document the small mapping contract for future widgets.

Do not block migration on converting every widget. The two pilot widgets should prove the pattern before expanding it.

---

## Testing strategy

### Unit tests

- Zero and negative-zero deltas are omitted.
- Non-zero deltas are formatted correctly.
- Healthy status does not render a badge.
- At-risk, off-track, stale, and incomplete states render visible text.
- Qualifiers render inline with the title.
- Target comparators and accessible summaries are correct.
- Each widget's IDL-to-view-model mapper preserves its domain semantics.

### Interaction tests

- Overflow menu works by mouse, keyboard, and touch.
- Selecting a card opens the correct inspector.
- Closing restores focus to the invoking card.
- Dashboard filters and scroll position remain unchanged.
- Export and favorite actions still call their existing handlers.

### Visual and responsive tests

Capture at minimum:

- standard desktop grid;
- narrow desktop/tablet grid;
- mobile or the application's smallest supported width;
- healthy, off-track, stale, and incomplete states;
- long title and long context text;
- inspector open and closed.

Compare information hierarchy and alignment across cards, not only each card in isolation.

---

## Acceptance criteria

The change is complete when:

- Every pilot card presents title, value, context, target, and trend in consistent locations.
- Healthy pilot cards do not display `On Track` pills.
- Zero-value deltas do not render.
- Utility actions are consolidated into one overflow menu.
- Qualifiers such as `Core` are inline text rather than pills.
- Default charts use one trend color, a quiet target line, and materially fewer persistent markers and grid lines.
- Selecting a pilot card reveals details without navigating away or resetting dashboard state.
- Existing calculations, time filters, downloads, favorites, and data loading behave as before.
- Keyboard and screen-reader behavior meets the interaction requirements above.
- No universal widget IDL, generic runtime renderer, new global store, or unnecessary dependency is introduced.

## Success measures

Use lightweight evidence rather than a large research effort:

- fewer visible controls and badges per default card;
- faster identification of the lowest-performing or exception widget in a short usability check;
- no increase in clicks for the primary dashboard task of scanning current state;
- no loss of use for export, favorite, help, or detailed inspection;
- fewer widget-specific layout rules as migration progresses.

---

## Implementation brief for Claude or Codex

Use the following as the execution prompt after providing repository access:

> Implement the dashboard widget simplification described in this proposal for our React + Vite 8 application. Simplicity and incremental change are the highest priorities.
>
> First inspect the repository's existing widget IDLs, component structure, card/chart wrappers, design tokens, menu/drawer primitives, tests, and repository instructions. Reuse existing primitives and naming. Do not introduce a universal widget schema, generic JSON renderer, new global state library, or new UI dependency unless the repository has no suitable accessible primitive and you explain the need before adding it.
>
> Pilot the design on `OpenSpec for SDD` and `Heavy AI Users`. Preserve their IDLs, calculations, loading/error states, date filtering, favorites, exports, and chart data. Add a small internal `MetricCardModel` and per-widget mapping functions. Build or adapt a shared `MetricCard`, simplified `MetricTrend`, and one dashboard-level `MetricInspector`.
>
> Hide healthy status badges and zero/negative-zero deltas. Render qualifiers inline with titles. Consolidate help, export, favorite, and detail actions into an accessible overflow menu. Use a single-color default trend, quiet target line, reduced grid/ticks, and only the latest persistent point. Show explicit status only for at-risk, off-track, stale, or incomplete states.
>
> Work in small, reviewable steps. Before editing, report the files and existing primitives you plan to reuse. After implementation, run the relevant type-check, lint, unit, and interaction tests. Provide before/after screenshots at supported desktop and narrow breakpoints, list changed files, and note any behavior or IDL changes. Do not migrate other widgets until the two pilot widgets are verified.

## Guiding principle

> **Show state by default. Reveal explanation on demand. Reveal actions when the user intends to act.**

