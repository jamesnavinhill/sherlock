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
- `F1` toggles the non-blocking design workbench.
- The workbench can export the current token set as JSON or resolved CSS custom properties.
