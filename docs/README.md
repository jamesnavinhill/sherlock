# Sherlock docs

This repository is the source of truth for Sherlock's Mintlify documentation site. It holds the docs content, navigation, theme overrides, and Mintlify workflows that publish the public docs site.

## What lives here

- `docs.json`: site navigation, branding, colors, and Mintlify config
- `style.css`: Sherlock-specific visual overrides for the Mintlify theme
- `*.mdx`: documentation pages
- `.mintlify/workflows/`: automation that turns Sherlock app changes into docs drafts or PRs

## Mintlify skills

Install Mintlify's authoring skills from the root of this docs repo:

```bash
npx skills add https://mintlify.com/docs
```

That install is best treated as project-local tooling for the docs repo. The `skills` CLI creates local agent assets such as `.agents/skills/` and `skills-lock.json`; those are generated artifacts, not the source of truth for the docs site, so they are ignored in git here.

If you want the Mintlify skills available outside this repo too, install them globally instead of relying on the project-local copy.

## Local preview

Install the Mintlify CLI globally on Windows if you do not already have it:

```powershell
npm i -g mint
```

Run docs commands from the folder that contains `docs.json`:

```powershell
npm run dev
npm run check:links
npm run validate
```

The local site will usually be available at `http://localhost:3000`.

## Publishing

Mintlify deploys this site automatically from the connected GitHub repository and default branch. The separate Sherlock app repo does not directly deploy these docs unless a Mintlify workflow opens a docs change in this repo.

## References

- [Mintlify documentation](https://mintlify.com/docs)
- [Sherlock Mintlify operations notes](../sherlock/docs/operations/MINTLIFY_DOCS.md)
