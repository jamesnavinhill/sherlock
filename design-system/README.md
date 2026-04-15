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
- `F1` toggles the non-blocking design workbench.
- The workbench can export the current token set as JSON or resolved CSS custom properties.
- Mobile behavior now uses overlay drawers for sidebar/library/inspector regions instead of dropping those surfaces entirely.
