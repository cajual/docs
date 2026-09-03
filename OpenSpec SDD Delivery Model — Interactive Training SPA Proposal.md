# OpenSpec SDD Delivery Model — Interactive Training SPA Proposal

## 1. Purpose

Build a lightweight, visually engaging React SPA that teaches how teams use **OpenSpec-based Spec-Driven Development (SDD)** across the Product Development Lifecycle (PDLC) and Software Development Lifecycle (SDLC).

The site should not feel like documentation, a Jira workflow, or a traditional enterprise process diagram.

It should feel like an **interactive system map**.

A user should be able to understand the basic operating model in less than a minute, then progressively explore:

- Product and Engineering responsibilities
- INTENT and CONTEXT
- OpenSpec Explore
- Proposals
- Spec slicing
- Complexity / APAR gates
- Definition PRs
- Jira traceability
- Engineering implementation
- OpenSpec Apply
- Delivery PRs
- Product acceptance
- Sync / Archive
- Proposal completion
- Concurrent POD delivery

The primary design goal is:

> **Make a sophisticated delivery model feel simple.**

---

# 2. Core Training Message

The experience should continually reinforce five concepts.

## Proposal = Product Outcome

A Proposal represents a coherent product or business outcome.

A Proposal may contain **1..N Specs**.

It does not itself need to represent an independently deployable code change.

---

## Spec = Smallest Viable Slice

A Spec represents the smallest independently implementable, testable, deployable, and releasable behavioral delta.

Specs should be intentionally small enough to satisfy organizational Continuous Delivery and Automated Pre-Approved Release constraints.

---

## Definition PR = Makes the Spec Ready

A Spec initially exists as work in progress.

After Product and Engineering validate it and its Definition PR merges into the project repository, it becomes **Ready** work that an engineer can pull.

---

## Delivery PR = Makes the Spec Real

An engineer claims the Spec, runs OpenSpec Apply, implements the behavior, validates it, and submits the corresponding Delivery PR.

---

## Code + Specs Stay Together

Specs live in the same repository as the implementation to preserve provenance and traceability.

The repository is the durable source of truth.

Jira coordinates the work.

---

# 3. Core Delivery Invariant

The preferred operating model is:

> **1 Spec = 1 Jira Story = 1 Definition PR = 1 Delivery PR**

Teams may adapt branch naming and Jira workflow mechanics, but the conceptual relationship should remain intact wherever practical.

The hierarchy is:

```text
INTENT
   │
   ▼
PROPOSAL
   │
   ├── SPEC A ── Jira A ── Definition PR A ── Delivery PR A
   ├── SPEC B ── Jira B ── Definition PR B ── Delivery PR B
   └── SPEC C ── Jira C ── Definition PR C ── Delivery PR C
```

---

# 4. Ownership Model

The site should clearly communicate accountability without turning the primary visualization into a RACI diagram.

## Product Manager

Accountable for **INTENT**.

Product answers:

- What outcome do we need?
- Why does it matter?
- What behavior should change?
- What does success look like?
- What is the priority?
- Has the implemented behavior satisfied the requirement?

Typical Intent sources:

- PRD
- DRD
- Product strategy
- Business requirements
- Customer needs
- Regulatory requirements
- Direct Markdown

---

## Engineering Lead

Accountable for **CONTEXT**.

Engineering answers:

- What is already true?
- What technical boundaries exist?
- What architectural patterns apply?
- What NFRs apply?
- What implementation constraints exist?
- What organizational idioms must be followed?

Context may come from:

1. Existing project code and repository-local knowledge
2. Existing OpenSpec specifications
3. Engineering Lead guidance
4. Architecture documentation
5. Approved OKF knowledge bundles
6. Enterprise engineering standards

The Engineering Lead does not need to manually author all context.

The Engineering Lead is accountable for ensuring that the **context boundary is reliable and sufficient**.

---

## Product + Engineering

Jointly validate the **Spec**.

