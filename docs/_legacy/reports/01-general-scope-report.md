# Sherlock General Scope Report

Date: 2026-04-03

## Purpose

This report assesses whether Sherlock can expand from an OSINT and fraud-focused investigation tool into a broader knowledge workspace for research, analysis, monitoring, and reporting across many domains.

Short answer: yes.

The current app already contains most of the hard platform pieces:

- a unified launch pipeline in `src/App.tsx`
- a reusable provider router in `src/services/providers/index.ts`
- local-first persistence in browser SQLite via `src/services/db/*`
- a flexible scope system in `src/data/presets.ts`
- a strong deep-work interface across Finder, Operation View, Live Monitor, Network Graph, and Archives

The main thing holding Sherlock inside the OSINT lane is not the system architecture. It is the product vocabulary, prompt contract, and output schema. Today the engine is more general than the nouns it uses.

## Executive Assessment

Sherlock appears well positioned to become a domain-flexible knowledge tool without losing what already makes it strong.

The strongest reusable foundations are:

- task orchestration and run tracking
- report archival and case grouping
- scope-driven prompt shaping
- entity and source extraction
- graph-based relationship exploration
- template-driven launch flows
- provider abstraction across Gemini, OpenRouter, OpenAI, and Anthropic

The biggest constraints are:

- nearly every top-level concept is named around investigations and cases
- report output is fixed around `summary`, `agendas`, `leads`, `entities`, and `sources`
- several UI surfaces are explicitly framed as anomaly detection, live intel, or operation workflows
- some behavior assumes every root object is an "Operation"

Conclusion:

Sherlock should not be rebuilt from scratch. It should be generalized in layers, preserving the current interface patterns and data flow while introducing a broader object model and more flexible output contracts.

## What Sherlock Already Has That Is Broadly Reusable

### 1. A Strong Core Workflow

The app already supports a generic pattern that works far beyond fraud or OSINT:

1. define a scope
2. launch a run
3. collect structured results
4. save them into a persistent container
5. navigate related outputs
6. inspect entities, sources, and follow-up leads
7. export the work product

That same loop can support:

- scientific literature reviews
- AI and ML landscape tracking
- company and market diligence
- policy and regulatory research
- legal issue mapping
- technical trend analysis
- internal knowledge projects

### 2. A Good Separation Between Run Logic and UI Entry Points

All launches converge through `launchInvestigation` in `src/App.tsx`. That is a major asset. It means Sherlock already behaves like a unified work engine fed by multiple entry points:

- Feed
- Live Monitor
- Operation View deep dives
- template launches
- headline escalation

This architecture makes it realistic to add new work modes without duplicating orchestration logic.

### 3. Local-First Persistence Is a Serious Advantage

The SQLite plus IndexedDB approach is a strong foundation for a knowledge workspace. It gives Sherlock:

- durable local history
- offline-friendly storage
- export/import opportunities
- future room for richer structured data

That is a better starting point than many concept-stage research tools that only keep transient chat state.

### 4. Scopes Already Hint at the Right Future

The current scope system in `src/data/presets.ts` is more important than it may look at first glance. A scope already combines:

- domain context
- objective
- source suggestions
- personas
- category taxonomies
- temporal defaults

This is very close to a future "domain pack" or "workflow pack" model.

## Where The Current System Is Still Domain-Coupled

### 1. The Primary Nouns Are Too Narrow

The main data model and UI vocabulary revolve around:

- `Case`
- `InvestigationReport`
- `InvestigationTask`
- `InvestigationScope`
- `Operation View`
- `Live Intel`
- `Investigative Leads`
- `Anomalies`

Those work well for OSINT, fraud, and due diligence. They become awkward for:

- a scientific findings review
- a technology trends briefing
- a multi-source literature map
- an internal research project

### 2. The Report Contract Is Fixed To One Pattern

Today the report shape in `src/types/index.ts` assumes:

- summary
- agendas
- leads
- entities
- sources
- raw text

