# Sherlock AI

> 🔍 An AI-powered OSINT (Open Source Intelligence) investigation platform for tracking fraud, waste, and abuse in government spending.

![Sherlock AI Dashboard](https://img.shields.io/badge/status-active-brightgreen) ![React 19](https://img.shields.io/badge/react-19-blue) ![Vite](https://img.shields.io/badge/vite-6-purple) ![Providers](https://img.shields.io/badge/providers-gemini%20%7C%20openrouter%20%7C%20openai%20%7C%20anthropic-orange)

## Overview

Sherlock AI is a sophisticated React SPA that simulates the workflow of an OSINT investigator. It uses a provider router that supports Gemini, OpenRouter, OpenAI, and Anthropic with a unified investigation contract:

- **Web-grounded investigations** — Deep dives into any topic with real-time web search
- **Entity extraction** — Automatic identification of people, organizations, and relationships
- **Network visualization** — D3.js-powered graph of connections between entities
- **Live monitoring** — Stream intelligence from news, social media, and official sources
- **Headline persistence** — Save live intel as first-class case items for follow-up

## Features

| Feature                    | Description                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| 🎯 **Operation View**       | Primary "Command Center" workspace with resizable 3-panel layout (Dossier, Report, Inspector) |
| 🔮 **Investigation Wizard** | Multi-step pre-flight configuration for investigations                                        |
| 🕸️ **Network Graph**        | Interactive D3.js visualization with entity flagging, manual nodes, and force simulation      |
| 📡 **Live Monitor**         | Real-time intel streaming with event cards and headline persistence                           |
| 📁 **Case Management**      | Organize investigations with hierarchical reports and breadcrumb navigation                   |
| 🔊 **Voice Briefings**      | Text-to-speech summaries powered by Gemini TTS                                                |
| 🎨 **Theme System**         | Six customizable accent color schemes                                                         |
| 📤 **Export**               | Export cases and reports as styled HTML dossiers or JSON                                      |

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS (CDN)
- **AI**: Multi-provider adapter/router (`src/services/providers/*`) + Google Gemini SDK (`@google/genai`)
- **Visualization**: D3.js v7
- **Linting**: ESLint 9 + Prettier
- **Fonts**: JetBrains Mono, Inter

## Getting Started

### Prerequisites

- Node.js 18+
- At least one provider API key:
  - [Google Gemini key](https://aistudio.google.com/app/apikey)
  - [OpenRouter key](https://openrouter.ai/keys)
  - [OpenAI key](https://platform.openai.com/api-keys)
  - [Anthropic key](https://console.anthropic.com/settings/keys)

### Installation

```bash
# Clone the repository
git clone https://github.com/jamesnavinhill/sherlock.git
cd sherlock

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Configuration

On first launch, you'll be prompted to enter a provider key. Keys are stored locally in your browser and never sent to Sherlock servers.

Alternatively, create a `.env.local` file:

```env
# Gemini
VITE_GEMINI_API_KEY=AIza...

# OpenRouter
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# OpenAI
VITE_OPENAI_API_KEY=sk-...

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Provider and model selection is configured in **Settings → AI** and persisted in `sherlock_config`.

## Project Structure

```
sherlock/
├── src/
│   ├── App.tsx                    # Root orchestrator
│   ├── types/                     # TypeScript interfaces
│   ├── utils/                     # Shared utilities (text, audio, localStorage)
│   ├── components/
│   │   ├── ui/                    # Reusable UI primitives (Accordion, EmptyState)
│   │   └── features/              # Feature modules
│   │       ├── OperationView/     # Main workspace components
│   │       │   ├── index.tsx      # Orchestrator
│   │       │   ├── DossierPanel.tsx
│   │       │   ├── ReportViewer.tsx
│   │       │   ├── InspectorPanel.tsx
│   │       │   └── Toolbar.tsx
│   │       ├── NetworkGraph/      # Graph visualization components
│   │       │   ├── index.tsx      # Orchestrator
│   │       │   ├── GraphCanvas.tsx
│   │       │   ├── NodeDossier.tsx
│   │       │   └── NodeInspector.tsx
│   │       ├── LiveMonitor/       # Intel stream components
│   │       │   ├── index.tsx
│   │       │   ├── EventCard.tsx
│   │       │   └── SettingsPanel.tsx
│   │       ├── Archives.tsx       # Case file browser
│   │       ├── Feed.tsx           # Dashboard/Finder
│   │       └── Settings.tsx       # System configuration
│   └── services/
│       ├── gemini.ts              # App-facing compatibility facade
│       └── providers/             # Provider adapters, router, shared utils
├── legacy/
│   └── work-log.md                # Consolidated project history
├── docs/
│   ├── architecture.md            # Technical architecture
│   └── SOURCES.md                 # Data sources
└── package.json
```

## Usage

1. **Operation View** — Primary workspace with dossier panel, report viewer, and entity inspector
2. **Investigation Wizard** — Click "+ New Case" to launch multi-step configuration (target, hypothesis, key figures, sources, settings)
3. **Deep Dive** — Click any lead to spawn a sub-investigation linked to the parent
4. **Network Graph** — Visualize connections, flag entities, merge duplicates, create manual nodes
5. **Live Monitor** — Select a case and stream real-time intelligence; save items as Headlines
6. **Case Files** — Browse archived investigations, export dossiers as HTML/JSON

## Configuration Options

Access via **System Config** in the sidebar:

| Setting             | Options                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Provider**        | Gemini (default), OpenRouter, OpenAI, Anthropic                                            |
| **Model**           | Provider-specific runtime-ready model list                                                  |
| **Thinking Budget** | Model capability-gated; enabled for supported Gemini models                                |
| **Persona**         | Scope/persona driven investigator mode                                                      |
| **Search Depth**    | Standard or Deep Dive (prioritizes obscure sources)                                         |

## Data Storage

All data is stored locally in browser `localStorage`:

| Key                       | Content                  |
| ------------------------- | ------------------------ |
| `sherlock_archives`       | `InvestigationReport[]`  |
| `sherlock_cases`          | `Case[]`                 |
| `sherlock_headlines`      | `Headline[]`             |
| `sherlock_manual_links`   | `ManualConnection[]`     |
| `sherlock_manual_nodes`   | `ManualNode[]`           |
| `sherlock_active_case_id` | Currently active case ID |
| `sherlock_config`         | Persisted provider/model/persona/search config |
| ...                       | ...                      |

Use **System Config → Data Management** to export/import backups.

## Operations Runbook

Provider debugging and incident response steps are documented in `docs/OPERATIONS_RUNBOOK.md`.

## License

MIT

## Acknowledgments

- Built with [Google Gemini](https://ai.google.dev/)
- Matrix rain effect inspired by the classic Hollywood hacker aesthetic
- Originally prototyped in [Google AI Studio](https://aistudio.google.com/)
