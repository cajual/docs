# Prose and Copy Design Standard

This guide governs user-facing prose: training material, documentation, application copy, explanations, onboarding content, instructional text, examples, callouts, labels, and long-form narrative.

Apply it both when writing new copy and when revising existing copy.

The goal is straightforward:

**Write like an experienced practitioner explaining something they understand well to another capable person.**

The prose should be confident, direct, conversational, technically literate, and easy to move through. It should have the clarity of a good engineering book: practical rather than academic, opinionated without being theatrical, and polished without sounding manufactured.

---

## 1. The Voice

Write with **quiet confidence**.

State what is true, explain why it matters, and move on.

Prefer:

> The proposal establishes the product-level change. Individual specs describe the implementation work that follows.

Over:

> The proposal isn't just another planning artifact—it's the critical bridge between product intent and engineering execution.

The first version trusts the reader. The second tries to convince the reader that the sentence is important.

Do not perform confidence. Demonstrate it through precision.

### The voice should feel

- Experienced
- Practical
- Clear
- Deliberate
- Technically fluent
- Calm
- Conversational
- Economical

### The voice should not feel

- Promotional
- Grandiose
- Academic
- Corporate
- Breathless
- Inspirational
- Artificially enthusiastic
- Self-important

Assume the reader is intelligent.

Do not talk down to them, oversell basic ideas, or explain obvious implications at length.

---

# 2. Write Naturally

Prefer the language a knowledgeable person would actually use in conversation.

If a sentence would sound strange when spoken aloud in a design review, rewrite it.

Avoid inflated vocabulary when an ordinary word is more precise.

Prefer:

- use
- build
- change
- choose
- understand
- show
- improve
- decide
- find
- start
- finish

Use words such as *utilize*, *facilitate*, *endeavor*, *paramount*, *multifaceted*, *myriad*, *temerity*, *holistic*, or *transformative* only when they genuinely express something the simpler word does not.

Technical terminology is different. Use the correct technical term when precision requires it.

Do not simplify technical concepts into vagueness.

---

# 3. Eliminate AI Prose Patterns

Actively remove language patterns strongly associated with generated prose.

These are not absolute grammatical prohibitions. They are warning signs. Rewrite them unless the structure is genuinely the clearest way to express the idea.

## Avoid contrast theater

Do not repeatedly construct sentences around artificial X/Y oppositions.

Avoid:

> It's not about X. It's about Y.

> This isn't just X—it's Y.

> X is more than Y; it's Z.

> Rather than merely X, the system fundamentally Y.

> The goal isn't simply to X, but to Y.

> This is not a limitation. It is an opportunity.

Usually, simply state Y.

Instead of:

> Context isn't just documentation. It's the foundation on which effective agent reasoning is built.

Write:

> Agents make better decisions when they have reliable project context.

---

## Avoid rhetorical inflation

Delete phrases that announce importance instead of demonstrating it.

Avoid constructions such as:

- critically important
- essential cornerstone
- fundamental pillar
- key enabler
- powerful paradigm
- profound shift
- transformative capability
- game-changing
- represents a significant evolution
- cannot be overstated
- at the heart of
- at its core
- marks a pivotal moment
- ushers in
- unlocks the ability to
- empowers teams to
- serves as a testament to

If something matters, explain the consequence.

Instead of:

> This is a critical capability that empowers teams to maintain alignment.

Write:

> This keeps the implementation aligned with the original product intent.

---

## Avoid throat clearing

Do not spend a paragraph preparing to make a point.

Avoid:

> Before diving into the details, it is important to understand...

> To fully appreciate this approach, we first need to examine...

> With that context in mind, let's explore...

> Now that we've established...

> It is worth noting that...

Start with the information.

---

## Avoid fake conversation

Use rhetorical questions sparingly.

Avoid:

> But what does this actually mean?

> So why does this matter?

> The result? Better alignment.

> The challenge? Context.

> The good news?

These devices become mechanical quickly.

Write the answer directly.

---

## Avoid announcing the document

Do not narrate the act of explaining.

Avoid:

> In this section, we'll explore...

