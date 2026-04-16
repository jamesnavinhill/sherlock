# Canon Design System Studio

Standalone design-system app extracted from Sherlock's shell language and rebuilt as a portable studio.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
```

## Notes

- This app is intentionally self-contained and does not import Sherlock source files.
- Reusable canon components now live under `src/components/canon/`, split into `controls/`, `conversation/`, `disclosure/`, `layout/`, `navigation/`, `surfaces/`, `utils/`, and `workbench/`.
- The public reusable canon entry point is `src/components/canon/index.ts`; `utils/*` remains implementation-oriented rather than part of the top-level public API.
- The workbench is part of the shipped reusable shell system, not studio-only code.
- Overlay canon now has two tiers: lightweight list/menu selectors and richer structured config/workflow overlays for popouts and wizards.
- Family-based styles now live under `src/styles/`, split into `base.css`, `shell.css`, `controls.css`, `surfaces.css`, `conversation.css`, and `workbench.css`, with `src/index.css` acting as the import hub.
- Motion timing, backdrop blur, and shared accent-preview shadows now resolve through canon CSS variables so shell, controls, surfaces, and workbench use one interaction language.
- `F1` toggles the non-blocking design workbench.
- The workbench can export the current token set as JSON or resolved CSS custom properties.
- The desktop shell now supports a collapsed sidebar state, and toolbar actions compact to icon-first controls as space tightens.
- Mobile behavior now uses lighter overlay sheets for sidebar/library/inspector regions instead of full-height blurred takeovers.
- See `docs/CANON_INVENTORY.md` for the current reusable family ownership and public inventory.
