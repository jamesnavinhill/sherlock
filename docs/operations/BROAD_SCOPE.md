# Broad Scope

This document defines Sherlock's practical product boundary in the current codebase.

## Core Problem

Sherlock helps analysts run iterative investigations by combining:

- AI-generated reports
- case-centric organization
- entity/link visualization
- live event monitoring
- exportable investigation artifacts

## What Is In Scope

- Browser-based investigation workspace (single-page app)
- Multi-provider AI routing (`GEMINI`, `OPENROUTER`, `OPENAI`, `ANTHROPIC`)
- Scope/persona guided prompts
- Case/report/headline lifecycle management
- Graph workflows for entities and manual relationships
- Local-first persistence via browser SQLite
- Lightweight operational controls for providers and keys

## What Is Intentionally Out of Scope

- Backend multi-user collaboration or server auth
- Centralized remote data warehousing
- Guaranteed real-time ingestion infrastructure
- Immutable legal-grade chain-of-custody controls
- Turnkey external API connectors beyond model/web-search capabilities

## Current UX Entry Points

- Finder (scan + launch)
- Operation View (primary deep work surface)
- Network Graph (entity relationship analysis)
- Live Monitor (event stream and escalation)
- Case Files (archive and export)
- System Config (providers, scopes, templates, maintenance)

## Non-Goals for Documentation

- Do not treat `docs/_legacy/*` as current runtime truth.
- Keep this scope document tied to implemented behavior, not aspirational roadmap.