The Spec is where Product Intent and Engineering Context become a behavioral delivery contract.

---

## Engineer

Accountable for implementation of a claimed Spec.

The engineer:

- claims the Jira Story,
- creates an implementation branch,
- runs OpenSpec Apply,
- implements the required behavior,
- tests and validates the change,
- keeps current with `main`,
- opens the Delivery PR,
- responds to review,
- satisfies APAR/CD requirements,
- and merges the completed implementation.

---

# 5. Context Trust Model

CONTEXT should be presented as curated technical truth rather than arbitrary prompt material.

Use this conceptual hierarchy:

```text
                 CONTEXT
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
       CODE      ENGINEER     OKF
        +         GUIDANCE    BUNDLES
      REPO
         \          |          /
          \         |         /
           ── ENGINEERING ──
                LEAD
             ACCOUNTABLE
```

When generalized organizational knowledge conflicts with application reality:

> **Local repository and running-system truth take precedence over generalized organizational knowledge.**

OKF supplements system context.

It does not replace system context.

---

# 6. Context Gap Principle

OpenSpec Explore must not compensate for missing information through confident model inference.

The site should teach:

> **Never substitute model inference for missing authoritative context.**

If Explore identifies a material uncertainty:

```text
INTENT + CONTEXT
       │
       ▼
    EXPLORE
       │
       ├── sufficient ──────────► continue shaping
       │
       └── context gap
               │
               ▼
        ENGINEERING LEAD
               │
         clarify / enrich
               │
               └───────────────► EXPLORE
```

This interaction should be explicitly visualized.

---

# 7. Primary User Experience

The SPA should use **progressive disclosure**.

Do not initially display the entire workflow.

The initial screen should communicate only:

```text
INTENT + CONTEXT
       ↓
     SHAPE
       ↓
  READY SPECS
       ↓
    DELIVER
       ↓
    ACCEPT
       ↓
   RECONCILE
```

Each area is interactive.

Selecting an area smoothly expands or zooms the diagram into the relevant process.

The user should never need to interpret a giant process map.

---

# 8. Primary Screen

## Hero

Minimal introductory content:

**Spec-Driven Delivery**

> Turn product intent into small, validated changes that engineering can continuously pull and deliver.

Primary actions:

- **Explore the Flow**
- **Walk Through an Example**

Avoid large explanatory paragraphs.

---

## Main Interactive System Map

The visual centerpiece of the application.

Suggested conceptual composition:

```text
                 INTENT
                   │
                   ▼

             ┌───────────┐
             │   SHAPE   │
             └─────┬─────┘
                   │
                   ▼

        ╔════════════════════╗
        ║    READY SPECS     ║
        ╚═════════╤══════════╝
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
        POD A   POD B   POD C
          │       │       │
          └───────┼───────┘
                  ▼

             ┌───────────┐
             │  DELIVER  │
             └─────┬─────┘
                   │
                   ▼
                ACCEPT
                   │
                   ▼
              RECONCILE
                   │
                   └────────────► SYSTEM KNOWLEDGE
```

This should be graphical rather than box-heavy.

Use visual objects such as:

- cards,
- document sheets,
- repository shapes,
- arrows,
- spec tiles,
- engineer/POD clusters,
- Git branches,
- small status indicators,
- animated flow paths.

---

# 9. Three Core Interactive Views

The SPA should offer three conceptual levels of detail.

## View 1 — System

Default.

Shows:

**Intent + Context → Shape → Ready Specs → Deliver → Accept → Reconcile**

Purpose:

> Understand the model in under one minute.

---

## View 2 — Shape

Selecting Shape transforms the diagram into:

```text
INTENT                    CONTEXT
Product                 Engineering
   │                         │
   └──────────┐   ┌──────────┘
              ▼   ▼
             EXPLORE
                │
                ▼
             PROPOSAL
                │
                ▼
              SLICE
                │
                ▼
         COMPLEXITY GATE
             │       │
           FAIL      PASS
             │        │
             ↺        ▼
                    SPEC
                      │
                      ▼
               DEFINITION PR
                      │
                      ▼
                    READY
```