> This guide will walk you through...

> Below, we'll examine...

> Let's take a closer look at...

The heading already tells the reader where they are.

Begin with the subject.

---

## Avoid synthetic enthusiasm

Do not use:

- exciting
- excitingly
- incredibly powerful
- fantastic
- elegant solution
- beautiful approach
- remarkably
- impressively
- revolutionary

unless enthusiasm itself is relevant.

Technical prose does not need applause.

---

## Avoid empty transitions

Do not connect sections using generic filler.

Avoid:

> Furthermore...

> Moreover...

> Additionally...

> That said...

> With this in mind...

> Building upon this...

Use a transition only when it expresses a real relationship between ideas.

Often the best transition is simply the next sentence.

---

# 4. Prefer Concrete Language

Name the thing.

Avoid replacing concrete nouns with abstractions.

Instead of:

> The solution enables greater visibility into the development lifecycle.

Write:

> The dashboard shows which specs are proposed, implemented, and archived.

Instead of:

> This creates opportunities for improved collaboration.

Write:

> Product and engineering can review the same proposal before implementation begins.

Concrete language is easier to understand and harder to misinterpret.

---

# 5. Prefer Verbs Over Nouns

Generated and corporate prose often turns actions into abstractions.

Avoid:

> perform an evaluation of

Write:

> evaluate

Avoid:

> make a determination about

Write:

> decide

Avoid:

> provide visibility into

Write:

> show

Avoid:

> facilitate the creation of

Write:

> create

Avoid:

> enable the utilization of

Write:

> let the system use

Strong verbs make prose shorter and clearer.

---

# 6. Sentence Rhythm Matters

Readable prose has variation.

Use short sentences for conclusions and emphasis.

Use medium-length sentences for most explanations.

Use longer sentences when several ideas genuinely belong together.

Do not make every sentence the same length.

Do not fragment ordinary prose simply to manufacture drama.

Avoid:

> Context matters.

> A lot.

> Especially at scale.

> Because agents need it.

Write:

> Context becomes more important as the system grows because agents have more places to look for an answer.

Likewise, avoid sentences that accumulate clause after clause until the reader has forgotten where they started.

When a sentence contains three or four separate ideas, consider breaking it apart.

---

# 7. Paragraphs Should Develop an Idea

A paragraph should usually have a reason to exist.

A useful pattern is:

**claim → explanation → consequence or example**

For example:

> A proposal should describe one coherent product change. It establishes the intent, boundaries, and decisions that apply across the implementation. Individual specs can then divide that change into work that maps cleanly to repositories, pull requests, and Jira stories.

The sentences build on one another.

Avoid collections of loosely related statements that happen to share a topic.

---

# 8. Preserve Narrative Continuity

Every section should feel connected to the one before it.

The reader should rarely have to ask:

> Why am I being told this now?

Order material according to the reader's developing understanding.

A common sequence is:

**problem → mental model → mechanism → example → implication → action**

Not every page needs this exact structure, but information should unfold deliberately.

Introduce terminology before relying on it.

Explain a concept before discussing exceptions.

Establish the normal path before edge cases.

Give the reader enough information to understand the next idea, but not everything you know about the subject.

---

# 9. Use Progressive Disclosure

Do not front-load every detail.

Start with the smallest useful mental model.

Then deepen it.

For training material:

1. Explain what the thing is.
2. Explain why it exists.
3. Show how it fits into the larger system.
4. Demonstrate the normal workflow.
5. Introduce important constraints.
6. Cover exceptions and advanced cases.

Avoid making readers understand the entire architecture before they can understand the first task.

---

# 10. Teach Through Cause and Effect

Instructional material should explain relationships, not merely state rules.

Weak:

> Each spec should correspond to one Jira story.

Better:

> Keep one spec aligned to one Jira story. That gives the implementation a single unit of intent that can follow the work through the pull request, review, merge, and archive process.

The second version tells the reader why the rule exists without turning into a lecture.

Whenever practical, connect:

**decision → reason → consequence**

---

# 11. Be Opinionated When the Material Is Opinionated

