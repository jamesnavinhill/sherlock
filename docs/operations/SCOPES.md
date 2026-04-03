# Investigation Scopes

Source of truth: `src/data/presets.ts`.

## Built-in Scopes

1. `government-fraud`
2. `corporate-due-diligence`
3. `geopolitical-analysis`
4. `cybersecurity-research`
5. `competitive-intelligence`
6. `open-investigation`

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
- optional `accentColor`/`icon`

## Runtime Behavior

- Scopes are selectable in `TaskSetupModal` step 0.
- Scope affects categories, persona defaults, and prompt context.
- Feed category options are derived from active scope categories.
- Custom scopes are persisted and merged with built-ins.

## Personas

Persona definitions are scope-local and include:

- `id`
- `label`
- `instruction`

Selected persona is passed into run config and persisted on task/report snapshots.

## Custom Scope Management

Custom scopes are managed in:

- `System Config -> Scopes`
- persisted via `ScopeRepository`

Helper functions:

- `getScopeById(id)` (built-in lookup)
- `getAllScopes(customScopes)` (built-ins + custom)