Each node can be selected for explanation.

---

## View 3 — Deliver

Selecting a Ready Spec transforms the experience into:

```text
READY SPEC
    │
    ▼
CLAIM STORY
    │
    ▼
IMPLEMENTATION BRANCH
    │
    ▼
OpenSpec APPLY
    │
    ▼
IMPLEMENT
    │
    ▼
VERIFY
    │
    ▼
DELIVERY PR
    │
    ├── Code Review
    ├── APAR
    ├── CD Controls
    └── Automated Tests
    │
    ▼
MERGE
    │
    ▼
PRODUCT ACCEPTANCE
    │
    ▼
DONE
```

---

# 10. Spec Lifecycle

Use a very simple semantic lifecycle:

```text
DRAFT
  │
  │ Definition PR
  ▼
READY
  │
  │ Engineer claims
  ▼
IN PROGRESS
  │
  │ Delivery PR merges
  ▼
IMPLEMENTED
  │
  │ Product validates
  ▼
ACCEPTED
```

Jira status mappings are implementation-specific.

The SDD lifecycle is not.

This distinction should appear in an explainer.

---

# 11. Proposal Visualization

A Proposal should visually behave like a parent outcome containing multiple delivery slices.

Example:

```text
Transaction Velocity Controls

✓ Evaluate transaction velocity
✓ Feature flag enforcement
◐ Configuration API
○ Decision telemetry
○ Operator visibility

2 / 5 Delivered
```

Clicking the Proposal expands its Specs.

Clicking a Spec enters the Spec lifecycle.

Proposal completion should visually emerge from child Spec completion rather than requiring a complex independent workflow.

---

# 12. Complexity Gate

The **Smallest Viable Slice Gate** should be a first-class visual concept.

A Spec should pass when it is:

- independently implementable,
- independently testable,
- independently deployable,
- independently releasable,
- independently reversible,
- feature flagged where appropriate,
- within APAR complexity thresholds,
- within prescribed implementation-size guidance,
- minimally coupled to sibling Specs,
- behaviorally complete,
- and independently verifiable by Product.

Interaction:

```text
PROPOSED SPEC
     │
     ▼
VIABLE SLICE GATE
   /       \
 FAIL      PASS
  │          │
  ▼          ▼
SLICE       READY
MORE        SPEC
```

Selecting the gate should open a small checklist panel explaining the rules.

Do not present the rubric as a giant form.

---

# 13. Ready Contract Concept

Once a Spec Definition PR merges, visually represent the Spec as a **Ready Contract**.

Example card:

```text
┌──────────────────────────────┐
│ Velocity Threshold API       │
│                              │
│ Payment Controls             │
│ PAY-123                      │
│                              │
│ ✓ Reviewed                   │
│ ✓ Independent                │
│ ✓ APAR-sized                 │
│                              │
│ READY                        │
└──────────────────────────────┘
```

The training message:

> A Ready Contract is a validated behavioral change that Engineering can pull without rediscovering Product intent.

"Ready Contract" is terminology, not a new required artifact.

---

# 14. POD Visualization

PODs should appear primarily in the Delivery portion of the experience.

Each POD consists of approximately 3–4 engineers working within an application or feature ownership boundary.

Conceptually:

```text
                    PRODUCT DOMAIN

                        PM
                         │
                         ▼
                   READY SPECS
                  /     |      \
                 /      |       \
              POD A   POD B    POD C
              3–4     3–4      3–4
             Engineers Engineers Engineers
```

Do not make POD membership part of the artifact lifecycle.

PODs represent **who pulls work**, not where work is defined.

---

# 15. Proposal Affinity

When multiple Ready Specs exist, Engineering should generally favor:

