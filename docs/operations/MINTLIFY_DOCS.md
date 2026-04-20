# Mintlify Docs Setup

This document records Sherlock's public documentation setup as of April 20, 2026.

## Current topology

- App repo: `jamesnavinhill/sherlock`
- Docs repo: `jamesnavinhill/docs`
- App deployment: `https://sherlock-osint.vercel.app/`
- Docs deployment: `https://jamesnavinhill.mintlify.app/`
- Target public docs path on the app domain: `/docs`

Sherlock intentionally keeps public docs in a separate repository for now. The existing `docs/` directory in the app repo remains the source of internal engineering and operations documentation.

## Source of truth

- Mintlify Git Settings should continue pointing at `jamesnavinhill/docs` on the deploy branch.
- Mintlify does not automatically publish from both `docs` and `sherlock` at the same time.
- Documentation updates triggered by `sherlock` changes should flow through Mintlify Workflows that write back into the docs repo.

## Vercel subpath proxy

To expose the Mintlify site at `https://sherlock-osint.vercel.app/docs`:

1. In Mintlify, open `Settings -> Domain setup`.
2. Enable `Host at /docs`.
3. Add the Sherlock Vercel domain.
4. In the Sherlock app repo, keep the `/docs` rewrites in `vercel.json` above the SPA catch-all rewrite.

Current rewrite target:

- `https://jamesnavinhill.mintlify.dev/docs`

If the Mintlify dashboard subdomain changes later, update the Vercel rewrite destination to the new `[subdomain].mintlify.dev/docs` host.

## GitHub app access

The Mintlify GitHub App should have access to:

- `jamesnavinhill/docs`
- `jamesnavinhill/sherlock`

Why both are needed:

- `docs` is the writable docs repository that Mintlify deploys.
- `sherlock` is the trigger and code-context repository for workflows that draft docs updates from product changes.

## Workflow location

Mintlify file-based workflows live in the docs repository at:

- `.mintlify/workflows/*.md`

The current automation file is:

- `.mintlify/workflows/update-docs-from-sherlock.md`

That workflow is designed to:

- trigger on pushes to `jamesnavinhill/sherlock` `main`
- review end-user-facing product changes
- update or draft the appropriate Mintlify docs pages in `jamesnavinhill/docs`
- open a PR instead of auto-merging by default

## Dashboard checks

After committing workflow files, verify these items in Mintlify:

1. `Git Settings` still points to `jamesnavinhill/docs` on the expected deploy branch.
2. `GitHub App` lists both `docs` and `sherlock` as connected repositories.
3. `Workflows` shows the new file-based workflow as active.
4. `Domain setup` shows the Sherlock Vercel domain with `Host at /docs` enabled.

## Operating notes

- Keep public docs authoring in the separate docs repo.
- Keep internal implementation and operations notes in `sherlock/docs/operations`, `docs/plans`, and `docs/reports`.
- If the workflow starts opening noisy PRs for internal-only refactors, tighten the prompt instead of moving the docs source repo.
- If the team later wants code and public docs to ship from the same PR, revisit a Mintlify monorepo setup with a dedicated public docs directory inside `sherlock`.
