# Contributing to Sherlock AI

Thank you for your interest in contributing to Sherlock! We welcome contributions to our AI-powered OSINT platform.

## Code of Conduct

Please be respectful and professional in all interactions within this project.

## How to Contribute

1. **Report Bugs**: Use GitHub Issues to report any bugs you encounter.
2. **Suggest Features**: Open an issue to discuss new feature ideas.
3. **Submit Pull Requests**:
    * Fork the repository.
    * Create a feature branch (`git checkout -b feature/amazing-feature`).
    * Commit your changes.
    * Push to the branch.
    * Open a Pull Request.

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests (when implemented)
npm test
```

## Styling Guidelines

* Use **Vanilla CSS** for all styling.
* Follow the **OSINT Aesthetics**: Dark mode, mono fonts, high-contrast accents.
* Use `lucide-react` for icons.

## Architecture

Sherlock is built with:
* **Core**: React + TypeScript
* **State**: Zustand (`src/store/caseStore.ts`)
* **Intelligence**: Gemini API (`src/services/gemini.ts`)
* **Persistence**: Local Storage

For more details, see [architecture.md](./docs/architecture.md).