1. organizational priority,
2. application/POD ownership,
3. completing Specs within an active Proposal,
4. minimizing unnecessary parallel Proposal work.

The site may visualize:

```text
Proposal A   ████████░░   4 / 5
Proposal B   ████░░░░░░   2 / 5
Proposal C   ░░░░░░░░░░   0 / 4
```

and subtly animate the remaining Proposal A Spec as the preferred next pull.

This is guidance, not enforcement.

---

# 16. Interactive Explainers

Every important concept should support a lightweight explainer.

Use a side panel on desktop and a bottom sheet on mobile rather than disruptive centered dialogs wherever practical.

Example:

### Explore

**Purpose**

Understand Product Intent against existing technical reality.

**Primary actor**

Product Manager

**Supported by**

Engineering Lead / Engineering partners

**Inputs**

Intent + Context

**OpenSpec**

Explore

**Output**

Enough understanding to create or refine a Proposal.

**Key principle**

Explore is investigative. It should expose uncertainty rather than invent answers.

---

# 17. "Show Me an Example" Mode

Provide one fictional product outcome that moves through the entire system.

Example:

> **Introduce configurable transaction velocity controls.**

The walkthrough progresses through:

### 1. Intent

PRD requests configurable limits.

### 2. Context

Engineering supplies:

- existing authorization architecture,
- expected TPS,
- latency requirement,
- feature-flag convention,
- repository implementation,
- applicable OKF bundles.

### 3. Explore

OpenSpec discovers affected capabilities and architectural boundaries.

### 4. Proposal

**Transaction Velocity Controls**

### 5. Slice

Proposal becomes:

- Evaluate velocity during authorization
- Configure velocity thresholds
- Expose velocity telemetry
- Add enforcement feature flag
- Provide operator visibility

### 6. Complexity Gate

Each Spec is evaluated independently.

### 7. Definition PR

One Spec is merged as Ready.

### 8. Jira

Corresponding Story becomes pullable.

### 9. Engineer

Engineer claims the Story and creates an implementation branch.

### 10. Apply

OpenSpec Apply translates the Spec into implementation work.

### 11. Delivery

Implementation PR passes review, tests, APAR, and CD requirements.

### 12. Acceptance

Product validates the behavior.

### 13. Reconcile

Specs are synchronized/archived as appropriate.

### 14. Proposal Progress

The parent Proposal updates from 0/5 to 1/5 delivered.

The walkthrough should animate rather than navigate to entirely separate pages.

---

# 18. Information Architecture

Keep primary navigation extremely small.

Suggested header:

```text
[ SDD FLOW ]

Flow     Roles     Principles     Example
```

Optional:

**Flow**

The main interactive diagram.

**Roles**

Product / Engineering Lead / Engineer / POD responsibilities.

**Principles**

The operating contract and invariants.

**Example**

Guided end-to-end walkthrough.

Do not create a large documentation navigation tree.

---

# 19. Design Direction

The site should feel:

- modern,
- technical,
- calm,
- spacious,
- polished,
- understated,
- intentional.

Avoid:

- enterprise PowerPoint aesthetics,
- giant gradients,
- excessive glassmorphism,
- neon cyberpunk styling,
- constantly moving backgrounds,
- heavy card borders,
- dozens of pills,
- excessive iconography,
- oversized dashboards,
- dense Jira-like tables.

---

# 20. Color System

Color should encode meaning, not decoration.

Suggested semantic families:

### Intent / Product

Warm accent.

Examples:

- amber
- soft coral
- warm violet

### Context / Engineering

Cool accent.

Examples:

- cyan
- blue
- teal

### Spec / Shared Contract

Combination or neutral accent.

Examples:

- violet
- indigo
- balanced mixed tone

### Ready

Green accent.

### Active Delivery

Blue accent.

### Context Gap / Needs Attention

Amber.

### Failure / Blocked

Muted red.

Do not fill entire UI regions with saturated colors.

