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
- Canon typography is now a real exported family under `src/components/canon/typography/*`, so consumers can import shared heading/body/meta/code primitives instead of reaching for raw type class names.
- `MenuButton` and `OptionGroup` now expose their remaining reusable control contract types explicitly, including readonly item/options collections and single vs. multiple option-group prop shapes.
- `PageShell` is the main reusable shell contract and now exposes explicit left/right utility-panel slots alongside the existing rails, so docked tools can plug into the shell without relying on fixed overlays.
- The workbench is part of the shipped reusable shell system, now implemented as one reusable docked utility-panel consumer rather than a special fixed overlay.
- The global config-panel shell, reusable rail disclosure tree, list-action rows, and sidebar footer actions now also live in canon instead of being assembled inline in `App.tsx`.
- Overlay canon now has three tiers: lightweight list/menu selectors, natural divider-based content sections for dialog/config bodies, and inset overlay sections when a nested sub-surface is actually needed.
- Family-based styles now live under `src/styles/`, split into `base.css`, `typography.css`, `shell.css`, `controls.css`, `surfaces.css`, `conversation.css`, and `workbench.css`, with `src/index.css` acting as the import hub.
- Motion timing, shared transition stacks, backdrop blur, and accent-preview shadows now resolve through canon CSS variables so shell, controls, surfaces, and workbench use one interaction language.
- Accent icon glow and range-thumb halo treatments now also resolve through named canon variables instead of one-off style literals.
- Shared raised/subtle/workbench surface fills and range-track treatments now also resolve through named system variables across controls, conversation, surfaces, base typography, and workbench styles.
- Shell chrome, overlay backdrop, button emphasis fills, muted/emphasis borders, and dialog section fills now also resolve through named system variables instead of raw surface-color references or family-local literals.
- Modal and workflow dialog widths now resolve through family-scoped surface tokens, modal section rhythm stays shared, and toast tones derive from the existing graph palette instead of new notification colors.
- Conversation role surfaces now also resolve through named system variables, and the internal `utils` barrel now follows the same explicit-export rule as the public canon barrels.
- `DateRangePicker` now supports both full field layout and compact inline toolbar triggers while reusing the shared overlay divider language for its header and footer framing.
- `F1` toggles the non-blocking design workbench.
- The workbench now ships with full theme templates, separate page-background color tuning, and a distinct page-structure tuning surface for shell, rail, panel, and surface tokens.
- The workbench can export the current token set as JSON or resolved CSS custom properties, and it now docks left or right inside the shell body instead of floating over the rails.
- The desktop shell now supports a collapsed sidebar state, and toolbar actions compact to icon-first controls as space tightens.
- Mobile behavior now uses lighter overlay sheets for sidebar/library/inspector regions instead of full-height blurred takeovers.
- See `docs/CANON_INVENTORY.md` for the current reusable family ownership and public inventory.