That is effective for investigative work, but too opinionated for many other outputs. A scientific review may need:

- findings
- study comparisons
- evidence quality
- open questions
- methodology notes

A technology landscape report may need:

- major players
- capability matrix
- release timeline
- strategic implications
- forward signals

### 3. Some Logic Assumes Every Root Container Is An Operation

`src/store/caseStore.ts` currently auto-creates cases as `Operation: ${report.topic}`. `LiveMonitor` and other surfaces strip or expect this prefix. That is a signal that the persistence layer is still semantically tied to one framing.

### 4. Prompt Builders Are Domain-Aware, But Not Yet Purpose-Aware

The prompt system in `src/services/providers/shared/prompts.ts` is driven by scopes, which is good, but the available operations are still framed as:

- investigate
- scan anomalies
- live intel
- text-to-speech briefing

What is missing is a broader layer that defines the purpose of a run:

- investigate
- summarize latest developments
- compare sources
- track a topic over time
- synthesize research
- build a briefing
- generate a structured memo

### 5. The UI Is Reusable, But The Labels Are Not

The layout itself is excellent and should be preserved. The issue is naming and sectional assumptions:

- Finder is framed around anomalies
- Operation View is framed around investigations
- Report Viewer hardcodes labels like `EXECUTIVE_SUMMARY`, `Investigative Leads`, and `Anomalies`
- Task setup steps assume hypothesis, key figures, and source priorities in an investigation-centric way

## Recommendation

Generalize Sherlock around a neutral internal model, then let each domain or workflow apply its own labels on top.

Do not force users to choose one universal noun globally. Instead:

- use a generic internal schema
- allow domain-specific presentation language
- preserve the current investigation mode as one first-class mode

This gives you the best of both worlds:

- broad capability without losing the identity and sharpness of Sherlock's current experience
- backward compatibility for existing case-based workflows

## Proposed Target Model

### 1. Container Layer

Introduce a generic top-level container internally, such as `Workspace` or `Project`.

Recommended concept:

- Internal model: `Workspace`
- User-facing labels by mode:
  - Investigation mode: `Case`
  - Research mode: `Project`
  - Briefing mode: `Report Collection` or `Workspace`

This lets the same core object hold:

- title
- description
- status
- mode
- tags
- created/updated timestamps
- optional domain pack reference

### 2. Run Layer

Today `InvestigationTask` already acts like a run record. Expand it into a generic run concept:

- input
- purpose
- config snapshot
- provider/model snapshot
- source scope
- parent artifact or parent workspace
- status
- output artifact IDs

Recommended internal name:

- `Run` or `WorkspaceRun`

### 3. Artifact Layer

This is the most important evolution.

Instead of treating every output as one fixed `InvestigationReport`, move to a more flexible artifact model.

Recommended base artifact:

- `artifactType`: report, brief, synthesis, comparison, timeline, digest, note, monitor snapshot
- `title`
- `summary`
- `sections`
- `entities`
- `sources`
- `claims` or `findings`
- `followUps`
- `metadata`
- `rawText`

The crucial step is replacing hardcoded sections with structured, typed sections.

Example section kinds:

- executive-summary
- key-findings
- anomalies
- leads
- evidence
- methodology
- literature-review
- competing-views
- timeline
- implications
- next-steps

### 4. Signal Layer

Your current `Headline`, `FeedItem`, and `MonitorEvent` types are close cousins. They could converge into a generic "signal" or "inbox item" layer with optional mode-specific fields.

That would support:

- breaking news items
- paper releases
- product launches
- regulatory updates
- social posts
- internal notes
- imported references

### 5. Knowledge Graph Layer

The graph should expand from entities into broader knowledge objects.

Today it is already useful. In the future it should support nodes like:

- person
- organization
- place
- concept
- technology
- paper
- claim
- source
- event
- artifact

This would make Sherlock much stronger for science and technology research, where concepts and publications matter as much as named people and organizations.

