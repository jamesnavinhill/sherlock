# Changelog x Sherlock Feasibility Report

Date: 2026-04-08

Status: Feasible, but not as a straight resurrection

## Executive Summary

`changelog` and `sherlock` fit together well at the idea level, but not in their current shipped shapes.

The strongest path is:

- do not revive `changelog` as a standalone product with its old UI, API auth, analytics, SDK, and deployment model
- do extract its useful core idea: source adapters, normalization, deduplication, and compact knowledge bundles
- do rebuild that core as a Sherlock-aligned ingestion subsystem with a new output contract
- do treat Sherlock as the product surface and Changelog as an upstream acquisition layer

This is feasible because Sherlock already has durable local-first structures for:

- `signals`
- `sources`
- `artifacts`
- `keyFindings`
- `workspaceItems` with `INGESTION` provenance
- workspace search and library surfacing for findings, sources, signals, and imported material

This is not a clean resurrection because the current `changelog` codebase is frozen, narrowly categorized, and quality-limited in ways that would create drift if we tried to preserve it whole.

## What I Checked

### Changelog

- repo present at `c:\Users\james\projects\changelog`
- branch clean on `main`
- last commit on `2026-03-08`: `git kill`
- no `.github/` directory remains
- active app lives in `main/`
- stack is `Next.js 16` + `React 19` + Gemini synthesis
- current adapters: Wikipedia, Hacker News, arXiv, Reuters, GitHub, TechCrunch, Product Hunt, WHO, PubMed, TLDR
- persisted output snapshot range currently bundled: `2026-01-06` through `2026-01-17`
- bundled JSON snapshot count: `11`
- `main/node_modules` is missing, so I did not execute the Changelog runtime in this review

### Sherlock

- repo present at `c:\Users\james\projects\sherlock`
- branch clean on `main`
- last commit on `2026-04-08`
- stack is `Vite + React + TypeScript + browser-local SQLite`
- current architecture is intentionally local-first and static-host deployable
- current validation on this checkout passed: `npm run check`

## Current-State Fit

### What Changelog already has that is valuable

- adapter pattern for fetching source material
- normalization, deduplication, classification, summarization, and compression stages
- persisted JSON and Markdown outputs
- a compact knowledge-bundle concept that could become a Sherlock import format

### What Sherlock already has that can absorb it

- canonical `Artifact`, `Signal`, `Source`, and `KeyFinding` models
- browser-persistent SQLite tables for all of those records
- workspace library entries for artifacts, findings, sources, and signals
- workspace search indexing for reports, sections, evidence, findings, sources, and signals
- ingestion-oriented provenance already in the type system via `WorkspaceItem.provenance.source = 'INGESTION'`
- import/export machinery for canonical workspace data

## Why A Straight Revival Is The Wrong Shape

### 1. Changelog is a frozen product shell, not an active subsystem

The current app includes:

- a standalone Next.js UI
- API routes
- API key auth and rate limits
- analytics tracking
- a separate SDK

That all made sense when Changelog was its own product. It does not match Sherlock's current runtime model, which is a static local-first application with no first-party backend requirement.

### 2. Changelog's data contract is too coarse for Sherlock

The current Changelog schema is essentially:

- `domain`
- `importance`
- `category`
- `title`
- `summary`
- `sourceUrl`
- `sourceName`
- timestamps
- quality score

That is enough for a feed or API response, but it is too thin for Sherlock's richer investigation surfaces unless we add:

- canonical source identities
- raw-item capture
- evidence-level records
- normalized entity extraction
- tags aligned to Sherlock scopes/packs
- ingest-run provenance
- import bundle metadata

### 3. The current source quality is not strong enough to trust as-is

The bundled `2026-01-17.json` shows visible quality problems:

- Reuters items are actually coming through Google News RSS redirect links rather than canonical Reuters URLs
- some titles and summaries are polluted with multi-outlet fragments
- some entries appear misclassified into `tech`

That does not make the project a dead end. It does mean we should not pipe the current output straight into Sherlock and call it a knowledge layer.

### 4. Changelog has no durable raw extraction layer

Today the useful output is the final summarized bundle. What Sherlock really wants is a fuller ladder:

1. raw source item
2. normalized item
3. deduplicated cluster
4. synthesized findings
5. workspace-ready import bundle

Without that ladder, later debugging, trust review, and reprocessing stay harder than they need to be.

## Feasible Integration Shapes

## Option A: Revive Changelog as a separate service, then consume it from Sherlock

Shape:

- restore Changelog deployment
- restore scheduled runs
- generate hosted JSON/API outputs
- have Sherlock import or query those outputs

Pros:

- preserves clean product boundary
- can power other consumers besides Sherlock
- centralizes source fetching away from the browser

Cons:

- recreates backend and deployment overhead Sherlock currently avoids
- duplicates product surface and maintenance burden
- increases drift risk between Changelog output and Sherlock needs
- keeps the old coarse schema unless we rebuild it anyway

Assessment:

- feasible
- not recommended as the primary plan for Sherlock

## Option B: Port the useful Changelog core into Sherlock as a new ingestion subsystem

Shape:

- create a new Sherlock-owned ingest package or tool
- keep adapter and normalization ideas
- emit a new Sherlock-native bundle contract
- import bundle contents into Sherlock workspaces as signals, artifacts, findings, sources, and optional workspace items

Pros:

- directly aligned to Sherlock's data model
- avoids preserving dead product layers
- supports offline or no-web-search use after ingestion
- cleaner greenfield rebuild with less drift

Cons:

- still requires a non-browser runner for source acquisition if we want live fresh data
- requires a new import contract and ingestion UX
- needs source-by-source quality and policy review

Assessment:

- feasible
- recommended

## Option C: Minimal bridge using existing Changelog snapshots only