Use color primarily for:

- path highlights,
- nodes,
- small status indicators,
- icons,
- edge glows,
- selected state,
- semantic accents.

Everything else should remain visually quiet.

---

# 21. Typography

Use a modern sans-serif system.

Recommended hierarchy:

```text
Hero            48–64px desktop
Section title   28–36px
Node title      16–18px
Body            14–16px
Metadata        12–13px
```

Prefer short labels.

The diagram should communicate through spatial relationships before prose.

---

# 22. Animation Contract

Animation should explain state changes.

It should never exist merely because animation looks impressive.

Use animation for:

- diagram focus transitions,
- node expansion,
- flow direction,
- shared-element transitions,
- modal/sheet transitions,
- spec movement from Draft → Ready,
- Ready Spec being pulled by a POD,
- Proposal progress changes,
- branch / merge visualization.

Recommended timings:

```text
Micro interaction       120–180ms
Node transition         180–240ms
Panel transition        220–300ms
Diagram transformation  300–450ms
Guided walkthrough      400–700ms
```

Avoid:

- looping pulses everywhere,
- bouncing nodes,
- parallax backgrounds,
- unnecessary particle systems,
- excessive spring effects.

Motion should feel **precise rather than playful**.

Respect `prefers-reduced-motion`.

---

# 23. Technical Stack

Recommended:

```text
React 19
TypeScript
Vite 8.x
Motion for React
React Router
CSS Variables / design tokens
Lucide icons
Vitest
React Testing Library
Playwright
```

React 19.2 is the currently documented React release, and Vite 8 is the current major release; Vite 8 now uses Rolldown as its unified bundler.

Motion for React should handle:

- layout transitions,
- shared elements,
- diagram focus changes,
- SVG path animation,
- modal/sheet transitions,
- presence/exit animation,
- reduced-motion support.

Motion's current React API includes layout animations, shared `layoutId` transitions, SVG/gesture support, and `AnimatePresence`, making it well suited for the controlled interactive transformations required here.

---

# 24. Do Not Use a Generic Graph Editor

Do not use React Flow or another draggable node graph library for the core diagram unless requirements materially change.

The site is a **curated training experience**, not a graph editor.

Nodes should not be freely draggable.

The diagram should have intentionally designed states.

Use:

- normal React components,
- CSS Grid/Flexbox,
- SVG connectors,
- Motion,
- shared layout transitions.

This provides better control over:

- visual hierarchy,
- accessibility,
- responsive behavior,
- animation,
- storytelling,
- deterministic layout.

---

# 25. Diagram Architecture

Build the diagram as a state-driven visualization.

Example:

```ts
type FlowView =
  | "overview"
  | "shape"
  | "proposal"
  | "spec"
  | "deliver"
  | "accept"
  | "reconcile";
```

Nodes should be data-driven:

```ts
interface FlowNode {
  id: string;
  title: string;
  shortDescription: string;
  actor?: RoleId;
  artifact?: ArtifactId;
  explainer?: ExplainerId;
  status?: FlowStatus;
}
```

Edges:

```ts
interface FlowEdge {
  from: string;
  to: string;
  type: "primary" | "feedback" | "ownership" | "traceability";
}
```

Do not hardcode explanatory copy throughout JSX.

---

# 26. Content Model

Create centralized content definitions.

Suggested:

```text
src/content/
├── principles.ts
├── roles.ts
├── artifacts.ts
├── explainers.ts
├── example.ts
├── complexity-rubric.ts
└── flows/
    ├── overview.ts
    ├── shaping.ts
    ├── delivery.ts
    └── reconciliation.ts
```

This allows training content to evolve without rewriting visualization components.

---

# 27. Component Architecture

Suggested structure:

```text
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── shell/
│   │   ├── Header.tsx
│   │   └── PageShell.tsx
│   │
│   ├── flow/
│   │   ├── FlowCanvas.tsx
│   │   ├── FlowNode.tsx
│   │   ├── FlowEdge.tsx
│   │   ├── FlowPath.tsx
│   │   ├── FlowFocus.tsx
│   │   └── FlowLegend.tsx
│   │
│   ├── artifacts/
│   │   ├── IntentArtifact.tsx
│   │   ├── ContextArtifact.tsx
│   │   ├── ProposalArtifact.tsx
│   │   ├── SpecCard.tsx
│   │   ├── ReadyContract.tsx
│   │   └── RepositoryArtifact.tsx
│   │
│   ├── roles/
│   │   ├── RoleNode.tsx
│   │   └── PodCluster.tsx
│   │
│   ├── overlays/
│   │   ├── ExplainerPanel.tsx
│   │   ├── MobileSheet.tsx
│   │   └── ComplexityRubric.tsx
│   │
│   └── primitives/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── IconButton.tsx
│
├── features/
│   ├── walkthrough/
│   ├── proposal-progress/
│   └── flow-navigation/
│
├── content/
├── hooks/
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── animations.css
│
└── types/
```

---

# 28. URL / Navigation State

Important diagram states should be deep-linkable.

Examples:

```text
/flow
/flow/shape
/flow/shape/explore
/flow/proposal
/flow/deliver
/roles
/principles
/example
```

An explainer may additionally use query state:

```text
/flow/shape?explain=context
```

Browser Back should behave naturally.

Do not create a SPA where every meaningful interaction disappears when the page reloads.

---

# 29. Desktop Interaction

Desktop layout:

```text
┌────────────────────────────────────────────────────┐
│ Header                                             │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│             INTERACTIVE FLOW                       │
│                                                    │
│                                                    │
├───────────────────────────────────┬────────────────┤
│ Diagram                           │ Explainer      │
│ remains visible                   │ Panel          │
│                                   │                │
└───────────────────────────────────┴────────────────┘
```

Selecting a node should generally keep the diagram visible while opening contextual information.

Avoid sending users away from the mental model.

---

# 30. Mobile Interaction

On smaller screens:

- diagram remains the primary object,
- nodes become vertically or radially arranged,
- explanatory content opens as a bottom sheet,
- complex transitions simplify,
- no horizontal page scrolling,
- pinch/drag canvas navigation should not be required.

The training experience must remain usable without precision pointer interactions.

---

# 31. Accessibility

Minimum expectations:

- all interactive nodes are actual buttons or links,
- complete keyboard navigation,
- visible focus states,
- no color-only meaning,
- appropriate ARIA relationships,
- reduced-motion support,
- readable contrast,
- Escape closes overlays,
- focus returns to originating node after panel close,
- semantic heading hierarchy.

The diagram should have a screen-reader-friendly alternative representation of the current flow.

---

# 32. Visual Design Tokens

Start with semantic tokens rather than scattered values.

Example:

```css
:root {
  --surface-page: ...;
  --surface-raised: ...;
  --surface-subtle: ...;

  --text-primary: ...;
  --text-secondary: ...;
  --text-muted: ...;

  --intent: ...;
  --context: ...;
  --proposal: ...;
  --spec: ...;
  --ready: ...;
  --delivery: ...;
  --warning: ...;
  --danger: ...;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

All semantic visualization colors must resolve through tokens.

---

# 33. Interaction Rule: One Primary Focus

At any point in the experience, there should be one obvious visual focus.

When the user selects **Shape**:

- Shape becomes prominent,
- unrelated nodes become visually quieter,
- the Shape loop expands,
- explanatory content appears only if requested.

When the user selects a Spec:

- the Spec becomes prominent,
- its Proposal remains visible as context,
- the Delivery lifecycle becomes visible,
- unrelated Proposal siblings recede.

This prevents the visualization from accumulating information.

---

# 34. Interaction Rule: Never Lose Context

Expansion should normally transform the existing visualization rather than replace it.

Example:

```text
OVERVIEW

