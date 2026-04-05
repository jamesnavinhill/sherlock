# Deployment

Sherlock currently deploys as a static Vite application. The shipped app does not require a server runtime or server-side database for its current browser-local BYOK model.

## Runtime Model

- Static assets are built with Vite and can be served by Vercel.
- Workspace and artifact data persist locally in the browser through SQLite backed by IndexedDB.
- Provider API keys persist locally in the browser when entered through `System Config -> AI`.
- Provider requests are sent from the browser directly to the configured AI provider.

## Route Entry And SPA Rewrites

Sherlock is now route-backed and still client-rendered.

To support direct entry for deep-linked client routes on Vercel, `vercel.json` now includes a same-app rewrite:

- `/(.*)` -> `/index.html`

This ensures Vercel serves the SPA entry document for non-root client routes so the browser app can take over routing after load.

Notes:

- this rewrite is needed because Vercel otherwise treats path-based requests as server-resolved paths and can return a 404 before the client router boots
- client routes such as `/runs/:runId`, `/workspaces/:workspaceId/artifacts/:artifactId`, `/workspaces/:workspaceId/chat/:sessionId`, and `/workspaces/:workspaceId/board/:boardId` now resolve through the browser router after load
- if Sherlock later adds first-party server endpoints or other path-based server concerns, the rewrite rules should be revisited so client-route fallback does not mask those paths

## Public Repo Checklist

- Keep `.env`, `.env.local`, and other local env files untracked.
- Do not add shared provider API keys to Vercel env vars for a public deployment.
- Prefer strict BYOK: each user enters their own provider key in-app.
- Enable GitHub secret scanning after the repository is public.
- If any secret alert appears, treat the key as compromised and rotate it immediately.
- Remember that older commit history matters too; review GitHub secret-scanning alerts after publication even if the current tree looks clean.

## Vercel Flow

1. Import the GitHub repository into Vercel.
2. Use the repo `vercel.json`, or configure the same values manually:
   `installCommand`: `npm ci --include=optional`
   `buildCommand`: `npm run build`
   `outputDirectory`: `dist`
3. Leave provider env vars unset in Vercel for public BYOK hosting.
4. Deploy the site.
5. Open the deployed app and add provider keys through `System Config -> AI` on a per-browser basis.

## Persistence Caveats

- Each Vercel preview URL gets its own browser storage namespace.
- The production domain has its own separate browser storage namespace.
- Redeploying does not wipe local IndexedDB or localStorage for an unchanged origin.
- Clearing browser storage removes local workspaces, artifacts, and browser-stored keys unless they were exported first.
- If you need shared data, server-owned keys, auth, or cross-device sync, the current architecture will need a backend and server-side database.