Do not weaken established guidance with unnecessary hedging.

If the design says to do something, say so.

Prefer:

> Keep proposals at the product level.

Over:

> You may generally want to consider keeping proposals at the product level where appropriate.

Reserve qualifiers such as *usually*, *generally*, *often*, *may*, and *can* for situations where uncertainty actually exists.

Likewise, do not turn preferences into universal laws.

Prefer:

> We use one spec per Jira story because it gives us clean traceability.

Over:

> A spec must always correspond to exactly one Jira story.

unless it truly is an invariant.

---

# 12. Explain Tradeoffs Honestly

Avoid presenting architecture choices as universally superior.

A useful technical explanation often sounds like:

> Centralizing the context bundle gives every repository the same source of truth. The tradeoff is that changes to shared context now affect multiple consumers, so ownership and review become more important.

This is stronger than pretending the decision has no cost.

When relevant, state:

- what the approach optimizes for
- what it gives up
- where it works well
- where it becomes awkward

This makes technical guidance credible.

---

# 13. Use Examples to Clarify, Not Decorate

Examples should remove ambiguity.

Prefer concrete examples with realistic names, states, files, commands, or workflows.

Bad:

> For example, imagine a team working on a feature.

Better:

> Suppose the debit-auth team adds a new decline reason. The proposal captures the product change; the AuthGW spec covers the API behavior; the downstream settlement spec covers the corresponding event.

Do not add an example when the preceding sentence is already obvious.

---

# 14. Respect the Reader's Time

Delete information that does not change the reader's understanding or behavior.

After drafting a paragraph, ask:

**What would the reader lose if this sentence disappeared?**

If the answer is "nothing," remove it.

Do not repeat the same conclusion in:

- the introduction
- a callout
- the body
- the summary
- the closing paragraph

Strategic repetition can help training. Mechanical repetition creates noise.

---

# 15. Headings Should Describe Content

Prefer short, descriptive headings.

Good:

- How Context Is Resolved
- Proposal Ownership
- Creating a Spec
- When a Proposal Spans Repositories
- Archiving Completed Work

Avoid vague or promotional headings:

- Unlocking Better Context
- Why This Changes Everything
- The Power of Proposals
- Bringing It All Together
- A New Way Forward
- Key Takeaways

Headings should help someone skim the page and reconstruct its structure.

---

# 16. Use Lists for Lists

Do not turn normal prose into bullet points merely because Markdown makes bullets easy.

Use a list when the reader benefits from seeing items as peers.

Use prose when one idea leads into another.

Bad:

- Context is centralized.
- Repositories consume it.
- Context is layered.
- Agents traverse the layers.
- This improves retrieval.

Better:

> Context lives in a shared repository and is divided into progressively deeper layers. Repositories point their agents at that source, allowing them to start with the entry layer and follow only the context relevant to the change.

Conversely, do not bury six independent requirements inside a paragraph. Use a list.

---

# 17. Do Not Overuse Formatting

Formatting should expose structure, not manufacture emphasis.

Use **bold** sparingly.

Avoid bolding several phrases in every paragraph.

Avoid repeated blockquotes, callouts, emojis, icons, and badges unless the application has a specific semantic use for them.

Do not use ALL CAPS for emphasis.

Do not use excessive em dashes.

An em dash is useful when the sentence actually benefits from an interruption. It should not become the default replacement for commas, parentheses, colons, and periods.

---

# 18. UI Copy Is Still Prose

Buttons, labels, tooltips, cards, empty states, and modal text should follow the same voice.

Prefer verbs for actions:

- Create proposal
- View spec
- Archive change
- Add context
- Retry import

Avoid:

- Get Started
- Learn More
- Continue Journey
- Unlock Context
- Explore Now

unless those labels genuinely describe the action.

For explanatory UI text, say what happened and what the user can do next.

Instead of:

> Oops! Something went wrong while attempting to process your request.

Write:

> The context bundle could not be loaded. Check the repository path and try again.

---

# 19. Avoid Anthropomorphizing the System

Describe system behavior precisely.

Avoid:

