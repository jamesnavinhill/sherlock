# Sherlock AI

> 🔍 An AI-powered OSINT (Open Source Intelligence) investigation platform for tracking fraud, waste, and abuse in government spending.

![Sherlock AI Dashboard](https://img.shields.io/badge/status-active-brightgreen) ![React 19](https://img.shields.io/badge/react-19-blue) ![Vite](https://img.shields.io/badge/vite-6-purple) ![Gemini AI](https://img.shields.io/badge/gemini-3.0-orange)

## Overview

Sherlock AI is a sophisticated React SPA that simulates the workflow of an OSINT investigator. It leverages Google's Gemini AI models to perform:

- **Web-grounded investigations** — Deep dives into any topic with real-time web search
- **Entity extraction** — Automatic identification of people, organizations, and relationships
- **Network visualization** — D3.js-powered graph of connections between entities
- **Live monitoring** — Stream intelligence from news, social media, and official sources
- **Headline persistence** — Save live intel as first-class case items for follow-up

## Features

| Feature | Description |
|---------|-------------|
| 🎯 **Operation View** | Primary "Command Center" workspace with resizable 3-panel layout (Dossier, Report, Inspector) |
| 🔮 **Investigation Wizard** | Multi-step pre-flight configuration for investigations |
| 🕸️ **Network Graph** | Interactive D3.js visualization with entity flagging, manual nodes, and force simulation |
| 📡 **Live Monitor** | Real-time intel streaming with event cards and headline persistence |
| 📁 **Case Management** | Organize investigations with hierarchical reports and breadcrumb navigation |
| 🔊 **Voice Briefings** | Text-to-speech summaries powered by Gemini TTS |
| 🎨 **Theme System** | Six customizable accent color schemes |
| 📤 **Export** | Export cases and reports as styled HTML dossiers or JSON |

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS (CDN)
- **AI**: Google Gemini SDK (`@google/genai`)
- **Visualization**: D3.js v7
- **Fonts**: JetBrains Mono, Inter

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier available)

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

On first launch, you'll be prompted to enter your Gemini API key. The key is stored locally in your browser and never sent to external servers.

Alternatively, create a `.env.local` file:

```env
GEMINI_API_KEY=your_api_key_here
```

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
│       └── gemini.ts              # Gemini AI integration
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

| Setting | Options |
|---------|---------|
| **Models** | Gemini 3.0 Flash/Pro, Gemini 2.5 Flash/Pro/Lite |
| **Thinking Budget** | 0-16K tokens for enhanced reasoning |
| **Persona** | Forensic Accountant, Journalist, Intelligence Officer, Conspiracy Analyst |
| **Search Depth** | Standard or Deep Dive (prioritizes obscure sources) |

## Data Storage

All data is stored locally in browser `localStorage`:

| Key | Content |
|-----|---------|
| `sherlock_archives` | `InvestigationReport[]` |
| `sherlock_cases` | `Case[]` |
| `sherlock_headlines` | `Headline[]` |
| `sherlock_manual_links` | `ManualConnection[]` |
| `sherlock_manual_nodes` | `ManualNode[]` |
| `sherlock_active_case_id` | Currently active case ID |
| ... | ... |

Use **System Config → Data Management** to export/import backups.

## License

MIT

## Acknowledgments

- Built with [Google Gemini](https://ai.google.dev/)
- Matrix rain effect inspired by the classic Hollywood hacker aesthetic
- Originally prototyped in [Google AI Studio](https://aistudio.google.com/)