Shape:

- define a translator from current Changelog JSON into Sherlock records
- import historical bundles into one or more Sherlock workspaces
- use this as a seeded knowledge corpus

Pros:

- fastest way to prove value
- no scraping rebuild required to start
- gives Sherlock a local searchable knowledge layer quickly

Cons:

- stale immediately beyond `2026-01-17`
- inherits Changelog's current quality issues
- not enough for the long-term target on its own

Assessment:

- feasible
- good as a temporary bootstrap, not as the end state

## Recommended Plan

Build a greenfield Sherlock-owned ingestion lane informed by Changelog, not a revival of Changelog as-is.

Recommended product shape:

- Sherlock remains the user-facing product
- Changelog becomes a source pattern library and migration input
- a new ingest tool produces `Sherlock Intel Bundles`
- Sherlock imports those bundles into local SQLite
- imported knowledge becomes available to search, chat grounding, board placement, timeline context, and artifact generation without requiring live web search for already-ingested material

## Recommended Technical Architecture

### 1. New bundle contract

Define a new import format, for example:

- `bundle`
- `bundleVersion`
- `generatedAt`
- `sourceRun`
- `sourceItems`
- `clusters`
- `signals`
- `artifacts`
- `sources`
- `keyFindings`
- `workspaceItems` optional
- `metadata`

The important shift is that the bundle should preserve both:

- reusable summarized intelligence
- enough raw or normalized source detail to audit and re-search locally later

### 2. Map the imported data into Sherlock primitives

Suggested mapping:

- raw or normalized feed items -> `signals`
- canonical article or document refs -> `sources`
- daily, topic, or domain synthesis -> `artifacts`
- synthesized key points -> `keyFindings`
- optional clipped source text or operator notes -> `workspaceItems` with `INGESTION` provenance

### 3. Keep source acquisition out of the browser

If the goal is "report directly without web search," the data still has to arrive somehow.

The practical choices are:

- operator-run local CLI that fetches sources and exports bundles
- scheduled hosted runner that publishes bundle JSON
- checked-in static bundles for curated seeds or demos

For Sherlock's current architecture, the cleanest fit is a local or hosted runner that produces bundle JSON, with Sherlock only handling import and use.

### 4. Narrow the source set before broad scraping

Do not start with generic scraping.

Start with sources that are structurally stable and lower-risk:

- RSS feeds
- official APIs
- official press or research feeds
- sources already aligned to Sherlock scopes

This avoids a large scraping problem before we prove the product value of the ingest layer.

### 5. Rebuild taxonomy around Sherlock scopes, not Changelog domains

Changelog's current domains are:

- tech
- business
- science
- health
- politics

Sherlock's source model is scope-driven. The ingest layer should classify by:

- Sherlock scope or pack alignment
- source type
- entity/topic tags
- urgency or monitoring relevance

That is a better fit than preserving the old five-domain split.

## Key Risks

### Source quality risk

If we ingest low-quality redirected or polluted feed items, Sherlock will become a confident interface over weak inputs.

Mitigation:

- preserve canonical URLs when possible
- store acquisition metadata
- add source quality tiers
- keep raw item traceability in the bundle

### Licensing and policy risk

Some outlets may tolerate links and summaries but not durable scraped body storage.

Mitigation:

- prefer official feeds and APIs first
- store minimal necessary text
- keep publisher-specific handling explicit

### Architecture drift risk

If we try to preserve too much of old Changelog, we will carry dead API/auth/analytics concerns into Sherlock.

Mitigation:

- treat old Changelog as reference input, not target architecture
- rebuild around a new contract

### Freshness model risk

If Sherlock remains purely browser-local, imported knowledge is only as current as the last bundle import for that device or origin.

Mitigation:

- make the freshness model explicit
- choose whether bundles are manual, scheduled, or both

## Roadmap Recommendation

If we "full send" this rather than incrementally tinker, the clean roadmap is:

### Stream 1: Define the Sherlock ingest contract

- finalize bundle schema
- finalize source-quality and provenance fields
- finalize record mapping into `signals`, `sources`, `artifacts`, `keyFindings`, and optional `workspaceItems`

### Stream 2: Build the new ingest runner

- port or rewrite the adapter layer from Changelog
- normalize raw items
- deduplicate and cluster
- create deterministic Sherlock-ready bundles

### Stream 3: Build Sherlock import and consumption

- add bundle import flow
- create or update workspace ingestion UX
- expose imported knowledge across Files, Timeline, Chat grounding, Board, and Operation View

### Stream 4: Add operating model

- local operator CLI, scheduled publish job, or both
- curated source packs aligned to Sherlock scopes
- bundle freshness and versioning rules

## Practical Conclusion

Yes, this is worth doing.

But the right question is not "should we resurrect Changelog?"

The right question is:

"Should we build a Sherlock-native ingest layer using Changelog as source material and reference architecture?"

My answer is yes.

## Decisions Needed To Lock The Roadmap

1. Should the first release be:
   - a Sherlock importer for curated static bundles
   - or a full fresh-data ingest system with a runner included from day one

2. Should imported knowledge live as:
   - one shared long-lived workspace per source pack or domain
   - or many time-sliced workspaces such as daily or weekly digests

3. Should the first source pack target:
   - AI and technology
   - policy and regulation
   - scientific research
   - or a cross-scope minimal pack built only from stable official feeds

4. Should the runner operate as:
   - local CLI only
   - scheduled hosted job only
   - or both

5. Should imported source material remain:
   - summary-forward with links and compact evidence only
   - or as rich as possible with more retained raw text where policy allows

## Recommendation In One Sentence

Do a greenfield Sherlock ingestion build, reuse Changelog's ideas and some adapter logic, and do not spend effort reviving the abandoned standalone Changelog product shell.
