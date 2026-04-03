# Investigation Scopes

Source of truth: `src/data/presets.ts`.

In Stream 1, scopes still drive the existing UI, but they also act as the source material for derived first-party domain packs.

## Built-in Scopes

1. `government-fraud`
2. `corporate-due-diligence`
3. `geopolitical-analysis`
4. `cybersecurity-research`
5. `competitive-intelligence`
6. `scientific-research`
7. `ai-technology-landscape`
8. `policy-regulation`
9. `open-investigation`

Default scope ID: `open-investigation`.

## Scope Shape

Each scope defines:

- `id`, `name`, `description`
- `domainContext`
- `investigationObjective`
- `defaultDateRange`
- `suggestedSources`
- `categories`
- `personas`
- `defaultPersona`
- optional domain-pack metadata:
  - `workspaceMode`
  - `labelProfileId`
  - `supportedPurposeIds`
  - `defaultPurposeId`
  - `defaultArtifactType`
- optional `accentColor` / `icon`

## Runtime Behavior

- scopes are selectable in `TaskSetupModal` step 0
- scope affects categories, persona defaults, and prompt context
- scope now also acts as the backing definition for a derived domain pack
- feed category options are derived from active scope categories
- custom scopes are persisted and merged with built-ins

## Personas

Persona definitions are scope-local and include:

- `id`
- `label`
- `instruction`

Selected persona is passed into run config and persisted on task/report snapshots.

## Domain-Pack Derivation

Stream 1 derives first-party domain packs from scopes via `src/domain/packs.ts`.

This means a built-in scope now influences:

- workspace mode
- label profile
- default purpose profile
- default artifact type
- supported purposes for the run

## Custom Scope Management

Custom scopes are managed in:

- `System Config -> Scopes`
- persisted via `ScopeRepository`

Helper functions:

- `getScopeById(id)` (built-in lookup)
- `getAllScopes(customScopes)` (built-ins + custom)
