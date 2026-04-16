# Canon Design System Studio

Standalone design-system app rebuilt as a portable studio for the canon shell and component system.

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

- This app is intentionally self-contained and does not import application runtime source files.
- Canon files now live under `src/components/canon/`, split into reusable families plus internal helpers under `utils/`.
- The public reusable canon entry point is `src/components/canon/index.ts`; family barrels and the top-level barrel now use explicit named exports, while `utils/*` remains implementation-oriented rather than part of the public API.
- Canon components now also export the public prop/item/value types that are part of their reusable contract instead of hiding those shapes behind file-local interfaces.
- `MenuButton` and `OptionGroup` now expose their remaining reusable control contract types explicitly, including readonly item/options collections and single vs. multiple option-group prop shapes.
- `PageShell` is the main reusable shell contract and now exposes an explicit attached `workbench` slot instead of a generic floating-content escape hatch.
- The workbench is part of the shipped reusable shell system, not studio-only code.
- Overlay canon now has two tiers: lightweight list/menu selectors and richer structured config/workflow overlays for popouts and wizards.
- Family-based styles now live under `src/styles/`, split into `base.css`, `shell.css`, `controls.css`, `surfaces.css`, `conversation.css`, and `workbench.css`, with `src/index.css` acting as the import hub.
- Motion timing, backdrop blur, and shared accent-preview shadows now resolve through canon CSS variables so shell, controls, surfaces, and workbench use one interaction language.
- Accent icon glow and range-thumb halo treatments now also resolve through named canon variables instead of one-off style literals.
- Shared raised/subtle/workbench surface fills and range-track treatments now also resolve through named system variables across controls, conversation, surfaces, base typography, and workbench styles.
- Shell chrome, overlay backdrop, button emphasis fills, muted/emphasis borders, modal section fills, and overlay section tones now also resolve through named system variables instead of family-local literals.
- Dialog widths, modal section rhythm, and toast chroming now also resolve through shared surface tokens, and toast tones derive from the existing graph palette instead of new notification colors.
- Conversation role surfaces now also resolve through named system variables, and the internal `utils` barrel now follows the same explicit-export rule as the public canon barrels.
- `DateRangePicker` now supports both full field layout and compact inline toolbar triggers while reusing the shared overlay divider language for its header and footer framing.
- `F1` toggles the non-blocking design workbench.
- The workbench can export the current token set as JSON or resolved CSS custom properties.
- The desktop shell now supports a collapsed sidebar state, and toolbar actions compact to icon-first controls as space tightens.
- Mobile behavior now uses lighter overlay sheets for sidebar/library/inspector regions instead of full-height blurred takeovers.
- See `docs/CANON_INVENTORY.md` for the current reusable family ownership and public inventory.