## Proposed Architecture Direction

### Layer 1: Keep The Launch Pipeline, Add Purpose

Keep the current centralized launch flow in `src/App.tsx`, but broaden the request model.

Recommended additions to the launch config:

- `mode`
- `purpose`
- `artifactType`
- `outputProfile`

Examples:

- mode: `investigation`, purpose: `deep-dive`, artifactType: `report`
- mode: `research`, purpose: `latest-findings`, artifactType: `synthesis`
- mode: `technology-landscape`, purpose: `trend-scan`, artifactType: `brief`

This is likely the highest leverage architectural change because it generalizes the run engine without changing the core flow.

### Layer 2: Split Domain Pack From Execution Purpose

Right now `scope` carries both domain context and some workflow assumptions.

In the future, separate:

- `domain pack`
  - topic area
  - personas
  - source libraries
  - default taxonomies
  - visual identity
- `purpose profile`
  - investigate
  - monitor
  - compare
  - summarize latest
  - synthesize literature
  - create briefing

This creates a matrix instead of a single axis.

Examples:

- domain pack: `scientific-research`, purpose: `latest-findings`
- domain pack: `ai-ml`, purpose: `trend-scan`
- domain pack: `fraud-investigation`, purpose: `deep-dive`
- domain pack: `policy`, purpose: `monitor`

### Layer 3: Generalize Output Contracts

The provider layer is already abstracted. The next move is to define richer structured output schemas that all adapters normalize into.

Recommended output contract shape:

- `artifact`
- `sections[]`
- `entities[]`
- `sources[]`
- `followUps[]`
- `confidenceNotes[]`
- `citations[]`

Optional domain-specific enrichments can be attached under `metadata` or typed extension sections.

This is how Sherlock can return excellent results for both:

- "investigate this suspicious contractor"
- "summarize the latest findings in mechanistic interpretability"

without forcing both into the same lead-and-anomaly template.

### Layer 4: Evolve Persistence Incrementally

Do not replace the database wholesale at first.

Use an incremental migration path:

1. keep `cases`, `reports`, and `tasks` working
2. add new generic fields and types
3. introduce artifact metadata and section storage
4. only later rename or consolidate tables if needed

Practical near-term additions could include:

- `cases.mode`
- `cases.label_profile`
- `reports.artifact_type`
- `reports.metadata_json`
- new `report_sections` table
- new `signals` table that can eventually absorb parts of headlines/feed/live monitor data

This preserves existing data while opening the system for broader use.

### Layer 5: Decouple UI Labels From Internal Types

This is a design and product move as much as an engineering one.

The same underlying screen can present differently based on mode.

Examples:

- Investigation mode:
  - Case Files
  - Operation View
  - Investigative Leads
  - Anomalies
- Research mode:
  - Projects
  - Research Workspace
  - Follow-up Questions
  - Key Findings
- Executive briefing mode:
  - Briefing Packs
  - Briefing View
  - Recommendations
  - Signals

The current layouts already support this. What changes is the presentation layer and section configuration.

## Suggested Product Structure

### Option A: One Product With Modes

This is my recommended path.

Sherlock remains one product, but users choose a mode when creating work:

- Investigation
- Research
- Monitoring
- Briefing
- Due Diligence

Pros:

- preserves your current strengths
- minimal architectural disruption
- shared navigation and persistence
- easy to market as a broad knowledge workbench

Cons:

- requires thoughtful label abstraction
- risk of some screens feeling too generalized if not carefully designed

### Option B: One Core Platform With Domain Packs

This is a stronger long-term model.

Sherlock becomes a core engine with installable or built-in packs:

- Fraud and OSINT
- Scientific Research
- AI and Technology Tracking
- Corporate Diligence
- Policy and Regulation

Pros:

- very extensible
- encourages clean separation of domain definitions from runtime systems
- good fit with existing scope infrastructure

Cons:

- slightly more product complexity
- requires pack management and stronger configuration discipline

