# Broad Scope

This document defines Sherlock's practical product boundary in the current codebase.

## Core Problem

Sherlock helps analysts and researchers run iterative knowledge workflows by combining:

- AI-generated artifacts
- workspace-compatible organization built on existing case structures
- entity/link visualization
- live signal monitoring
- exportable local-first work products

## What Is In Scope

- browser-based knowledge workspace (single-page app)
- multi-provider AI routing (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- scope-derived domain packs and purpose profiles
- case/report/headline lifecycle management with compatibility for broader workspace and artifact concepts
- graph workflows for entities, concepts, sources, and manual relationships
- local-first persistence via browser SQLite
- lightweight operational controls for providers and keys
- pack-aware starter/template workflows for repeatable launches

## What Is Intentionally Out of Scope

- backend multi-user collaboration or server auth
- centralized remote data warehousing
- guaranteed real-time ingestion infrastructure
- immutable legal-grade chain-of-custody controls
- turnkey external API connectors beyond model/web-search capabilities

## Current UX Entry Points

- Finder (scan + launch)
- Operation View (primary deep work surface)
- Network Graph (entity relationship analysis)
- Live Monitor (event stream and escalation)
- Case Files (archive and export)
- System Config (providers, scopes, templates, maintenance)

## Non-Goals for Documentation

- do not treat `docs/_legacy/*` as current runtime truth
- keep this scope document tied to implemented behavior, not aspirational roadmap