> OpenSpec knows where to find your context.

Write:

> OpenSpec resolves the configured context repository before searching the project.

Avoid:

> The agent understands your architecture.

Write:

> The agent receives the architecture documents in its context.

Avoid implying reasoning, certainty, memory, awareness, or intent beyond what the system actually does.

---

# 20. Use "You" With Purpose

Second person works well for training material when describing an action the reader performs.

> Create the proposal before splitting the work into specs.

Avoid repeatedly addressing the reader when describing system behavior.

Instead of:

> You'll see that your context gets loaded before your agent looks at your repository.

Write:

> The shared context loads before repository-specific context.

Use **we** only when it refers to an actual shared practice or decision.

> We keep specs aligned with Jira stories because that relationship makes traceability straightforward.

Do not use *we* as a generic authorial voice.

---

# 21. Do Not Invent Drama

Avoid manufactured stakes.

Do not write:

> Without this foundation, teams risk descending into fragmented context and inconsistent implementations.

Write:

> Without a shared source, repositories can accumulate conflicting versions of the same guidance.

Specific consequences are more persuasive than dramatic ones.

---

# 22. Prefer Explanations Over Slogans

Do not compress important concepts into clever phrases unless the phrase genuinely helps memory.

Avoid repeatedly producing statements such as:

> One proposal. One vision. Many implementations.

> Context first. Code second.

> Intent drives everything.

These can work occasionally as labels or teaching devices, but generated prose tends to overproduce them.

The default should be an explanatory sentence.

---

# 23. Preserve Technical Precision During Editing

When revising existing copy, improve the language without silently changing the design.

Do not:

- change requirements
- alter architectural claims
- invent rationale
- remove important qualifications
- rename established concepts
- modify code identifiers
- change commands
- normalize domain-specific terminology into generic language
- turn recommendations into requirements
- turn requirements into recommendations

If the source contains an ambiguity that cannot be safely resolved from context, preserve the ambiguity or flag it separately.

Copy editing is not license to redesign the system.

---

# 24. Revision Mode

When asked to edit existing content, perform a substantive copy edit rather than superficial proofreading.

Work in this order.

## First: recover the intended meaning

Determine:

- What is this section trying to teach?
- What does the reader need to understand afterward?
- Which statements are requirements?
- Which statements are explanation?
- Which details are examples?
- What terminology must remain unchanged?

## Second: repair the structure

Fix:

- ideas introduced out of order
- repeated explanations
- missing transitions
- paragraphs containing unrelated concepts
- headings that do not match their content
- details presented before the reader has the required context

Move sentences or paragraphs when necessary.

## Third: rewrite the prose

Remove:

- AI idioms
- corporate language
- verbosity
- fake contrasts
- unnecessary qualifiers
- inflated vocabulary
- repetitive transitions
- rhetorical filler
- redundant conclusions

Prefer direct, natural sentences.

## Fourth: compress

Remove sentences that repeat a nearby idea.

Combine fragments that belong together.

Replace abstract phrases with concrete nouns and verbs.

Do not preserve awkward language merely because it existed in the source.

## Fifth: read for continuity

Read the result as a reader would.

Each paragraph should create a natural reason for the next paragraph to exist.

If the copy feels like independent generated paragraphs stacked together, revise the transitions and structure until it reads as one piece of writing.

---

# 25. Net-New Writing Mode

When creating new material, do not draft by filling a template with generic prose.

Start with the argument.

Before writing, establish mentally:

- what the reader already knows
- what they need to learn
- the central idea
- the logical sequence
- the action or understanding expected at the end

Then write the shortest version that communicates that argument well.

Expand only where the reader needs explanation, evidence, an example, or a useful distinction.

---

# 26. Examples of the Desired Transformation

## Artificial contrast

Before:

> OpenSpec isn't just a specification framework—it's a new way of thinking about how product intent flows through the software development lifecycle.

After:

> OpenSpec keeps product intent attached to the implementation as the work moves through the development lifecycle.

---

## Inflated language

Before:

> The centralized context repository serves as the foundational cornerstone of our agentic development strategy, empowering engineers to unlock consistent and scalable context across the organization.

After:

> The centralized repository gives every project access to the same engineering context.

---

## Excessive explanation

Before:

> Before we dive into how proposals work, it's important to first understand why proposals exist in the first place. At their core, proposals are designed to bridge the gap between product intent and engineering implementation.

After:

> A proposal describes the product change before the work is divided into implementation specs.

---

## Corporate abstraction

Before:

> This approach enables enhanced visibility and facilitates improved cross-functional alignment throughout the development lifecycle.

After:

> Product and engineering review the same change definition throughout implementation.

---

## Generated cadence

Before:

> The result? Better context. Better decisions. Better software.

After:

> Better context reduces the chance that an implementation contradicts an existing architectural decision.

---

## Excessive hedging

Before:

> Teams may want to consider using a shared context repository in situations where maintaining consistency across repositories could potentially be beneficial.

After:

> Use a shared context repository when several repositories depend on the same architectural guidance.

---

# 27. Words and Phrases to Treat as Warnings

Do not mechanically ban every occurrence, but reconsider sentences containing:

- delve
- tapestry
- landscape
- realm
- journey
- unlock
- empower
- harness
- leverage
- robust
- seamless
- holistic
- transformative
- pivotal
- nuanced
- multifaceted
- cornerstone
- paradigm
- ecosystem
- synergy
- comprehensive
- compelling
- crucial
- fundamentally
- inherently
- importantly
- notably
- remarkably
- thoughtfully
- strategically
- at its core
- in today's
- in an era where
- it is important to note
- it is worth noting
- serves as
- stands as
- represents a
- plays a critical role
- goes beyond
- more than just
- not merely
- not simply
- isn't just
- not only ... but also
- whether you're
- imagine a world where
- let's explore
- let's dive in
- let's unpack
- bringing it all together
- key takeaway
- the bottom line

A precise technical use is fine.

A stock rhetorical use should be rewritten.

---

# 28. Editorial Priorities

When principles conflict, use this order:

1. **Correctness**
2. **Clarity**
3. **Continuity**
4. **Precision**
5. **Natural voice**
6. **Brevity**
7. **Style**

Never sacrifice correctness for elegance.

Never sacrifice clarity for cleverness.

Never preserve stylistic consistency when a more natural sentence would be easier to understand.

---

# 29. Final Copy Review

Before considering user-facing copy complete, perform a silent editorial pass.

Check:

### Meaning
- Is the technical meaning intact?
- Are requirements distinguishable from recommendations?
- Are cause and effect accurate?

### Structure
- Does information appear in the order the reader needs it?
- Does each section have a clear purpose?
- Does each paragraph lead naturally to the next?

### Language
- Would an experienced engineer actually say this?
- Are the verbs concrete?
- Are abstract nouns hiding simple ideas?
- Is there unnecessary jargon?
- Is the vocabulary needlessly ornate?

### AI-pattern check
- Are there unnecessary X/Y contrasts?
- Is anything described as "more than just" something else?
- Are there rhetorical questions followed immediately by answers?
- Are there dramatic sentence fragments?
- Are there generic transitions?
- Are there repeated three-item slogans?
- Are there unnecessary em dashes?
- Does the prose announce its own importance?

### Compression
- Can any sentence disappear without losing meaning?
- Is the same conclusion made twice?
- Does the opening get to the point?
- Does the ending stop when the explanation is finished?

If any answer exposes weak prose, revise it before finishing.

---

# 30. Default Editing Instruction

Unless explicitly told otherwise, apply this standard automatically whenever creating or editing user-facing prose.

For existing content:

**Preserve meaning, improve structure, remove generated-language artifacts, and rewrite aggressively enough that the result reads as if a capable human author wrote it deliberately from the beginning.**

Do not merely correct grammar.

Do not retain awkward phrasing out of fidelity to the original wording.

Do not call attention to the editing process in the resulting copy.

For new content:

**Write the clear version first.**

Do not generate inflated prose and then attempt to simplify it afterward.

The finished copy should feel authored, not generated.