Best path:

Start with Option A, but design the internals so it can naturally grow into Option B.

## What To Preserve At All Costs

These are the parts of Sherlock that feel differentiated and should survive expansion:

- the overall visual system and dense, cinematic interface language
- multi-entry launch flows that all converge cleanly
- local-first persistence and exportability
- graph exploration as a first-class surface
- scope-guided prompting
- task visibility and run history
- deep-dive chaining from one artifact into the next

The goal should be broader capability with the same sense of focus and momentum, not a generic "knowledge app."

## Concrete System Changes I Would Make

### Near-Term

- introduce a generic internal naming layer while keeping current UI labels
- add `mode`, `purpose`, and `artifactType` to run config
- expand output schema to support typed sections and follow-up items
- stop hardcoding root container titles as `Operation: ...`
- unify `Headline`, `FeedItem`, and `MonitorEvent` under a broader signal model over time

### Mid-Term

- create mode-specific label profiles and section renderers
- add support for concept and publication nodes in the graph
- add configurable artifact templates for research synthesis, technology landscape, scientific review, and executive briefing
- separate domain packs from purpose profiles in prompt construction

### Longer-Term

- migrate from investigation-specific types to generic workspace and artifact types
- support multiple artifact types inside one workspace
- build richer evidence, citation, and comparison structures
- consider workspace-level dashboards that differ by mode but share the same backbone

## Example Future Use Cases Sherlock Could Support Well

If generalized carefully, Sherlock could support all of the following with the same engine:

- "Investigate potential procurement fraud around a defense contractor."
- "Summarize the latest scientific findings on microplastics and human health."
- "Track the latest advances in agentic AI and build a weekly briefing."
- "Map the competitive landscape for open-source speech models."
- "Monitor regulatory changes affecting crypto policy in the U.S. and EU."
- "Create a research project collecting sources, entities, events, and follow-up questions around a biotech topic."

## Risks To Manage

### 1. Over-Generalization

If every screen becomes abstract, Sherlock could lose its edge. The answer is not generic blandness. The answer is a strong core with mode-specific language and sectioning.

### 2. Data Model Drift

If you bolt on new purposes without clarifying the object model, the schema and store will become harder to reason about. This is why the next step should be a deliberate taxonomy pass.

### 3. Prompt And Output Inconsistency

As you broaden use cases, output shape matters more. Without a stronger artifact schema, new modes will feel inconsistent and fragile.

### 4. UI Label Debt

A lot of current polish comes from strong investigation framing. When broadening the app, the wording should be abstracted carefully so the product still feels intentional and premium.

## Recommended Sequence

### Phase 1: Taxonomy And Contract Design

Define the future internal model before changing screens.

Deliverables:

- glossary of core objects
- mode and purpose matrix
- next-generation artifact schema
- migration map from current `Investigation*` types

### Phase 2: Backward-Compatible Data And Config Expansion

Add new fields and metadata while keeping the current app working.

Deliverables:

- config changes
- schema migrations
- updated repository adapters

### Phase 3: Flexible Artifact Rendering

Teach the existing report view to render typed sections instead of a fixed investigation layout.

Deliverables:

- section renderer registry
- mode-aware labels
- artifact templates

### Phase 4: New Domain Packs

Launch 2 to 3 non-OSINT modes to prove the model.

Recommended first packs:

- Scientific Research
- AI and Technology Landscape
- Policy and Regulatory Tracking

### Phase 5: Refine Navigation Language

Once the system truly supports broader work, update the user-facing vocabulary selectively and intentionally.

## Final Recommendation

Sherlock is already most of the way toward being a general knowledge and research platform.

The right move is not to abandon the current investigation architecture. It is to elevate it into a more neutral internal system while preserving the current interaction quality, information density, and flow design.

If I had to summarize the strategy in one sentence:

Keep the engine, generalize the nouns, enrich the artifact schema, and let domain packs shape the experience on top.