Shape → Ready → Deliver

          ↓ click Ready

FOCUSED

             Proposal
                │
        ┌───────┼───────┐
        ▼       ▼       ▼
       Spec    Spec    Spec
                 ↑
              selected
```

Use shared-element transitions so users visually understand where the expanded information came from.

---

# 35. Interaction Rule: Reveal Mechanics Last

The first layer explains:

> What is happening?

The second explains:

> Who is responsible?

The third explains:

> How do I perform it?

Git commands, branch mechanics, Jira state changes, and OpenSpec commands belong in deeper explainers.

Do not lead with:

```text
git checkout -b ...
opsx ...
git push ...
```

The site teaches the operating model first.

Tool mechanics are supporting information.

---

# 36. Principles Page

Keep this page concise and graphical.

Highlight:

### Product owns Intent.

### Engineering owns Context.

### Proposal means Product Outcome.

### Spec means Smallest Viable Slice.

### Specs live with Code.

### Definition makes work Ready.

### Delivery makes behavior Real.

### Jira coordinates; Git preserves provenance.

### Missing Context is surfaced, not invented.

### Product and Engineering share the behavioral contract.

---

# 37. Traceability Visualization

Provide an optional explainer showing:

```text
PRD / DRD
    │
    ▼
PROPOSAL
    │
    ▼
SPEC
    │
    ├──────── Jira Story
    │
    ▼
DEFINITION PR
    │
    ▼
REPOSITORY
    │
    ▼
DELIVERY PR
    │
    ▼
CODE
    │
    ▼
ACCEPTANCE
    │
    ▼
CANONICAL SPEC
```

This should communicate provenance without making Jira the center of the system.

---

# 38. Reconciliation

Reconciliation should intentionally appear smaller than Shape and Deliver.

Conceptually:

```text
IMPLEMENTED
     │
     ▼
ACCEPTED
     │
     ▼
SYNC / ARCHIVE
     │
     ▼
CANONICAL KNOWLEDGE
```

Teams may reconcile:

- after each accepted Spec,
- at Proposal completion,
- periodically,
- or as part of subsequent shaping.

The training experience should treat this as documentation hygiene rather than a heavyweight release phase.

---

# 39. Explicit Non-Goals

Do not build:

- a Jira replacement,
- an OpenSpec editor,
- a Git client,
- an interactive architecture drawing tool,
- a BPMN engine,
- a workflow execution platform,
- a real-time team dashboard,
- an exhaustive OpenSpec reference manual.

This is a **training and conceptualization experience**.

---

# 40. MVP

The first release should include:

### Core

- responsive application shell
- Overview interactive flow
- Shape flow
- Delivery flow
- Reconciliation flow
- Proposal visualization
- Ready Spec visualization
- explainer side panel
- role explanations
- complexity rubric
- Principles page
- reduced-motion support

### Example

One guided end-to-end example.

### Navigation

Deep links for major flow states.

### Quality

- unit tests
- accessibility tests
- basic E2E navigation tests
- responsive coverage

Do not add backend infrastructure.

The SPA should initially be entirely static.

Vite produces static production assets suitable for static hosting, making this well suited to GitHub Pages or equivalent internal static hosting.

---

# 41. Phase 2 Opportunities

Only consider these after the core experience is successful:

- selectable example scenarios,
- search,
- OpenSpec command snippets,
- copyable team operating contract,
- embedded videos,
- metrics illustrating batch-size improvements,
- organization-specific complexity rubric configuration,
- interactive Proposal simulation,
- links into internal OKF guidance,
- anonymous usage analytics,
- downloadable workflow references.

Avoid implementing these prematurely.

---

# 42. Definition of Done

The experience succeeds when a first-time user can answer these questions after interacting with it:

1. What is Intent?
2. Who owns Intent?
3. What is Context?
4. Who is accountable for Context?
5. What does Explore accomplish?
6. What does a Proposal represent?
7. Why can a Proposal contain multiple Specs?
8. What makes a good Spec?
9. What makes a Spec Ready?
10. How does Jira relate to a Spec?
11. What does an engineer pull?
12. What does OpenSpec Apply do in the workflow?
13. What is the difference between a Definition PR and Delivery PR?
14. Who accepts the delivered behavior?
15. Why do Specs live alongside Code?
16. What happens when required Context is missing?
17. How can several engineers work concurrently?
18. How does a Proposal eventually become complete?

If those answers require reading a long manual, the UX has failed.

---

# 43. UX Acceptance Criteria

The implementation should meet these design constraints:

- The default view contains no more than approximately **5–7 primary conceptual objects**.
- Detailed workflow steps appear only after interaction.
- No screen should resemble a traditional BPMN/process flowchart.
- No view should require users to pan around an infinite canvas.
- The primary workflow remains understandable without opening any explainer.
- Opening explainers never destroys the user's position in the flow.
- All major interactions work with keyboard navigation.
- Animations reinforce spatial relationships.
- Reduced-motion users receive equivalent state transitions without decorative movement.
- Mobile layouts remain fully navigable.
- Content is data-driven rather than embedded across visualization components.
- Semantic lifecycle states are visually consistent throughout the application.

---

# 44. Engineering Principles

Implementation should favor:

**Composition over abstraction**

Do not build a generic diagram framework when four curated diagrams will suffice.

**Data-driven content**

Separate training content from rendering logic.

**Deterministic layouts**

The same state should render predictably every time.

**Small components**

Visual artifacts, flow nodes, edges, panels, and interactions should remain independently understandable.

**Semantic design tokens**

No arbitrary one-off color values or animation durations.

**Progressive enhancement**

The core content should remain understandable even when animation is disabled.

**URL-addressable state**

Meaningful training concepts should be linkable.

**No premature backend**

Static content first.

---

# 45. Suggested Initial Implementation Sequence

## Step 1 — Foundation

Create:

- React + TypeScript + Vite application
- routing
- design tokens
- shell
- typography
- responsive foundations
- Motion configuration
- reduced-motion handling

## Step 2 — Content Contract

Implement:

- roles
- artifacts
- principles
- flow definitions
- complexity rubric
- example scenario

as typed data.

## Step 3 — Visual Primitives

Build:

- FlowNode
- FlowEdge
- Artifact
- SpecCard
- Proposal
- ReadyContract
- PodCluster
- Repository
- ExplainerPanel

## Step 4 — Overview

Build the simple:

**Intent + Context → Shape → Ready → Deliver → Accept → Reconcile**

experience first.

Do not build detailed flows until this experience feels excellent.

## Step 5 — Progressive Detail

Implement Shape, Proposal, Spec, and Delivery focus states.

## Step 6 — Explainers

Add contextual side panels and mobile sheets.

## Step 7 — Example Walkthrough

Animate one example through the existing components rather than creating a separate implementation.

## Step 8 — Accessibility / Responsive / Polish

Complete:

- keyboard navigation
- focus management
- reduced motion
- mobile behavior
- E2E tests
- performance review
- animation tuning

---

# 46. Final Design Contract

When implementation decisions become ambiguous, use these rules:

> **Show relationships before details.**

> **Reveal complexity only when requested.**

> **Keep the repository, not Jira, at the center of provenance.**

> **Treat Product and Engineering as collaborators around a shared Spec contract.**

> **Use animation to preserve spatial understanding, not to decorate the interface.**

> **Never put every process step on screen simultaneously.**

> **Proposal represents the outcome.**

> **Spec represents the smallest viable change.**

> **Definition makes a Spec ready.**

> **Delivery makes the Spec real.**

> **Code and Specs evolve together.**

The finished experience should make OpenSpec SDD feel less like an additional process teams must adopt and more like a simple mechanism for turning trustworthy Product Intent and Engineering Context into small, continuously deliverable units of work.