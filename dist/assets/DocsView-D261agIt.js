import{r as i,j as e}from"./vendor-react-UeBbIlMC.js";import{Y as L,X as D,a0 as d}from"./vendor-UONFH9ME.js";import{X as T,aH as W,k as _,ay as F,aI as N,at as R,ag as b,y as V,aJ as Y}from"./vendor-icons-BRPbjP9m.js";import{M as B}from"./vendor-markdown-CGgQHD8i.js";const S=[{group:"Get Started",pages:[{slug:"index",title:"Get started with Sherlock",description:"Start here for Sherlock setup, first-run guidance, provider keys, and the core workspace concepts."},{slug:"introduction",title:"Sherlock: AI-powered research and investigation tool",description:"Sherlock is a browser-based AI workspace for investigations, research boards, chat, and monitoring — all data stays local in your browser."},{slug:"quickstart",title:"Sherlock quickstart: from setup to first investigation",description:"Add an API key, create a workspace, and launch your first AI investigation — the complete first-run walkthrough for new Sherlock users."},{slug:"provider-setup",title:"Connect an AI provider to Sherlock with an API key",description:"Add API keys for Gemini, OpenRouter, OpenAI, or Anthropic in Settings → Runtime to unlock AI investigation runs and workspace chat."}]},{group:"Core Concepts",pages:[{slug:"concepts/workspaces",title:"Workspaces: organize and manage your research projects",description:"A workspace is Sherlock's top-level container for research on a topic, grouping artifacts, chat history, research boards, timelines, and signals."},{slug:"concepts/artifacts",title:"Artifacts: structured AI investigation reports in Sherlock",description:"Artifacts are the structured reports Sherlock produces from an AI run, containing key findings, evidence records, entities, sources, and follow-ups."},{slug:"concepts/scopes-and-domains",title:"Investigation scopes and domain packs for Sherlock runs",description:"Scopes are domain configurations that shape how Sherlock runs investigations, setting context, personas, and suggested sources for your research."},{slug:"concepts/data-and-privacy",title:"How Sherlock stores your data and protects privacy",description:"All Sherlock workspace data stays in your browser using local SQLite storage. No research data is sent to or stored on any Sherlock server."}]},{group:"Features",pages:[{slug:"features/running-investigations",title:"Running AI-powered investigations and analysis in Sherlock",description:"Launch structured AI investigations, configure scope and model, read results in Operation View, follow up on findings, and export artifacts."},{slug:"features/research-board",title:"Research boards for visual investigation in Sherlock",description:"Map investigation findings, entities, signals, and notes on a visual canvas. Place items from the library, run the AI board agent, and present your work."},{slug:"features/chat",title:"Sherlock chat: AI conversations grounded in your workspace",description:"Ask questions grounded in your workspace artifacts and signals. Use @mentions, save responses as artifacts, and launch follow-up investigations from chat."},{slug:"features/timeline",title:"Timeline: chronological research history in Sherlock",description:"Browse and filter a full chronological record of your workspace activity — runs, artifacts, signals, and chat — with saved views and snapshot export."},{slug:"features/network-graph",title:"Network graph: visualize entity relationships in Sherlock",description:"Explore an interactive graph of entities, artifacts, and sources in your workspace — with manual nodes, entity resolution, and investigation handoffs."},{slug:"features/live-monitor",title:"Live Monitor: scan for signals across your research scope",description:"Configure a scan scope, run a batch signal scan for breaking developments, and feed results into investigations or your workspace signal library."},{slug:"features/files",title:"Files: browse and manage all your research workspaces",description:"Browse all your workspaces in a grid, navigate into individual workspaces to view artifacts and items, and take actions like chat handoff and export."}]},{group:"Configuration",pages:[{slug:"configuration/settings",title:"Sherlock settings: API keys, scopes, and data controls",description:"A guide to every configurable area in Sherlock Settings — API keys, provider defaults, scopes, OpenRouter web search, workspace data, and themes."},{slug:"configuration/themes",title:"Customize the Sherlock visual theme and appearance",description:"How to use the Sherlock theme workbench to adjust colors, surfaces, typography, dividers, and border radius — and save named theme configurations."},{slug:"configuration/export-import",title:"Back up, export, and import your Sherlock workspace data",description:"How to export a full workspace backup, restore from a backup file, clear all local data, and seed a self-hosted Sherlock with a demo workspace."}]},{group:"Deployment",pages:[{slug:"deployment/vercel",title:"Deploy Sherlock to Vercel: step-by-step setup guide",description:"Step-by-step guide to deploying Sherlock on Vercel, including env var setup, BYOK hosting configuration, and SPA routing requirements."},{slug:"deployment/byok",title:"BYOK: using your own AI provider key with Sherlock",description:"How Sherlock's bring-your-own-key model works for users and deployers — where keys are stored, which providers are supported, and how to manage them."}]},{group:"Changelog",pages:[{slug:"changelog/2026-08-17",title:"August 17, 2026",description:"Vercel Web Analytics for hosted deployments."},{slug:"changelog/2026-04-21",title:"April 21, 2026",description:"Protocol templates, divider color controls, documentation link, and stability fixes."}]}],w={index:{slug:"index",title:"Get started with Sherlock",description:"Start here for Sherlock setup, first-run guidance, provider keys, and the core workspace concepts.",group:"Get Started",content:`Sherlock is a browser-based AI workspace for investigations, research boards, grounded chat, timeline analysis, network graphs, and live monitoring. You bring your own provider key, and Sherlock keeps workspace data browser-local.

Use this page as the front door for the docs. Start with the quick setup path, then read the concepts that match the work you are doing.

## First steps

<CardGroup cols={3}>
  <Card title="Quickstart" icon="rocket" href="/quickstart">
    Add a provider key, create a workspace, and launch your first investigation run.
  </Card>
  <Card title="Provider setup" icon="key" href="/provider-setup">
    Configure Gemini, OpenAI, Anthropic, or OpenRouter with browser-local keys.
  </Card>
  <Card title="Workspaces" icon="folder" href="/concepts/workspaces">
    Learn how Sherlock organizes artifacts, chat, boards, signals, and source records.
  </Card>
</CardGroup>

## Core docs

<CardGroup cols={2}>
  <Card title="Investigation runs" icon="magnifying-glass" href="/features/running-investigations">
    Launch structured AI analysis with domain scopes, purpose profiles, and model selection.
  </Card>
  <Card title="Research board" icon="chalkboard" href="/features/research-board">
    Build visual investigations with artifacts, notes, entities, and promoted findings.
  </Card>
  <Card title="Workspace chat" icon="message" href="/features/chat">
    Ask follow-up questions grounded in your active workspace and referenced artifacts.
  </Card>
  <Card title="Data and privacy" icon="shield" href="/concepts/data-and-privacy">
    Understand Sherlock's browser-local storage model and export options.
  </Card>
</CardGroup>`},introduction:{slug:"introduction",title:"Sherlock: AI-powered research and investigation tool",description:"Sherlock is a browser-based AI workspace for investigations, research boards, chat, and monitoring — all data stays local in your browser.",group:"Get Started",content:`Sherlock is an AI-powered research and investigation workspace that runs entirely in your browser. You bring your own API key from a supported AI provider, point it at a topic, and Sherlock helps you run structured analysis, build visual research boards, chat with an AI grounded in your findings, track activity over time, and monitor for new signals — with every byte of your data staying in your browser, not on Sherlock's servers.

## How Sherlock works

Sherlock organizes your research into **workspaces**. Each workspace holds the artifacts (investigation reports), chat sessions, board canvases, signals, and source records that belong to a single research project or topic. You can have as many workspaces as you need, and each one persists locally in your browser — no account or server required.

When you launch a run, Sherlock sends your prompt and workspace context directly to the AI provider you've configured — Gemini, OpenRouter, OpenAI, or Anthropic. The response comes back as a structured artifact that you can read, annotate, cite, and build on. Nothing passes through Sherlock's own servers.

## Key capabilities

<CardGroup cols={2}>
  <Card title="Investigation runs" icon="magnifying-glass" href="/features/running-investigations">
    Launch structured AI analysis with domain-specific scopes, purpose profiles, starter prompts, and model selection.
  </Card>
  <Card title="Research board" icon="chalkboard" href="/features/research-board">
    Build visual canvas investigations with tldraw — place artifacts, entities, signals, notes, and links on a shared canvas.
  </Card>
  <Card title="Chat" icon="message" href="/features/chat">
    Chat with an AI grounded in your active workspace, with @mention references to artifacts and streaming responses.
  </Card>
  <Card title="Timeline" icon="timeline" href="/features/timeline">
    Explore a chronological view of your workspace activity — runs, artifacts, signals, and chat sessions — with saved views and snapshot export.
  </Card>
  <Card title="Network graph" icon="diagram-project" href="/features/network-graph">
    Visualize entity relationships with a D3-powered graph, including manual nodes, link weights, and entity resolution.
  </Card>
  <Card title="Live monitor" icon="satellite-dish" href="/features/live-monitor">
    Scan for live signals across your domain scope and feed them directly into new investigation runs.
  </Card>
  <Card title="Files" icon="folder-open" href="/features/files">
    Browse all your workspaces and artifacts in one place, with grid and list views, filtering, and direct export actions.
  </Card>
</CardGroup>

## Bring your own key (BYOK)

Sherlock does not provide AI access on your behalf. To run investigations or use the chat feature, you need at least one API key from a supported provider:

- **Google Gemini** — available from Google AI Studio
- **OpenRouter** — a single key that routes to hundreds of models, including free tiers
- **OpenAI** — GPT-4 and other OpenAI models
- **Anthropic** — Claude models

You add your key once in **Settings → Runtime**, and it stays in your browser. Sherlock never transmits your key to its own servers. For shared or public deployments, every user adds their own key — there are no server-side credentials to manage.

<Note>
  You can browse existing workspaces and artifacts without an API key. A key is only required when you want to run new AI analysis or start a chat session.
</Note>

## Your data stays local

Sherlock stores all workspace data — artifacts, chat history, research boards, signals, and run records — in a browser-local SQLite database backed by IndexedDB. This means:

- No account or login required
- No data leaves your browser unless you explicitly export it
- Clearing your browser storage removes your local data, so export backups when it matters

You can export individual artifacts as HTML, Markdown, or JSON, and export full workspace backups from **Settings → Data** to move your research between devices or share it with others.`},quickstart:{slug:"quickstart",title:"Sherlock quickstart: from setup to first investigation",description:"Add an API key, create a workspace, and launch your first AI investigation — the complete first-run walkthrough for new Sherlock users.",group:"Get Started",content:`This guide walks you through everything you need to go from a fresh Sherlock session to a completed AI investigation run. The whole process takes about five minutes. If you already have an API key from a supported provider (Gemini, OpenRouter, OpenAI, or Anthropic), you can be running your first analysis before the end of this page.

## Before you begin

You need at least one API key from a supported AI provider to run investigations or use the chat feature. If you don't have one yet, read [Configure your AI provider](/provider-setup) for step-by-step instructions on getting a key from each provider. Browsing existing workspaces and artifacts works without a key.

## First-run walkthrough

<Steps>
  <Step title="Open Sherlock">
    Navigate to your Sherlock URL. New visitors land on the \`/welcome\` page, which gives you a brief overview of the workspace.

    Click **Open Workspace** to continue. A modal appears offering two paths:

    - **Enter an API key** — paste your key to unlock investigation runs and chat
    - **Browse without a key** — skip into the Files browser to explore any pre-seeded content

    If a demo workspace was seeded by the deployment, you'll find it waiting in your Files view when you skip or after you authenticate. This gives you real artifacts and research content to explore before running your own analysis.
  </Step>
  <Step title="Add your API key">
    If you didn't enter your key in the welcome modal, open **Settings** from the top navigation and select the **Runtime** tab.

    Under **Access Credentials**, find the field for your provider and paste your API key. The field accepts keys for:

    - Google Gemini
    - OpenRouter
    - OpenAI
    - Anthropic

    Your key is stored locally in your browser and never sent to Sherlock's servers. Click **Save** to apply.

    <Note>
      You can add keys for multiple providers at once. Sherlock lets you choose which provider and model to use each time you launch a run, so having more than one key gives you more flexibility.
    </Note>
  </Step>
  <Step title="Create a workspace">
    Click **Files** in the top navigation to open the workspace browser. This is Sherlock's home surface — it shows all your workspaces and the artifacts inside them.

    Click **New Workspace** to create your first workspace. Give it a name that describes your research project or topic, then confirm. Sherlock creates the workspace and opens it.

    A workspace holds everything related to a single investigation or research area: runs, artifacts, chat sessions, research boards, signals, and source records. You can create as many workspaces as you need.
  </Step>
  <Step title="Launch an investigation run">
    From inside your workspace, click **New Run** (or look for the run launch option in the workspace toolbar). This opens the run setup panel.

    In run setup, configure:

    - **Scope / domain** — choose a domain pack that matches your research area (for example, cybersecurity, finance, or general research)
    - **Purpose** — select an analysis purpose, such as a background investigation, a threat assessment, or a summary report
    - **Model** — pick the provider and model you want to use; the selector shows models available for the keys you've added
    - **Topic / prompt** — describe what you want to investigate

    When you're ready, click **Launch**. Sherlock sends your prompt to the AI provider and streams the response back as a structured artifact. You can watch it build in real time and stop the run at any point.

    <Tip>
      Start with a focused, specific topic for your first run. Broad questions produce longer outputs; a tighter scope tends to give you more actionable findings to work with.
    </Tip>
  </Step>
  <Step title="Review your artifact">
    When the run finishes, Sherlock opens the resulting artifact in **Operation View** — a document-first reading surface that shows key findings near the top, with inline evidence, typed sections, and an inspector panel on the side.

    From here you can:

    - Read through the structured findings and evidence records
    - Open **Chat** to ask follow-up questions grounded in the artifact
    - Add content to your **Research Board** for visual analysis
    - Launch follow-up runs to dig deeper into specific threads
  </Step>
</Steps>

## What's next

<CardGroup cols={3}>
  <Card title="Investigation runs" icon="magnifying-glass" href="/features/running-investigations">
    Learn about domain scopes, purpose profiles, generation modes, and guided run building.
  </Card>
  <Card title="Research board" icon="chalkboard" href="/features/research-board">
    Build a visual canvas with your artifacts, entities, and signals using the tldraw-powered board.
  </Card>
  <Card title="Workspaces" icon="folder" href="/concepts/workspaces">
    Understand how workspaces organize your research and how to export and import your data.
  </Card>
</CardGroup>`},"provider-setup":{slug:"provider-setup",title:"Connect an AI provider to Sherlock with an API key",description:"Add API keys for Gemini, OpenRouter, OpenAI, or Anthropic in Settings → Runtime to unlock AI investigation runs and workspace chat.",group:"Get Started",content:`Sherlock is a bring-your-own-key (BYOK) application. It connects directly from your browser to the AI provider of your choice — no Sherlock-managed credentials, no server-side proxying. To run investigations or use the chat feature, you need at least one API key from a supported provider. This page covers how to get a key from each provider and how to add it to Sherlock.

## Adding a key in the UI

Open **Settings** from the top navigation bar, then select the **Runtime** tab. Scroll to the **Access Credentials** section. You'll see a field for each supported provider: Google Gemini, OpenRouter, OpenAI, and Anthropic.

Paste your key into the appropriate field and click **Save**. Sherlock stores the key locally in your browser — it is never transmitted to Sherlock's own servers. The field shows a key count when credentials are configured, so you can confirm your key was saved at a glance.

<Note>
  Keys are stored only in your browser's local storage. This means they don't roam between devices or browsers. If you switch browsers or clear your storage, you'll need to re-enter your key. For shared or public deployments, each user adds their own key — there are no server-side credentials to configure.
</Note>

## Supported providers

<Tabs>
  <Tab title="Gemini">
    Google Gemini is the recommended starting point for most users. It's free to get started via Google AI Studio, and Gemini models are well-suited for structured research and investigation tasks.

    **Get a Gemini API key:**

    1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
    2. Sign in with your Google account.
    3. Click **Create API key** and copy the key that appears.

    **Add it to Sherlock:**

    1. Open **Settings → Runtime → Access Credentials**.
    2. Paste your key into the **Google Gemini API Key** field.
    3. Click **Save**.

    <Tip>
      Gemini offers a generous free tier through AI Studio that covers typical research workloads. Check the AI Studio quota page if you're running frequent or large investigation runs.
    </Tip>
  </Tab>
  <Tab title="OpenRouter">
    OpenRouter routes requests to hundreds of models from many providers through a single API key. It's a good choice if you want flexibility to switch models without managing multiple keys, or if you want access to free-tier models.

    **Get an OpenRouter API key:**

    1. Go to [openrouter.ai](https://openrouter.ai) and create an account.
    2. Navigate to **Keys** in your account settings.
    3. Click **Create key**, give it a name, and copy the key.

    **Add it to Sherlock:**

    1. Open **Settings → Runtime → Access Credentials**.
    2. Paste your key into the **OpenRouter API Key** field.
    3. Click **Save**.

    <Tip>
      After adding an OpenRouter key, use the **Browse** button in the model selector to search and filter the full OpenRouter model catalog. Sherlock maintains a local snapshot of available models and can refresh it on demand. OpenRouter also supports server-side web search via the \`openrouter:web_search\` route — you can configure search engine, result limits, and domain filters in **Settings → Runtime**.
    </Tip>
  </Tab>
  <Tab title="OpenAI">
    OpenAI provides GPT-4 and other models through the OpenAI API. Use this option if you have an existing OpenAI account or prefer GPT-series models for your research.

    **Get an OpenAI API key:**

    1. Go to [platform.openai.com](https://platform.openai.com) and sign in or create an account.
    2. Navigate to **API keys** in your account settings.
    3. Click **Create new secret key**, give it a name, and copy the key immediately — it won't be shown again.

    **Add it to Sherlock:**

    1. Open **Settings → Runtime → Access Credentials**.
    2. Paste your key into the **OpenAI API Key** field.
    3. Click **Save**.

    <Warning>
      OpenAI API keys are shown only once at creation. If you lose the key before saving it, you'll need to generate a new one.
    </Warning>
  </Tab>
  <Tab title="Anthropic">
    Anthropic provides Claude models through the Anthropic API. Claude is well-suited to long-context research tasks and nuanced analytical writing.

    **Get an Anthropic API key:**

    1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in or create an account.
    2. Navigate to **API Keys** in the console.
    3. Click **Create Key**, give it a name, and copy the key.

    **Add it to Sherlock:**

    1. Open **Settings → Runtime → Access Credentials**.
    2. Paste your key into the **Anthropic API Key** field.
    3. Click **Save**.
  </Tab>
</Tabs>

## Choosing a model

After you add a key, the model selector in run setup and in **Settings → Runtime → Runtime Profile** shows the models available for that provider. You can switch providers and models each time you launch a run — your saved default is a starting point, not a lock-in.

For OpenRouter, click **Browse** in the model selector to open a searchable catalog with filter options. Sherlock includes a curated list of quick picks alongside the full catalog, and you can also enter a model slug manually if you know the exact identifier.

## Self-hosted configuration via environment variables

If you're self-hosting Sherlock and want to pre-configure a key for local development, you can set provider keys as environment variables instead of entering them in the UI. This is intended for local development setups only — do not use this approach for a public or shared deployment.

Copy \`.env.example\` to \`.env.local\` in the repo root and set the variables you need:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Then edit \`.env.local\`:

\`\`\`bash
# Google Gemini
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Anthropic
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
\`\`\`

Restart the dev server after editing \`.env.local\`. The keys will be baked into the client build and available without manual entry in the Settings UI.

<Warning>
  Environment variable keys are embedded in the built client bundle. For any public or shared deployment — including Vercel — leave provider env vars unset and have each user enter their own key in **Settings → Runtime**. Setting a shared provider key in a public deployment exposes that key to anyone who inspects the bundle.
</Warning>`},"concepts/workspaces":{slug:"concepts/workspaces",title:"Workspaces: organize and manage your research projects",description:"A workspace is Sherlock's top-level container for research on a topic, grouping artifacts, chat history, research boards, timelines, and signals.",group:"Core Concepts",content:`A workspace is the primary organizing unit in Sherlock. Every investigation, research project, or monitoring effort lives inside one. When you start working on a new topic — a company, a policy question, a threat actor, a geopolitical event — you create a workspace to hold everything related to it: the AI-generated reports, your chat sessions, the research boards you sketch ideas on, timeline events, live signals, and any notes, links, or files you collect along the way.

## What a workspace contains

Each workspace acts as a self-contained context for your research. Inside it you'll find:

<CardGroup cols={2}>
  <Card title="Artifacts" icon="file-lines">
    Structured investigation reports generated by AI runs, plus saved timeline snapshots. Each artifact has sections, key findings, evidence records, entities, and follow-ups.
  </Card>
  <Card title="Runs" icon="play">
    The AI analysis sessions that produced your artifacts. Runs record the topic, scope, model, and configuration used so you can trace how a report was generated.
  </Card>
  <Card title="Chat history" icon="messages">
    Workspace-grounded conversations with the AI. Chat sessions are scoped to the workspace so the AI has context about your research when you ask follow-up questions.
  </Card>
  <Card title="Research boards" icon="chalkboard">
    Multi-page canvas boards built on tldraw. You can place artifacts, entities, signals, notes, links, files, and promoted chat excerpts on a board to map out connections and build presentations.
  </Card>
  <Card title="Timeline" icon="calendar-days">
    A chronological view across runs, artifacts, signals, item events, and chat actions. You can save named timeline views and take snapshots as artifacts.
  </Card>
  <Card title="Signals" icon="signal">
    Live monitor results and saved feed items scoped to the workspace. Signals can trigger new investigation runs or be promoted onto research boards.
  </Card>
  <Card title="Canonical items" icon="inbox">
    Notes, links, files, media, and excerpts promoted from chat that belong to the workspace library. Items appear in Files and can be placed on research boards.
  </Card>
  <Card title="Network graph" icon="diagram-project">
    A D3 relationship graph of entities, concepts, and sources associated with the workspace, with support for manual nodes and links.
  </Card>
</CardGroup>

## Workspace identity

Every workspace has a **display title** — the name you see in the header and workspace grid. It keeps the top-level interface clean and human-readable.

Separately, Sherlock stores **launch metadata** that carries the investigative context used when the workspace was created — the primary topic, the investigative angle, and a note about which sources were prioritized. This context is used in run prompts, exports, and the workspace-home summary.

This separation means your workspace can have a short, readable title (e.g., "Apex Corp Due Diligence") while the underlying prompt context retains more precise structured detail.

Workspaces also support an optional **icon** to help you visually distinguish them in the workspace grid.

## Browsing and navigating workspaces

The **Files** surface is your workspace home base. It opens to a grid of all your workspaces, where you can:

- Create a new workspace
- Open an existing workspace
- Browse artifacts and canonical items across workspaces
- Delete or export individual workspaces

Selecting a workspace takes you to the **workspace home**, a lightweight overview showing:

<Steps>
  <Step title="Summary counts">
    At-a-glance totals for artifacts, runs, chat sessions, signals, and canonical items in the workspace.
  </Step>
  <Step title="Recent activity">
    A feed of recent artifacts, runs, and chat sessions so you can pick up where you left off.
  </Step>
  <Step title="Saved timeline views">
    Named timeline snapshots you've saved from the Timeline surface, accessible directly from the workspace home.
  </Step>
  <Step title="Quick links">
    One-click navigation into Artifact view, Chat, Research Board, Timeline, Network Graph, and Files for that workspace.
  </Step>
</Steps>

## Workspace isolation

Each workspace maintains its own isolated context across three surfaces:

- **Chat grounding** — when you open a chat inside a workspace, the AI draws on that workspace's artifacts, signals, and items for context. A question asked in one workspace does not pull data from another.
- **Board canvases** — boards and their contents are scoped to the workspace. Canonical items placed on a board belong to that workspace's library.
- **Timeline** — the workspace timeline only shows events originating in that workspace.

This isolation means you can run parallel investigations on related topics in separate workspaces without their data bleeding together.

## Using the omnibox to jump between workspaces

The shared header omnibox gives you fast access to your workspaces, saved timeline views, artifacts, items, chats, runs, and signals from anywhere in the app. Recent destinations are stored durably so your most-used workspaces are always a keystroke away.

<Note>
  Workspace data is stored locally in your browser using IndexedDB. Clearing your browser's site data or storage for the Sherlock origin will permanently delete all your workspaces and their contents. Use **Settings → Data → Export** to save a backup before clearing browser storage or switching devices.
</Note>`},"concepts/artifacts":{slug:"concepts/artifacts",title:"Artifacts: structured AI investigation reports in Sherlock",description:"Artifacts are the structured reports Sherlock produces from an AI run, containing key findings, evidence records, entities, sources, and follow-ups.",group:"Core Concepts",content:`An artifact is what Sherlock produces when an AI investigation run completes. It is not a raw transcript — it is a structured document organized into typed sections, with key findings surfaced prominently, evidence records attached to specific claims, entities extracted from the content, and follow-up actions ready to act on. Artifacts are the primary output of your research workflow: you read them in the document viewer, edit sections directly, share them via export, and use them as the foundation for follow-up runs and research board composition.

## Artifact types

Sherlock produces several types of artifacts depending on the run configuration and purpose:

<AccordionGroup>
  <Accordion title="Report">
    The standard long-form investigation output. A report includes an executive summary, key findings, methodology, implications, anomalies, evidence, entities, sources, and follow-ups. This is the default type for most investigation and due-diligence runs.
  </Accordion>
  <Accordion title="Synthesis">
    A cross-source synthesis that draws connections across multiple inputs or prior runs. Useful when you want the AI to reconcile evidence from different angles rather than investigate from scratch.
  </Accordion>
  <Accordion title="Brief">
    A shorter, more focused output suited to quick-turnaround summaries or status updates on a topic.
  </Accordion>
  <Accordion title="Digest">
    A structured digest format, typically used for monitoring and signal synthesis — condensing recent developments into a scannable format.
  </Accordion>
  <Accordion title="Comparison">
    A side-by-side comparative analysis of two or more subjects (companies, policies, technologies, etc.).
  </Accordion>
  <Accordion title="Timeline">
    A saved snapshot of the workspace timeline. Timeline artifacts use the same persistence path as reports and appear alongside other artifacts in the workspace.
  </Accordion>
  <Accordion title="Monitor Snapshot">
    A point-in-time capture of live monitoring results, saved as a structured artifact for later review.
  </Accordion>
</AccordionGroup>

## Inside a report artifact

### Key findings

Key findings are the most important conclusions Sherlock extracted from the investigation. They appear near the top of the document in the artifact viewer — before the full body sections — so you can grasp the core takeaways without reading the entire report. Each finding has a title, a summary, and optional support references linking it to evidence or sections elsewhere in the document.

### Typed sections

The report body is organized into typed sections. The sections present in any given artifact depend on the scope, purpose, and generation mode used for the run. Common section types include:

| Section | What it contains |
|---|---|
| Executive Summary | A high-level overview of the investigation and its conclusions |
| Key Findings | A structured rendering of the canonical findings records |
| Methodology | How the AI approached the investigation and what sources it drew on |
| Implications | Analysis of what the findings mean in context |
| Anomalies | Unusual patterns, inconsistencies, or red flags surfaced during analysis |
| Evidence | Organized citations and source references |
| Timeline | A chronological narrative of events relevant to the investigation |
| Next Steps | Recommendations for follow-on research or action |

### Evidence records

Evidence records are first-class citations attached to specific claims in the report. Each record can include:

- A title and summary of the evidence
- A direct quote from the source
- A link to the source URL and source title
- A classification of the evidence kind (source, quote, finding, data point, timeline event, method)

Evidence records are indexed into the workspace search context, which means chat sessions grounded in this workspace can surface evidence-level snippets when you ask follow-up questions.

### Entities

Entities are the people, organizations, and concepts extracted from the artifact. Sherlock tags each entity with a type (person, organization, or unknown) and an optional role and sentiment. Entities extracted from artifacts feed into the workspace network graph, where you can visualize relationships, manually add nodes and links, and hand off to research boards.

### Follow-ups

Follow-ups are actionable next steps generated from the investigation output — or promoted by you from chat. Each follow-up has:

- A kind: question, task, hypothesis, gap, or next step
- A title and action text describing what to do
- A status: open, in progress, resolved, or dismissed
- Optional links to entities, sources, and the artifact or signal that originated it

Follow-ups can seed new investigation runs, maintaining a lineage chain from signal through run through artifact through follow-up through the next run.

## Reading artifacts in Operation View

When you open an artifact, you enter the **Operation View** — Sherlock's document-first reading surface.

<Steps>
  <Step title="Document reader">
    The main panel renders the artifact as a structured document, with key findings displayed near the top, followed by the typed sections in purpose-ordered sequence. Evidence jump cues inline with the text let you navigate directly to the supporting evidence records.
  </Step>
  <Step title="Inspector panel">
    The right-hand inspector panel gives you focused access to findings, entities, and follow-ups without leaving the document view. You can promote follow-ups, jump to entity detail, and review the run configuration that produced this artifact.
  </Step>
  <Step title="Section-level editing">
    You can edit the executive summary and other substantive sections directly in the document. Click into a section to enter edit mode. Changes persist back to the artifact record in your local database.
  </Step>
  <Step title="Route-backed focus">
    Deep links into specific sections and evidence records are supported via URL routing, so you can share a link that opens the artifact scrolled to the exact section or evidence item you're referencing.
  </Step>
</Steps>

<Note>
  You can edit the executive summary and substantive sections directly in Operation View. Key findings and evidence records have their own structured edit flows accessible from the inspector panel.
</Note>

## Exporting artifacts

Sherlock supports three export formats for artifacts:

<Tabs>
  <Tab title="HTML">
    A self-contained HTML file suitable for sharing or archiving. Renders the artifact with its full structure and styling, readable in any browser without Sherlock installed.
  </Tab>
  <Tab title="Markdown">
    A plain-text Markdown export of the artifact content. Useful for pasting into other tools, version control, or note-taking apps that support Markdown rendering.
  </Tab>
  <Tab title="JSON">
    A structured JSON export of the full artifact record, including sections, key findings, evidence, entities, sources, and follow-ups. Use this format when you want to import data into another system or inspect the raw structure.
  </Tab>
</Tabs>

You can also include artifacts in a full workspace-data backup from **Settings → Data**, which packages workspaces, artifacts, runs, chat history, boards, and more into a single restorable JSON snapshot.`},"concepts/scopes-and-domains":{slug:"concepts/scopes-and-domains",title:"Investigation scopes and domain packs for Sherlock runs",description:"Scopes are domain configurations that shape how Sherlock runs investigations, setting context, personas, and suggested sources for your research.",group:"Core Concepts",content:`When you launch an AI investigation in Sherlock, you're not just handing the AI a question — you're configuring the entire investigative frame. Scopes are how you do that. A scope is a domain configuration that tells Sherlock what kind of investigation you're running, what sources are most relevant, what output sections make sense, what persona the AI should adopt, and how to interpret and present findings. Choosing the right scope is one of the most effective ways to get sharper, more targeted investigation output.

## How scopes shape a run

When you select a scope during run setup, it influences the investigation in several ways:

- **Domain context** — background knowledge about the domain that is passed into the AI prompt to orient it toward the right frameworks and terminology
- **Investigation objective** — a default framing for what the run should accomplish, adapted to the domain
- **Suggested sources** — a curated list of domain-relevant sources (databases, publications, agencies) surfaced as chips during run setup
- **Categories** — the feed and discovery categories that are active for the workspace, matching the domain
- **Personas** — a set of role-based personas (journalist, analyst, researcher, etc.) that tune the AI's voice, depth, and focus
- **Starter prompts** — example prompts shown during run setup to help you get started in the domain
- **Output sections** — the set of artifact sections generated by default (e.g., a government-fraud run surfaces anomalies prominently; a scientific-research run includes a literature review)
- **Label profile** — domain-appropriate labels for workspaces, artifacts, signals, and follow-ups throughout the UI

## Built-in scopes

Sherlock ships with nine built-in scopes covering the most common investigation domains:

<AccordionGroup>
  <Accordion title="Government Fraud">
    Investigates federal spending, procurement irregularities, lobbying activity, and public corruption. Suggested sources include USASpending, SAM.gov, FEC, FPDS, GAO, IGNET, FOIA.gov, OpenSecrets, ProPublica, and PACER. Best for journalists, watchdogs, and researchers tracking public-sector financial flows.
  </Accordion>
  <Accordion title="Corporate Due Diligence">
    Covers SEC filings, corporate records, litigation history, ownership structures, and financial reporting. Suggested sources include SEC EDGAR, OpenCorporates, Crunchbase, CourtListener, Bloomberg, Reuters, and the Financial Times. Suited for investment analysis, M&A research, and vendor vetting.
  </Accordion>
  <Accordion title="Geopolitical Analysis">
    Examines foreign policy developments, international relations, armed conflict, and diplomatic activity. Suggested sources include the U.S. State Department, United Nations, CSIS, CFR, Brookings, the Atlantic Council, RAND, Bellingcat, SIPRI, and Foreign Affairs. Designed for analysts, policy researchers, and intelligence practitioners.
  </Accordion>
  <Accordion title="Cybersecurity Research">
    Investigates vulnerabilities, threat actors, indicators of compromise (IOCs), and threat intelligence. Suggested sources include NVD, CVE, MITRE ATT&CK, CISA US-CERT, VirusTotal, Mandiant, CrowdStrike Blog, and KrebsOnSecurity. Built for security researchers, incident responders, and threat-intel analysts.
  </Accordion>
  <Accordion title="Competitive Intelligence">
    Covers market analysis, product comparison, patent landscapes, and competitive positioning. Suggested sources include Crunchbase, PitchBook, CB Insights, Google Patents, USPTO, PatentsView, Gartner, G2, TechCrunch, and Wired. Useful for product teams, strategy groups, and business analysts.
  </Accordion>
  <Accordion title="Scientific Research">
    Synthesizes academic papers, clinical studies, and research findings across scientific domains. Suggested sources include Google Scholar, PubMed, arXiv, Semantic Scholar, Nature, Science, Cell Press, PLOS, NIH, WHO, and CDC. Ideal for researchers, science journalists, and policy analysts working with technical literature.
  </Accordion>
  <Accordion title="AI & Technology Landscape">
    Tracks AI model developments, research lab activity, and industry trends across the technology sector. Suggested sources include OpenAI, Anthropic, Google DeepMind, Meta AI, arXiv, Hugging Face, Papers with Code, The Information, TechCrunch, and Semafor. Best for technology analysts, AI researchers, and venture investors.
  </Accordion>
  <Accordion title="Policy & Regulation">
    Covers legislation, regulatory actions, compliance developments, and policy analysis across jurisdictions. Suggested sources include the Federal Register, Congress.gov, EUR-Lex, FTC, SEC, CISA, Brookings, CSIS, and Lawfare. Suited for policy analysts, compliance teams, legal researchers, and government affairs practitioners.
  </Accordion>
  <Accordion title="Open Investigation">
    An unconstrained scope with no fixed source list and no domain-specific framing applied to the prompt. Use this when your topic doesn't fit a specific domain, when you want the AI to range freely across source types, or when you're in early exploratory research and haven't yet narrowed the focus.
  </Accordion>
</AccordionGroup>

## Personas

Each scope ships with a set of personas — role-based configurations that adjust the AI's voice, analytical lens, and depth of focus. A persona shapes how the AI frames its output: a journalist persona emphasizes newsworthy angles and public-interest framing; an analyst persona emphasizes structured assessment and confidence calibration; a researcher persona emphasizes methodological rigor and literature grounding.

You select a persona during run setup. The selected persona is stored with the run record and reflected in the artifact's provenance metadata, so you can always see which persona produced a given report.

## Custom scopes

If none of the built-in scopes fits your use case, you can create your own. Go to **Settings → Scopes** to define a custom scope with your own domain context, investigation objective, suggested sources, categories, and personas. Custom scopes are stored locally alongside the built-ins and are available in run setup immediately after you save them.

<Steps>
  <Step title="Open Settings">
    Navigate to **Settings → Scopes** from the app navigation.
  </Step>
  <Step title="Create a new scope">
    Click **New Scope** and fill in the name, description, domain context, investigation objective, and any suggested sources or categories relevant to your domain.
  </Step>
  <Step title="Add personas (optional)">
    Define one or more personas to tune the AI's voice for your domain. Each persona needs an ID, a label, and an instruction that describes the role and analytical style.
  </Step>
  <Step title="Save and use">
    Save the scope. It will appear alongside the built-in scopes the next time you set up a run.
  </Step>
</Steps>

<Tip>
  If you're not sure which scope to use, start with **Open Investigation**. It imposes no domain constraints, so you can explore freely. Once you have a clearer sense of what the investigation requires, switch to the matching domain scope for a more targeted follow-up run — the domain context and source suggestions will sharpen the output considerably.
</Tip>`},"concepts/data-and-privacy":{slug:"concepts/data-and-privacy",title:"How Sherlock stores your data and protects privacy",description:"All Sherlock workspace data stays in your browser using local SQLite storage. No research data is sent to or stored on any Sherlock server.",group:"Core Concepts",content:`Sherlock is designed around a simple principle: your research data stays on your device. All workspace data, artifacts, chat history, research boards, signals, and timeline views are stored locally in your browser using SQLite backed by IndexedDB. No Sherlock server ever receives or stores your research content. When you run an investigation, the AI request goes to your chosen AI provider (using your own API key), but the resulting artifact is written directly into your local browser database — it never passes through a Sherlock backend.

## Where your data lives

Sherlock uses two browser storage mechanisms:

**SQLite via IndexedDB** stores all structured research data:

- Workspaces
- Artifacts (including sections, evidence, key findings, follow-ups, entities, and sources)
- Runs
- Chat sessions and message history
- Research boards and board documents
- Signals
- Canonical workspace items (notes, links, files, excerpts)
- Templates
- Saved timeline views
- Manual graph nodes and links
- Board agent sessions and action history

**Browser localStorage** stores a small number of non-tabular values that don't belong in the research database:

- API keys for your AI providers (Gemini, OpenRouter, OpenAI, Anthropic)
- Runtime configuration defaults
- Cached OpenRouter model catalog
- Recent model selections
- Omnibox recent destinations

## API key handling

Your API keys are stored in your browser's localStorage, scoped to the current origin (domain). They are never written to the SQLite database, never included in backup exports, and never sent to any Sherlock server. You add them once in **Settings → Runtime**, and they persist in your browser until you remove them or clear site data.

Because keys live in localStorage, they are origin-scoped: keys you add on the production deployment are not accessible from a Vercel preview URL, and vice versa.

## Origin isolation

Every browser origin (domain + port combination) maintains a completely separate data store. This has a few practical implications:

<CardGroup cols={2}>
  <Card title="Production vs. preview">
    Workspaces you create on the production URL are not visible on Vercel preview deployment URLs, and vice versa. Each origin has its own isolated SQLite database.
  </Card>
  <Card title="Local development">
    If you run Sherlock locally (e.g., on \`localhost:3000\`), that data is separate from any hosted deployment. Backing up and restoring is the supported way to move data between origins.
  </Card>
  <Card title="Redeployments">
    Redeploying Sherlock to the same production domain does not clear your local data. The app code updates, but IndexedDB and localStorage on your device are untouched.
  </Card>
  <Card title="Browser profiles">
    Different browser profiles (or different browsers) on the same device each have their own storage. A workspace created in Chrome is not visible in Firefox.
  </Card>
</CardGroup>

## Backing up and restoring your data

Because all data is local, you are responsible for your own backups. Sherlock provides an export and import tool in **Settings → Data**.

### What a backup includes

A full workspace-data backup is a JSON snapshot containing:

- Workspaces (including display title and launch metadata)
- Artifacts, sections, evidence, key findings, follow-ups, entities, and sources
- Runs
- Chat sessions, messages, attachments, and chat actions
- Research boards and board documents
- Board agent sessions and action history
- Signals
- Canonical workspace items (notes, links, files, excerpts)
- Manual graph nodes and links
- Templates
- Timeline snapshots (stored as artifacts with type \`TIMELINE\`)

### What a backup does not include

The following are intentionally excluded from backups:

- **API keys** — these are device-local by design; you re-enter them on each device or browser profile
- **Visual theme preferences** — theme templates and light/dark mode settings stay device-local
- **App preferences** — quiet mode and other browser-local settings are not exported

### Restoring a backup

Importing a backup from **Settings → Data** replaces your current workspace data domain entirely. The import runs inside a single database transaction, so a failed import does not leave your data in a partial state — either the full restore succeeds, or your existing data remains intact.

<Steps>
  <Step title="Export a backup">
    Go to **Settings → Data** and click **Export**. Sherlock downloads a JSON file containing all your workspace data.
  </Step>
  <Step title="Store the file safely">
    Keep the backup file in a location you control — a local folder, cloud storage, or version control. Sherlock has no cloud backup mechanism.
  </Step>
  <Step title="Import on another device or origin">
    On the target device, go to **Settings → Data** and click **Import**. Select your backup file. Sherlock will clear the current workspace domain and restore from the backup.
  </Step>
</Steps>

## Multi-device usage

Sherlock does not currently support automatic synchronization across devices. Each device has its own independent local database. To move your research from one device to another:

1. Export a backup on the source device (**Settings → Data → Export**)
2. Transfer the JSON file to the target device
3. Import it on the target device (**Settings → Data → Import**)

After importing, both devices will have the same data as of the export timestamp. Any changes made on either device after that point will not be reflected on the other.

## Vercel Web Analytics on hosted deployments

Sherlock's default build includes the Vercel Web Analytics component. On deployments hosted at Vercel with analytics turned on in the project dashboard, Vercel receives pageview and route-change events (route path, referrer, approximate country, device type). It does **not** receive workspace names, artifact contents, chat messages, board contents, API keys, or anything else from your local SQLite or localStorage. See [Vercel Web Analytics](/deployment/vercel#vercel-web-analytics) for how to enable, verify, or remove the integration.

<Warning>
  Clearing your browser's site data for the Sherlock origin will permanently delete your local SQLite database and all your workspaces, artifacts, chat history, and research boards. This cannot be undone. Always export a backup from **Settings → Data** before clearing browser storage, switching to a new device, or changing the origin you use for Sherlock.
</Warning>`},"features/running-investigations":{slug:"features/running-investigations",title:"Running AI-powered investigations and analysis in Sherlock",description:"Launch structured AI investigations, configure scope and model, read results in Operation View, follow up on findings, and export artifacts.",group:"Features",content:`Sherlock investigations are the core unit of work in the product. When you launch a run, Sherlock sends a structured prompt to your chosen AI provider, receives a typed report back, and saves it as an artifact in your workspace. You can read the results in Operation View, edit sections directly, follow up on suggested leads, and export the finished artifact in multiple formats. Every run is scoped to a domain pack and purpose profile so the AI output stays relevant to your investigation context.

## Before you begin

You need at least one provider API key configured before you can launch a run. Add keys in **Settings → Runtime**.

<CardGroup cols={2}>
  <Card title="Supported providers" icon="cpu">
    Gemini, OpenRouter, OpenAI, Anthropic
  </Card>
  <Card title="Configure keys" icon="key">
    Settings → Runtime → provider key fields
  </Card>
</CardGroup>

## Core workflow

<Steps>
  <Step title="Open a workspace">
    Navigate to any workspace from the Files overview or the omnibox. You can also launch a run from Operation View, the Live Monitor, the Network Graph, or a chat follow-up.
  </Step>
  <Step title="Click New Run">
    Use the **New Run** button in the workspace toolbar or header. The Run Setup modal opens.
  </Step>
  <Step title="Configure run setup">
    Work through the six-step setup wizard to define your investigation. See the [Run setup reference](#run-setup-reference) below for details on each step.
  </Step>
  <Step title="Launch the run">
    Click **Launch** (or the purpose-specific label, such as "Investigate" or "Analyze") on the final step. Sherlock creates a workspace run, routes it to your provider, and streams the result.
  </Step>
  <Step title="Read results in Operation View">
    Once generation completes, the artifact opens in Operation View. Read the key findings block at the top, then work through the typed sections below. Use the inspector panel on the right for entities, follow-ups, and provenance detail.
  </Step>
</Steps>

## Run setup reference

The Run Setup modal walks you through six steps. You can navigate back to any completed step to revise your choices before launching.

<AccordionGroup>
  <Accordion title="Step 1 — Scope and purpose">
    Choose a **domain pack** (scope) that matches your investigation context. Built-in scopes include:

    - Government fraud
    - Corporate due diligence
    - Geopolitical analysis
    - Cybersecurity research
    - Competitive intelligence
    - Scientific research
    - AI and technology landscape
    - Policy and regulation
    - Open investigation (default)

    After selecting a scope, choose a **purpose profile** — the type of output you want (for example, a full investigation report, a summary brief, or a deep dive). Available purposes are filtered to what makes sense for your chosen scope.

    Set a **date range** to bound the investigation's temporal context. Sherlock pre-fills a default range from the scope, which you can adjust.
  </Accordion>
  <Accordion title="Step 2 — Topic and starter prompt">
    Enter your main investigation topic. This is the primary prompt that drives the AI's research focus.

    Below the topic field, Sherlock surfaces **pack starters** — pre-built prompt templates tuned for your selected scope and purpose. Click a starter to populate the topic field with its prompt, then edit as needed.

    If you have **saved templates** from previous runs, they appear here as well. Apply a template to restore a full run configuration with a single click.
  </Accordion>
  <Accordion title="Step 3 — Investigation angle (optional)">
    Provide a secondary framing angle or hypothesis. Use this to direct the AI toward a specific aspect of the topic — for example, "focus on financial relationships" or "prioritize timeline reconstruction." Leave blank to let the scope's default framing apply.
  </Accordion>
  <Accordion title="Step 4 — Seed entities (optional)">
    Add named entities — people, organizations, concepts, or sources — to pre-seed the investigation. Sherlock passes these to the AI as known anchor points, which can improve entity coherence in the output and in the resulting network graph.
  </Accordion>
  <Accordion title="Step 5 — Priority sources (optional)">
    List source names, domains, or source categories you want the AI to prioritize. Your selected scope surfaces suggested source libraries; click any suggested source to append it to the field.
  </Accordion>
  <Accordion title="Step 6 — Model, persona, and generation settings">
    Select your **AI provider** and **model**. The selector shows all models available for the chosen provider, including recent selections and, for OpenRouter, a full live catalog.

    Choose an **agent persona** tailored for your scope. Personas inject role-specific instruction into the prompt, shaping the tone and analytical frame of the output.

    Adjust **generation mode**, **search depth**, and **thinking budget** for this run. See [Generation modes](#generation-modes), [Search depth](#search-depth), and [Thinking budget](#thinking-budget) below for details on each.

    Optionally check **Save as template** and enter a name to save this full configuration for reuse.
  </Accordion>
</AccordionGroup>

## Generation modes

Sherlock supports two generation modes. You can set a global default in **Settings → Runtime** and override it per run in step 6 of the setup.

<Tabs>
  <Tab title="Single pass">
    Sherlock sends one request to the AI and receives a complete artifact in a single response. This is the faster option and works well for focused investigations with a clear scope.
  </Tab>
  <Tab title="Staged">
    Sherlock breaks the investigation into multiple steps, sending each step to the AI in sequence and building up the artifact progressively. This mode is suited to complex investigations where each phase of analysis informs the next.
  </Tab>
</Tabs>

## Search depth

Search depth controls how broadly and rigorously the AI investigates your topic. Choose between two levels in step 6 of the run setup or in **Settings → Runtime**:

<Tabs>
  <Tab title="Standard">
    The default level. Sherlock sends a focused prompt that balances breadth and speed. Suitable for most investigations where you have a clear topic and scope.
  </Tab>
  <Tab title="Deep">
    Sherlock increases the breadth of synthesis, investigative rigor, and evidence gathering. Use this for complex topics where you want the AI to explore more angles, cross-reference more sources, and produce more detailed evidence records. Deep runs take longer and consume more tokens.
  </Tab>
</Tabs>

## Thinking budget

Some AI models support **extended reasoning** — an internal thinking step where the model plans its analysis before generating output. When you select a model that supports this capability, a **Thinking Budget** slider appears in step 6 of the run setup.

- The slider ranges from **0** to **8,192** tokens in increments of 512.
- A higher budget gives the model more room to reason before writing, which can improve the quality and coherence of complex investigations.
- Set the budget to **0** to disable extended reasoning for that run.
- If the selected model does not support thinking budgets, the control is disabled automatically.

<Tip>
  Thinking budget is most useful for longer, multi-faceted investigations where you want the AI to plan its structure and cross-reference findings before committing to output. For quick, focused runs, the default value is usually sufficient.
</Tip>

## OpenRouter and web search

<Tip>
  OpenRouter gives you access to hundreds of models from multiple labs — including free-tier options — through a single API key. It is a good starting point if you want to experiment with different models before committing to a direct provider subscription.
</Tip>

When you select OpenRouter as your provider, Sherlock can enable **server-side web search** via \`openrouter:web_search\`. Configure the following in **Settings → Runtime**:

- **Search engine** — the engine used for web retrieval
- **Result limit** — how many search results the AI receives per query
- **Domain filters** — restrict or exclude specific domains from web results

Web search adds live retrieval context to your investigation and is particularly useful for topics where recency matters. When web search is active, your artifact will include provenance hints indicating which claims were informed by retrieved results.

## Reading results in Operation View

After a run completes, the artifact opens in **Operation View** — a document-first reading surface.

**Document layout:**

- **Key findings** appear near the top of the document body as a dedicated block. Each finding is a discrete, citable claim extracted from the AI's analysis.
- **Typed sections** follow below, rendered in purpose-aware order. Depending on your scope and purpose, sections may include methodology, implications, anomalies, evidence, and timeline.
- **Evidence records** appear inline as jump cues within sections and are accessible in full from the inspector panel.

**Inspector panel (right rail):**

The right inspector panel surfaces:

- Entity mentions extracted from the artifact
- Follow-up actions suggested by the investigation
- Provenance and source metadata
- Board and chat handoff actions for the active artifact or inspected entity

## Editing sections

You can edit artifact content directly in Operation View.

- Click the **edit control** on the executive summary or any substantive content section (such as methodology or implications) to open an inline editor.
- Make your changes and save. The edit is persisted to the artifact.

<Note>
  Editing is available on the executive summary and most typed content sections. Key findings and evidence records are not directly editable but can be annotated through the inspector panel.
</Note>

## Following up on leads

Investigation outputs often include **suggested follow-up actions** — specific leads, related topics, or recommended next steps identified by the AI. These appear in the inspector panel under the Follow-ups section.

To act on a follow-up:

1. Click the follow-up in the inspector panel.
2. Sherlock pre-populates a new run setup with the follow-up topic and inherits relevant context from the parent artifact.
3. Review and adjust the setup, then launch the follow-up run.

The resulting artifact is linked to the parent by lineage, which is reflected in the Timeline chronology.

## Templates

Templates let you save a full run configuration — scope, purpose, model, persona, generation mode, and priority sources — for reuse.

- **Save during setup:** Check **Save as template** on the final step of the run setup and enter a name.
- **Apply during setup:** Saved templates appear in step 2 of the setup wizard; click any template to restore its configuration.
- **Manage templates:** View, rename, and delete templates in **Settings → Scopes**.

## Exporting artifacts

Export any artifact from the artifact viewer toolbar.

<CardGroup cols={3}>
  <Card title="HTML" icon="file-code">
    Self-contained HTML document with all sections and formatting preserved.
  </Card>
  <Card title="Markdown" icon="file-text">
    Plain Markdown suitable for pasting into a wiki, notes app, or version-controlled repo.
  </Card>
  <Card title="JSON" icon="braces">
    Full artifact payload including typed sections, key findings, evidence records, and metadata.
  </Card>
</CardGroup>

<Warning>
  Artifact data is stored in your browser via SQLite over IndexedDB. Use **Settings → Data → Export** to back up your workspace data before clearing browser storage.
</Warning>`},"features/research-board":{slug:"features/research-board",title:"Research boards for visual investigation in Sherlock",description:"Map investigation findings, entities, signals, and notes on a visual canvas. Place items from the library, run the AI board agent, and present your work.",group:"Features",content:`The research board is Sherlock's visual canvas workspace. It gives you a free-form surface — built on tldraw — where you can map out findings, entities, sources, signals, and notes alongside the structured artifacts produced by your investigations. Use the board to see relationships that are hard to spot in a document view, organize leads spatially, build a narrative for a briefing, or hand off context to collaborators. Each workspace supports multiple named boards so you can keep different investigation angles or time periods separated without losing work.

## Getting started

<Steps>
  <Step title="Open your workspace">
    Navigate to any workspace from the Files overview or the omnibox. The workspace home shows counts, recent activity, and direct links into workspace surfaces.
  </Step>
  <Step title="Click Board">
    Open the board from the workspace navigation. The route is \`/workspaces/:workspaceId/board\`. If the workspace has existing boards, Sherlock opens the first one automatically.
  </Step>
  <Step title="Open the Library rail">
    Click the Library icon in the left toolbar to open the Library rail. This panel lists all the items available to place on your board.
  </Step>
  <Step title="Drag an artifact onto the canvas">
    Find an artifact in the Library rail and drag it onto the canvas, or click it to place it at the center. The artifact appears as a card on the board, linked back to the original record.
  </Step>
</Steps>

## Multiple boards per workspace

Each workspace can have as many named boards as you need. Create a new board from the board top bar, then name it for the angle or phase it covers — for example, "Entity map," "Timeline reconstruction," or "Source cross-reference."

Boards are fully independent: items placed on one board do not appear on others. The board selector in the top bar lets you switch between boards without losing your canvas state.

## Library panel

The Library rail (left side) is your source of items to place on the board. It organizes available content into browsable sections:

<CardGroup cols={2}>
  <Card title="Artifacts" icon="file">
    Structured investigation reports from your workspace.
  </Card>
  <Card title="Key findings" icon="search">
    Individual findings extracted from artifacts.
  </Card>
  <Card title="Entities" icon="user">
    People, organizations, and concepts identified across your workspace.
  </Card>
  <Card title="Sources" icon="link">
    Source records and URLs referenced in your investigations.
  </Card>
  <Card title="Signals" icon="bell">
    Saved signals from the Live Monitor or manual saves.
  </Card>
  <Card title="Notes, links, and files" icon="paperclip">
    Workspace-native notes, links, and uploaded files or media.
  </Card>
</CardGroup>

**Promoted chat excerpts** — retrieval snippets you promoted from the Chat surface — also appear in the Library and can be placed on the board like any other item.

## Placing items on the canvas

Drag any item from the Library rail onto the canvas, or click it to place it at the center of the current viewport. Once placed, you can move, resize, group, and annotate items using the standard tldraw canvas tools.

Items placed from the Library retain their link back to the canonical record. That means you can jump from a board card directly back to the original artifact, entity, or signal using the handoff actions on each card.

## Handoff actions from the board

From any placed item on the board, you can jump directly to related workspace surfaces:

- **View artifact** — opens the artifact in Operation View
- **Open in timeline** — focuses the workspace Timeline on the item's chronology
- **Open in network graph** — centers the Network Graph on the related entity or artifact
- **Open in chat** — starts or continues a Chat session grounded in the item

These handoffs make the board a navigation hub, not just a display surface.

## Presentation mode

Switch the board into presentation mode from the top bar to display your canvas in a clean, tool-free view. Use presentation mode for briefings, screenshots, or review sessions where you want to hide the editor chrome.

## Board agent

The board agent is an AI assistant that works directly with your canvas. You give it a goal in plain language, it plans out a set of actions, and you review the plan before anything changes on the board.

<Note>
  The board agent works with your current board state. Give it specific, actionable goals for best results — for example, "group these artifacts by entity," "add a note summarizing the key findings," or "connect the source cards to the artifacts that cite them."
</Note>

### Using the board agent

<Steps>
  <Step title="Open the Agent rail">
    Click the Agent tab in the right inspector panel to open the board agent input.
  </Step>
  <Step title="Enter your request">
    Type a goal in the prompt field. You can also choose from starter intents — pre-built prompts for common board organization tasks.
  </Step>
  <Step title="Review the plan">
    The agent responds with a preview of the actions it intends to take: which items it will move, group, annotate, or create. Review the list before committing.
  </Step>
  <Step title="Approve or adjust">
    Click **Approve** to execute the planned actions, or deselect individual actions from the list to skip them. Click **Cancel** at any time to discard the plan without making changes.
  </Step>
  <Step title="Review action receipts">
    After execution, the agent shows an action receipt listing each action as completed, skipped, or failed. The receipt is saved in the session history so you can audit what changed.
  </Step>
</Steps>

### Auto-approve for low-risk moves

Toggle **Auto-approve** in the agent rail to skip the review step for low-risk organization actions — such as moving or grouping items — while still requiring approval for higher-impact changes like deletions or workspace writes.

<Warning>
  Auto-approve bypasses the approval step for matching actions. Leave it off if you want to review every change before it applies.
</Warning>

### Cancellation

You can cancel a running agent session at any time using the **Cancel** button in the agent rail. Actions already executed before cancellation are not reversed, but the receipt will mark subsequent planned actions as cancelled.

## Manual AI actions

Outside of full agent sessions, you can trigger individual AI actions from the selection or canvas menu:

- **Selection summary** — generate a text summary of the currently selected items
- **Draft board note** — ask the AI to draft an annotation or note for selected content

These one-shot actions do not require an approval step.`},"features/chat":{slug:"features/chat",title:"Sherlock chat: AI conversations grounded in your workspace",description:"Ask questions grounded in your workspace artifacts and signals. Use @mentions, save responses as artifacts, and launch follow-up investigations from chat.",group:"Features",content:`Sherlock's chat surface gives you a conversational interface into your workspace. Every chat session is scoped to the active workspace, which means the AI can reference your existing artifacts, key findings, saved signals, and workspace items directly — rather than answering from general knowledge alone. Use chat to interrogate a specific artifact, ask follow-up questions after an investigation, synthesize findings across multiple reports, or build a new investigation conversationally using guided run mode.

## Starting a chat

Open chat from any workspace at \`/workspaces/:workspaceId/chat\`, or use a chat handoff action from:

- **Operation View** — launches a session grounded in the active artifact or an inspected entity
- **Files** — opens a session with the selected workspace item as context
- **Network Graph** — opens a session focused on an inspected artifact, entity, or signal

When you open chat via a handoff, Sherlock pins the source artifact, entity, or signal as launch context for the session. That context is visible in the context drawer and is passed to the AI in the session primer.

## Typical workflow

<Steps>
  <Step title="Open your workspace">
    Navigate to any workspace from the Files overview or the omnibox.
  </Step>
  <Step title="Click Chat">
    Open the chat surface from the workspace navigation. A new session starts automatically if none exists for the workspace.
  </Step>
  <Step title="Type your question with an @mention">
    In the message composer, type your question. Use \`@\` to mention a specific artifact, key finding, entity, or signal to ground the AI's response in that record's content.
  </Step>
  <Step title="Read the streaming response">
    The AI streams its response into the transcript. You can stop generation at any time using the stop button that appears in the composer during a live turn.
  </Step>
  <Step title="Save useful output">
    When the AI produces something worth keeping, save it — either as a new artifact, appended to an existing one, or promoted to the workspace library as an excerpt.
  </Step>
</Steps>

## @mentions

<Tip>
  Mention a specific artifact by typing \`@\` followed by its name to ground the AI's response directly in that report's content. The AI receives the artifact's executive summary, key findings, and relevant sections as explicit context for the turn.
</Tip>

Type \`@\` in the message composer to open a mention picker. You can mention:

- **Artifacts** — full investigation reports in the workspace
- **Key findings** — individual findings extracted from artifacts
- **Workspace items** — notes, links, files, and promoted excerpts
- **Entities** — people, organizations, and concepts tracked in the workspace
- **Signals** — saved signals from the Live Monitor or manual saves

Mentioned records are resolved and attached to your message as explicit context. They appear as inline tokens in the sent message and can be clicked to reopen the referenced record in its native surface.

## Streaming responses and stop support

The AI streams its response token by token. A stop button appears in the composer toolbar while a response is in progress — click it to halt generation and keep whatever the AI has produced so far. You can then send a follow-up message or edit your question.

## Context drawer

The context drawer (right panel) shows what Sherlock is using to ground the current session:

<AccordionGroup>
  <Accordion title="Recent artifacts">
    The most recently updated artifacts in the workspace, available as quick context for the AI.
  </Accordion>
  <Accordion title="Recent signals">
    Saved signals from the workspace, surfaced as retrieval context.
  </Accordion>
  <Accordion title="Pinned launch context">
    The artifact, entity, or signal that was passed in when the session was opened via a handoff action. This stays pinned for the life of the session.
  </Accordion>
  <Accordion title="Last-turn retrieval snippets">
    The specific workspace passages the AI retrieved and used in its most recent response. These give you visibility into which content shaped the answer.
  </Accordion>
  <Accordion title="Action log">
    A record of chat actions taken in the session — saves, appends, follow-up launches, and promotions — for audit and reference.
  </Accordion>
</AccordionGroup>

## Session management

Each workspace can have multiple named chat sessions. Manage them from the session list in the left rail:

- **Create a new session** — click the new session button to start a fresh conversation
- **Rename a session** — right-click a session or use the session menu to give it a descriptive name
- **Switch between sessions** — click any session in the list to load its full transcript history
- **Delete a session** — remove a session and its transcript permanently from the session menu

<Note>
  Chat history is persisted in your browser alongside workspace data. Use **Settings → Data → Export** to include chat history in a workspace backup.
</Note>

## Actions from chat

After the AI responds, you can act on the output directly from the transcript:

<CardGroup cols={2}>
  <Card title="Save as artifact" icon="file-plus">
    Save the AI's response as a new artifact in the workspace. It appears in Files and Operation View like any other investigation artifact.
  </Card>
  <Card title="Append to artifact" icon="file-plus-2">
    Add the response as a new section in an existing artifact. Choose which artifact to append to from a picker.
  </Card>
  <Card title="Launch follow-up run" icon="play">
    Open the Run Setup modal pre-populated with context from the conversation, then launch a structured investigation run.
  </Card>
  <Card title="Promote excerpt" icon="bookmark">
    Promote a specific retrieval snippet into the canonical workspace library so it appears in the Library rail and board.
  </Card>
  <Card title="Place on board" icon="layout">
    Send a retrieval excerpt or response snippet directly onto the active research board.
  </Card>
  <Card title="Copy transcript" icon="clipboard">
    Copy the full session transcript to the clipboard.
  </Card>
</CardGroup>

## Transcript export

Export the full chat transcript at any time from the session menu:

<Tabs>
  <Tab title="Markdown">
    A formatted Markdown file with speaker labels and message timestamps, suitable for notes apps, wikis, or version-controlled documentation.
  </Tab>
  <Tab title="JSON">
    The raw session payload including message metadata, mention refs, retrieval attachments, and action records — useful for programmatic processing or archiving.
  </Tab>
</Tabs>

## Guided run mode

Guided run mode lets you build an investigation through dialogue instead of filling out the run setup form directly. Start a guided session from the session list; Sherlock walks you through scope, topic, angle, sources, and model selection conversationally, then constructs a run configuration from your answers.

When the configuration is complete, you can review it and launch the run — or switch to the manual Run Setup modal to make final adjustments before launching.

<Tip>
  Guided run mode is particularly useful when you are exploring a new topic and are not yet sure which scope or purpose fits best. The conversational flow helps you narrow down your focus before committing to a full investigation run.
</Tip>`},"features/timeline":{slug:"features/timeline",title:"Timeline: chronological research history in Sherlock",description:"Browse and filter a full chronological record of your workspace activity — runs, artifacts, signals, and chat — with saved views and snapshot export.",group:"Features",content:`The Timeline gives you a complete, filterable chronological record of everything that has happened inside a workspace. Every investigation run, artifact, saved signal, canonical item, and notable chat action appears as a dated event in a single stream — so you can trace the arc of your research, understand how findings emerged, and jump directly back to any moment in your work.

## What appears on the timeline

<AccordionGroup>
  <Accordion title="Runs and artifacts">
    Every investigation run you launch appears when it starts. The artifact it produces appears when it is saved. Lineage chips connect runs to their source signals and the artifacts they produced, so you can see the chain of analysis at a glance.
  </Accordion>
  <Accordion title="Saved signals">
    Signals you save to the workspace — headlines, monitor results, or manual entries — each appear as dated signal events. Clicking one opens the signal detail in the inspector drawer.
  </Accordion>
  <Accordion title="Canonical items">
    Notes, links, files, and promoted chat excerpts that live in your workspace library each get events for their creation, material updates, and reuse across sessions.
  </Accordion>
  <Accordion title="Chat sessions and actions">
    When the Chat track is enabled, chat session starts appear on the timeline, along with high-signal actions such as workspace searches, saved artifact drafts, appended notes, and follow-up launches.
  </Accordion>
  <Accordion title="Entity milestones (opt-in)">
    The Entity track is off by default. Turn it on to see first-seen moments, repeated-mention thresholds, and artifact-backed reappearance milestones for entities derived from your research.
  </Accordion>
  <Accordion title="Board activity">
    Board-related events surface when canvas items from the workspace are created or substantially changed, keeping board work visible alongside your other research activity.
  </Accordion>
</AccordionGroup>

## Navigating to the timeline

The Timeline is scoped to one workspace. Open it from the workspace sidebar or navigate directly to \`/workspaces/:workspaceId/timeline\`. The workspace selector in the toolbar lets you switch between workspaces without leaving the page.

## Filtering and searching

<CardGroup cols={2}>
  <Card title="Keyword search" icon="magnifying-glass">
    Type into the header search bar to filter events by title, summary, badge labels, or search text. The URL updates as you type so filtered views are bookmarkable.
  </Card>
  <Card title="Date range" icon="calendar">
    Use the date-range control to narrow the event stream to a specific window. Choose from preset ranges or enter exact start and end dates.
  </Card>
  <Card title="Track filters" icon="filter">
    Toggle individual tracks — **Runs**, **Artifacts**, **Signals**, **Items**, **Chat**, **Entities** — to show only the event types that matter for your current question.
  </Card>
  <Card title="Lineage focus" icon="diagram-project">
    Click a lineage chip on any run or artifact event to focus the view on all events related to that lineage chain, surfacing the full story of how a result was produced.
  </Card>
</CardGroup>

<Note>
  The timeline's search text, date range, and active track filters are all stored in the URL. You can bookmark or share a specific filtered view and it will open in exactly the same state.
</Note>

## Inspecting events

Click any event row to open it in the **details drawer** on the right. The drawer shows the event's metadata, related records, and direct action buttons:

- **Jump to artifact** — open the artifact in the full Operation View reader
- **Open chat session** — resume the exact chat session that generated the event
- **Place on board** — send the artifact, signal, or entity to the research board
- **Source link** — open the original URL for signal events that carry a source

## Saved views

You can save your current combination of search text, date range, and track filters as a named view.

<Steps>
  <Step title="Set your filters">
    Apply the keyword search, date range, and track toggles you want to preserve.
  </Step>
  <Step title="Save the view">
    Open the **Tools** panel from the toolbar and click **Save View**. Give the view a name.
  </Step>
  <Step title="Reopen from the omnibox">
    Press the omnibox search bar (or use the keyboard shortcut) and type the view name. Saved timeline views appear as dedicated results you can open directly.
  </Step>
</Steps>

## Snapshot export

The timeline's current filtered state can be saved as an artifact for reference or sharing.

From the **Tools** panel, choose **Export Snapshot** to download the current view as JSON or Markdown, or choose **Save as Artifact** to persist a \`TIMELINE\` artifact directly to your workspace. The saved artifact captures the event data visible at that moment — not a live-updating record — so it works as a timestamped checkpoint of your research history.

<Tip>
  Save a snapshot before archiving a completed investigation. The resulting artifact gives you a durable, human-readable record of the full research timeline you can attach to reports or revisit later.
</Tip>

## Typical workflow

<Steps>
  <Step title="Open your workspace">
    Go to **Files**, click your workspace card, then click **Timeline** in the sidebar — or navigate directly to \`/workspaces/:workspaceId/timeline\`.
  </Step>
  <Step title="Filter to the date range you care about">
    Use the date-range control to scope the stream to your investigation window. Enable or disable tracks to reduce noise.
  </Step>
  <Step title="Search for a keyword or topic">
    Type a keyword into the header search bar to narrow events to the thread you want to trace.
  </Step>
  <Step title="Click an event to inspect it">
    Select any event row to open the details drawer. Review metadata, follow lineage chips, and use the action buttons to jump directly to related artifacts or chat sessions.
  </Step>
  <Step title="Save the view for later">
    If this filter combination is useful to revisit, open the Tools panel and save it as a named view. It will appear in the omnibox for quick re-access.
  </Step>
</Steps>`},"features/network-graph":{slug:"features/network-graph",title:"Network graph: visualize entity relationships in Sherlock",description:"Explore an interactive graph of entities, artifacts, and sources in your workspace — with manual nodes, entity resolution, and investigation handoffs.",group:"Features",content:`The Network Graph gives you a visual map of the relationships between entities, artifacts, and sources that have emerged from your research. Every person, organization, and concept extracted from your artifacts appears as a node. Sources that back those artifacts appear as source nodes. You can add your own manual nodes and draw connections between any combination of records — making the graph both an analytical output and an active thinking surface.

## Navigating to the graph

The Network Graph is scoped to one workspace. Open it from the workspace sidebar or navigate directly to \`/workspaces/:workspaceId/network\`. The graph loads with nodes derived from all artifacts in the workspace, plus any manual nodes and links you have added in previous sessions.

## What appears in the graph

<CardGroup cols={2}>
  <Card title="Entity nodes" icon="user">
    People, organizations, and concepts automatically extracted from your artifacts. Each node shows the entity's name, subtype icon, and connections to the artifacts it appeared in.
  </Card>
  <Card title="Source nodes" icon="link">
    Source URLs and references drawn from artifact provenance. Useful for mapping the information landscape behind your research rather than just the entities within it.
  </Card>
  <Card title="Manual nodes" icon="pen-to-square">
    Custom nodes you create yourself — any concept, person, organization, or source — with a label and optional icon override. Manual nodes persist across sessions.
  </Card>
  <Card title="Manual links" icon="arrows-left-right">
    Custom edges you draw between any two nodes in the graph, including between automatic entity nodes and your own manual nodes.
  </Card>
</CardGroup>

## Interacting with the graph

**Click any node** to open the entity inspector panel on the right. The inspector shows:

- All artifacts in which the entity appears
- Saved signals mentioning the entity
- Source references linked to the entity
- Action buttons to launch a new investigation, start a chat session, or place the entity on the research board

**Drag nodes** to rearrange the layout. The graph uses a force-directed D3 layout by default, but you can pull nodes into positions that make structural relationships clearer.

**Zoom and pan** using the viewport controls in the bottom corner, or scroll to zoom and drag the canvas background to pan.

### Flagging and hiding nodes

Right-click any node (or use the node context menu) to flag it for attention or hide it from the current view. Hidden nodes are still in the workspace — use the control bar to toggle hidden nodes back into view when you need them.

## Adding manual nodes and links

<Steps>
  <Step title="Open the add-node overlay">
    Click **Add Node** in the graph control bar to open the node creation overlay.
  </Step>
  <Step title="Choose a node type and label">
    Select **Person**, **Organization**, **Concept**, or **Source**. Enter a label and optionally pick a custom icon from the icon picker.
  </Step>
  <Step title="Confirm to place the node">
    The new node appears in the graph. Drag it into position.
  </Step>
  <Step title="Draw a link">
    Hover over any node to reveal its link handle, then drag from that handle to another node to create a manual connection between them.
  </Step>
</Steps>

## Entity resolution

When the same person or organization appears under multiple names across different artifacts, Sherlock may create separate entity nodes for each variant. Entity resolution lets you merge those duplicates into a single canonical node.

<Tip>
  If the same person appears as both "Jane Smith" and "J. Smith" in your graph, use entity resolution to merge them. Select one node, open the inspector, and choose **Resolve Entity** to select the duplicate to merge into this record. All artifact and signal associations from both nodes transfer to the merged canonical node.
</Tip>

## Launching investigations and chat from the graph

From any node's inspector panel, you can:

- **Launch investigation** — open Run Setup pre-populated with the entity's name and its related artifact context
- **Start chat** — open a workspace chat session grounded in the selected entity's artifact associations
- **Place on board** — send the entity, an associated artifact, or a related signal directly to the research board

## Omnibox entity focus

Search for an entity in the omnibox without navigating away from the graph. When you select an entity result, the graph recenters on that node and opens its inspector panel in place — no route change needed.

## Typical workflow

<Steps>
  <Step title="Open your workspace and go to Network">
    Navigate to the workspace, then click **Network** in the sidebar or go to \`/workspaces/:workspaceId/network\`.
  </Step>
  <Step title="Explore the automatic nodes">
    Scan the graph for clusters and connections that emerged from your artifact analysis. Drag nodes to clarify relationships.
  </Step>
  <Step title="Click an entity node to inspect it">
    Select any node to open the inspector. Review its artifact associations and source links.
  </Step>
  <Step title="Add manual nodes and connections if needed">
    Use **Add Node** to bring in concepts or people not yet captured in your artifacts. Draw manual links to represent relationships you know exist.
  </Step>
  <Step title="Resolve duplicate entities">
    If you see the same person or organization under multiple nodes, use entity resolution to merge them into one canonical record.
  </Step>
  <Step title="Launch a chat or investigation from the inspector">
    From the inspector panel, click **Launch Investigation** or **Start Chat** to continue your research grounded in the selected entity and its related artifacts.
  </Step>
</Steps>`},"features/live-monitor":{slug:"features/live-monitor",title:"Live Monitor: scan for signals across your research scope",description:"Configure a scan scope, run a batch signal scan for breaking developments, and feed results into investigations or your workspace signal library.",group:"Features",content:`Live Monitor is a batch scanning tool that watches your configured domain scope for new signals — breaking news, new publications, threat alerts, or any developments relevant to your research area. Run a scan, review the results as they arrive, and take action on any result: save it as a signal, expand it for detail, or launch a full investigation grounded in it.

<Note>
  Live Monitor requires a configured AI provider key to run scans. Add your key under **Settings → Runtime** before starting. Browsing previously scanned results does not require a key.
</Note>

## Navigating to Live Monitor

Live Monitor is a global surface, not scoped to a single workspace. Navigate to it directly at \`/monitor\`. You can also reach it from the main sidebar.

## How a scan works

When you run a scan, Live Monitor calls your active AI provider with your configured scope, source priorities, and date window. Results arrive progressively — the feed updates as the scan receives data — so you can start reviewing while the scan is still running.

<Steps>
  <Step title="Select a workspace">
    Use the workspace selector in the toolbar to choose which workspace the scan should run against. This sets the research context for the scan and determines where signals are saved.
  </Step>
  <Step title="Configure scope and sources">
    Open **Settings** (gear icon in the toolbar) to configure your monitoring window:
    - **News count** — how many news-type results to request
    - **Social count** — how many social-signal results to request
    - **Official count** — how many official-source results to request
    - **Priority sources** — comma-separated domains or source names to weight more heavily
    - **Date range** — optional window to constrain results to a specific period
  </Step>
  <Step title="Run the scan">
    Click the **Scan** button in the toolbar. The page shows a scanning indicator while the request is active, then switches to a receiving indicator as results arrive.
  </Step>
  <Step title="Review results">
    Results appear as cards in a responsive grid. Each card shows the signal content, source name, threat or category label, and action buttons. Click a card to expand it for the full detail.
  </Step>
  <Step title="Save signals or launch an investigation">
    From any expanded card, click **Save Signal** to persist the result to your workspace signal library, or click **Investigate** to open Run Setup pre-populated with that signal as context.
  </Step>
</Steps>

## Signal auto-save

Enable **Auto-save** in the Settings panel to automatically persist every incoming scan result as a signal in the active workspace. This is useful when you want to capture everything from a scan without manually reviewing each card.

<Warning>
  Auto-save saves all scan results to your workspace, including low-signal or noisy results. Turn it off when you want to be selective about what enters your signal library.
</Warning>

## Filtering results

Use the filter controls in the Settings panel to narrow the visible cards after a scan:

- **Category / threat level** — filter by INFO, CAUTION, or CRITICAL result labels
- **All** — show all results regardless of category

Filtering only affects what is visible in the current session — it does not remove saved signals from your workspace.

## Stopping a scan

Click the **Stop** button (which replaces the Scan button during an active run) to cancel an in-progress scan. Results received before you stopped remain visible in the feed.

## Clearing the feed

Open **Settings** and click **Clear Feed** to remove all current scan results from the view. This does not delete any signals already saved to your workspace.

## Live Monitor vs. Finder

<CardGroup cols={2}>
  <Card title="Live Monitor" icon="satellite-dish">
    For ongoing monitoring of a configured scope. Run on demand to check for new developments. Results can be saved as signals or launched into investigations.
  </Card>
  <Card title="Finder" icon="search">
    For discovery scanning and launching analysis from a broader search. Uses a shared toolbar date-range control to filter the discovery sweep.
  </Card>
</CardGroup>

Use Live Monitor when you have a defined research scope and want to watch it for new signals over time. Use Finder when you are starting fresh and want to discover what is out there before committing to an investigation angle.`},"features/files":{slug:"features/files",title:"Files: browse and manage all your research workspaces",description:"Browse all your workspaces in a grid, navigate into individual workspaces to view artifacts and items, and take actions like chat handoff and export.",group:"Features",content:`Files is the main workspace browser in Sherlock. When you open it, you see all your workspaces laid out in a grid — each one showing its name, icon, and artifact count. From there you can navigate into any workspace to browse its artifacts and canonical items, open records in the viewer or chat, place things on the board, and manage workspace settings.

## Navigating to Files

Go to \`/files\` at any time, or click **Files** in the main sidebar. If this is your first time using Sherlock, Files is where you land after completing the onboarding step.

<Tip>
  Click a workspace's icon in the Files grid to open the icon picker and customize it. Icons carry across all surfaces where the workspace appears — the omnibox, the sidebar, and the network graph.
</Tip>

## All-workspaces overview

The landing view shows every workspace as a card. Each card displays:

- **Workspace name** — click anywhere on the card to open the workspace
- **Icon** — click just the icon to open the icon picker
- **Artifact count** — how many saved artifacts the workspace contains

Use the **New Workspace** button (or press \`Ctrl+N\`) to create a workspace without leaving Files.

## Browsing a workspace

Click a workspace card to open it. Inside the workspace view, three tabs let you filter what you see:

<Tabs>
  <Tab title="All">
    Shows artifacts and canonical items in a single combined list, ordered by most recent activity.
  </Tab>
  <Tab title="Artifacts">
    Shows only investigation artifacts — the structured analysis documents produced by your runs. Each row shows the artifact title, date, and type badge.
  </Tab>
  <Tab title="Items">
    Shows canonical workspace items: notes, links, files and media, and promoted chat excerpts. Each item includes a provenance summary indicating where it came from.
  </Tab>
</Tabs>

## Working with artifacts

From the **Artifacts** tab, each artifact row gives you direct access to the most common actions:

<AccordionGroup>
  <Accordion title="Open in viewer">
    Click the artifact title to open it in the full Operation View reader, where you can read findings, inspect evidence, edit sections, and launch follow-ups.
  </Accordion>
  <Accordion title="Start a chat session">
    Click the chat icon to open a new workspace chat session grounded in this artifact. The artifact is attached as retrieval context from the start.
  </Accordion>
  <Accordion title="Place on board">
    Click the board icon to send the artifact to the research board. If the artifact is already placed on the board, this focuses the existing card instead of placing a duplicate.
  </Accordion>
  <Accordion title="Source link">
    For artifacts that carry a primary source URL, click the source icon to open that URL in a new tab.
  </Accordion>
  <Accordion title="Export">
    Download the artifact as HTML, Markdown, or JSON for external use or archiving.
  </Accordion>
  <Accordion title="Delete">
    Remove the artifact from the workspace. This action is permanent and cannot be undone from within the app.
  </Accordion>
</AccordionGroup>

## Working with workspace items

From the **Items** tab, each item shows its type (note, link, file, or promoted excerpt), a provenance summary, and action buttons:

- **Chat** — open a chat session with this item as context
- **Board** — place the item on the research board
- **Source link** — open the item's associated URL (for link and file items)

## Uploading documents

You can upload files from your device into any workspace. Sherlock reads the content of text-based files and saves them either as workspace items or as artifact drafts, depending on which route you choose.

**Supported file types for text extraction:**

- \`.txt\`, \`.md\`, \`.markdown\`, \`.csv\`, \`.json\`, \`.xml\`, \`.yaml\`, \`.yml\`, \`.html\`
- Any file with a \`text/*\` MIME type

Image and video files can also be uploaded — they are stored with a preview thumbnail but without text extraction.

**How to upload:**

1. Open the upload dialog from **Files**, the **Research Board**, or **Chat** using the upload action in the toolbar or context menu.
2. Select one or more files from your device.
3. Choose a **destination route**:
   - **Save as item** — creates a workspace item (note-type record) with the file's extracted text content and metadata. The item appears in the Library rail and can be placed on boards or referenced in chat.
   - **Create artifact draft** — creates a new artifact with the file's content as its body. You choose an artifact type (Report, Synthesis, Brief, Digest, Comparison, Note, Timeline, or Monitor Snapshot) before saving.
4. Select the **target workspace** if you have multiple workspaces.
5. Confirm to save. Sherlock extracts readable text from supported formats and attaches file metadata (name, type, size) automatically.

<Note>
  Uploaded files are processed entirely in your browser. No file data is sent to any external server — the extracted text and metadata are saved to your local database alongside your other workspace data.
</Note>

## Grid and list modes

Use the view toggle in the toolbar to switch between:

- **Grid** — workspace cards arranged in a responsive grid, better for browsing many workspaces at once
- **List** — a denser row-based layout, better for scanning names and artifact counts quickly

## Deep-linking to a specific item

Every canonical workspace item has a stable URL:

\`\`\`
/files?workspaceId=<workspaceId>&focusItemId=<itemId>
\`\`\`

This URL opens Files directly to the item, scrolling it into view and highlighting it. Chat mentions, omnibox results, and timeline handoffs all use this format when pointing at workspace items — so any link you receive or generate for a specific item will land in exactly the right place.

## Managing workspaces from Files

Right-click a workspace card (or open its context menu) to access workspace management actions:

<CardGroup cols={2}>
  <Card title="Rename" icon="pen">
    Change the workspace's display name. The new name takes effect immediately across all surfaces.
  </Card>
  <Card title="Change icon" icon="image">
    Open the icon picker to choose a new icon from the curated icon library.
  </Card>
  <Card title="Export" icon="download">
    Download a full workspace backup including all artifacts, chat history, board snapshots, items, signals, and graph data.
  </Card>
  <Card title="Delete" icon="trash">
    Remove the workspace and all of its contents permanently. Sherlock asks you to confirm before proceeding.
  </Card>
  <Card title="Purge" icon="eraser">
    Remove all artifacts, runs, chat history, signals, and board content from the workspace while keeping the workspace itself. The workspace name and settings remain; only its research history is cleared.
  </Card>
  <Card title="New workspace" icon="plus">
    Create a new empty workspace. You can also use \`Ctrl+N\` from anywhere in the app to reach the same new-workspace modal.
  </Card>
</CardGroup>

<Warning>
  **Purge** removes all artifacts and history from a workspace but keeps the workspace record itself. **Delete** removes everything including the workspace. Neither action can be undone from within the app — use **Export** first if you need to preserve the data.
</Warning>

## Searching in Files

Use the header omnibox to search across all workspaces, artifacts, and items by name. Results appear as you type, and selecting a workspace or artifact result navigates directly to it.

## Typical workflow

<Steps>
  <Step title="Open Files">
    Navigate to \`/files\` or click **Files** in the sidebar. You see your workspace grid.
  </Step>
  <Step title="Select a workspace">
    Click the workspace card you want to browse. The workspace view opens with the **All** tab active.
  </Step>
  <Step title="Switch to the Artifacts tab">
    Click **Artifacts** to filter the list to investigation artifacts only.
  </Step>
  <Step title="Open an artifact in the viewer">
    Click the artifact's title to open it in the full Operation View reader.
  </Step>
</Steps>`},"configuration/settings":{slug:"configuration/settings",title:"Sherlock settings: API keys, scopes, and data controls",description:"A guide to every configurable area in Sherlock Settings — API keys, provider defaults, scopes, OpenRouter web search, workspace data, and themes.",group:"Configuration",content:`The Settings page (\`/settings\`) is your control panel for everything Sherlock stores and uses locally in your browser. There is no Sherlock account, no cloud sync, and no server-side profile — every preference you configure here lives on your device, scoped to the browser origin you're using.

Settings is organized into five tabs: **Runtime**, **Scopes**, **Templates**, **Data**, and **Themes**. Each tab focuses on a distinct configuration concern, from the AI provider you use to the visual look of the workspace.

<AccordionGroup>
  <Accordion title="Runtime — API keys and generation defaults">
    The Runtime tab controls how Sherlock connects to AI providers and how it runs analysis.

    **Access credentials**

    You can enter API keys for any combination of the four supported providers:

    - **Google Gemini** — paste your key from [Google AI Studio](https://aistudio.google.com)
    - **OpenRouter** — paste your key from the OpenRouter keys dashboard
    - **OpenAI** — paste your key from the OpenAI platform
    - **Anthropic** — paste your key from the Anthropic console

    Each key field has a Show/Hide toggle and a Clear button. Keys are stored in your browser's \`localStorage\` and never leave your device through Sherlock.

    **Runtime profile**

    Under the Runtime Profile section you set your workspace-wide defaults:

    - **Active provider** — which provider Sherlock routes to when you start an analysis or chat
    - **Active model** — the specific model within that provider; you can browse the full OpenRouter catalog or enter an OpenRouter model slug manually
    - **Generation mode** — **Single pass** generates the full artifact in one request; **Staged** generates in structured phases and is recommended for longer, more detailed reports
    - **Search depth** — **Standard** for focused investigations; **Deep** for broader synthesis and more rigorous evidence gathering
    - **Thinking budget** — a slider (0–8,192 tokens) that controls how much reasoning budget the AI uses before generating output; only active when the selected model supports extended reasoning

    Individual runs can override these defaults at launch time, so the Runtime settings represent your starting point rather than a hard constraint.

    **OpenRouter web search**

    When your active provider is OpenRouter, an additional section appears for the \`openrouter:web_search\` feature. See the [OpenRouter search section](#openrouter-search) below.
  </Accordion>

  <Accordion title="Scopes — built-in and custom investigation domains">
    The Scopes tab lets you view the built-in domain packs that ship with Sherlock and create your own custom scopes to shape how analysis is framed.

    Each scope defines:

    - **ID** — a unique identifier used internally
    - **Name** — the display label shown in launch setup and run metadata
    - **Description** — a short summary of what the scope covers
    - **Domain context** — the thematic framing that gets injected into prompts for runs using this scope
    - **Categories** — organizational tags for grouping
    - **Personas** — analyst perspectives that influence how findings are written

    Built-in scopes cover domains like threat intelligence, corporate research, geopolitical analysis, and more. Custom scopes you create appear alongside the built-ins and are available in run setup, guided run mode, and chat.

    Custom scopes are stored locally in your browser's SQLite database and are included in workspace data exports.
  </Accordion>

  <Accordion title="OpenRouter search — web search configuration">
    When you're using OpenRouter as your active provider and have the \`openrouter:web_search\` model selected, the Runtime tab surfaces a dedicated section for configuring web search behavior:

    - **Search engine** — choose which underlying search engine OpenRouter routes to
    - **Max results per query** — how many results to fetch in a single search call
    - **Max total results** — an upper limit across all search calls in a run
    - **Context window size** — how much of each result's content to include in the model context
    - **Allowed domains** — restrict results to a specific list of domains (leave empty to allow all)
    - **Excluded domains** — block specific domains from appearing in results

    These settings apply globally as your defaults. Individual runs may override them through the run setup panel.
  </Accordion>

  <Accordion title="Data — workspace backup, restore, and preferences">
    The Data tab contains two sections: **Operational Preferences** and **Workspace Data**.

    **Operational preferences**

    - **Auto-resolve entities** — when enabled, Sherlock automatically groups nearby name variations of the same entity during analysis and review
    - **Quiet mode** — suppresses non-critical system notifications while keeping core warnings and errors visible

    **Workspace data**

    This section gives you controls for backing up and managing all the workspace content Sherlock has stored in your browser:

    - **Export** — downloads a full JSON backup of your workspace data, including workspaces, artifacts, runs, chat history, research boards, saved signals, library items, templates, and manual graph data
    - **Restore Backup** — imports a JSON backup file, replacing your current workspace data
    - **Delete Data** — permanently removes all local workspace data; this action cannot be reversed

    API keys, theme settings, and device-local preferences are intentionally excluded from exports. For details on what's included and excluded, see [Export and import your Sherlock workspace data](/configuration/export-import).
  </Accordion>

  <Accordion title="Themes — visual appearance and the theme workbench">
    The Themes tab shows your current theme configuration and gives you a quick link to the full theme workbench. From here you can see your active theme template name, current light/dark mode, and whether you have unsaved changes.

    Click **Open Workbench** to launch the theme workbench panel, where you can adjust accent colors, surface layers, graph palette colors, background treatment, divider styling, typography, border radius, and more.

    The workbench is also available on all routed pages via the sidebar trigger — you don't have to visit Settings to make visual adjustments.

    Theme state is stored in the browser's SQLite database separately from workspace data and is not included in workspace backups or exports. For a full walkthrough of theme customization, see [Customizing the Sherlock visual theme](/configuration/themes).
  </Accordion>
</AccordionGroup>

## Navigating to settings

Open Settings from the navigation sidebar on any workspace page. The URL is \`/settings\`.

<Tip>
  Settings changes take effect immediately in the current browser session. There is no save button for most sections — provider keys and generation defaults are saved when you leave the field or click the explicit save action shown in the Runtime tab.
</Tip>

## Local-only storage

Everything in Settings lives in your browser. There is no Sherlock account, and none of your configuration is synced across devices or browsers. If you use Sherlock on multiple computers or browser profiles, you'll need to configure each one separately.

This also means clearing your browser's storage for the Sherlock origin will reset all settings, API keys, and workspace data at once. Export a workspace backup from Settings → Data before clearing browser storage if you want to preserve your work.`},"configuration/themes":{slug:"configuration/themes",title:"Customize the Sherlock visual theme and appearance",description:"How to use the Sherlock theme workbench to adjust colors, surfaces, typography, dividers, and border radius — and save named theme configurations.",group:"Configuration",content:`Sherlock includes a full theme workbench that lets you customize the visual appearance of the entire workspace without touching any code. You can change the accent color, surface stack, graph palette, background treatment, divider styling, typography, and border radii — all with live preview across every page.

The active theme applies workspace-wide: the artifact viewer, research board, network graph, timeline, chat, and settings all reflect the same theme configuration simultaneously.

## Opening the theme workbench

You can open the workbench from two places:

- **Settings → Themes** — click **Open Workbench** from the Themes tab in Settings
- **Sidebar trigger** — a workbench panel trigger is available on every routed page via the sidebar, so you can adjust the theme from anywhere in the workspace without navigating to Settings

## Light and dark mode

Dark and light mode are toggled independently from the theme template itself. You can switch between modes without changing your accent color or other theme values — each mode stores its own accent color and surface configuration separately. The current mode is shown in the Themes tab header.

## What you can customize

The workbench organizes controls across several tabs and sections:

### Accent color

The accent color defines the primary highlight across buttons, focus states, active indicators, and interactive elements. Accent is set per mode (light and dark independently), using a color model with three controls:

- **Hue** — the color angle (0–360)
- **Lightness** — how light or dark the accent reads
- **Chroma** — the saturation intensity

A live color swatch updates as you adjust the values.

### Graph palette

The graph palette controls the colors used for nodes and clusters in the network graph view. Each palette slot has its own hue, lightness, chroma, and opacity controls. You can also use **Derive From Accent** to automatically generate a cohesive palette from your current accent color.

### Background

The background section controls the treatment behind the main shell surface — options include flat fills, gradient treatments, and noise overlays. This lets you tune whether the workspace feels flat or has a subtle sense of depth.

### Surfaces

Surfaces define the four layers of the visual stack:

- **Shell** — the outermost container and body background
- **Rail** — the main navigation and side column
- **Panel** — sidebar panels and secondary containers
- **Surface** — the primary content area where artifacts, chat, and cards appear

Each surface layer has hue, lightness, chroma, and opacity controls. A live stack diagram shows how the layers nest so you can see spatial relationships as you adjust.

You can also use **Match Accent Hue** to shift all surface hues to match your current accent, which produces a more tinted, unified palette.

### Shell geometry and rendering

Under the Shell tab you can adjust structural dimensions:

- Sidebar width, rail width, utility dock width, toolbar height, and content measure
- Surface solidity (opacity of surface layers) and density (overall spacing scale)

### Dividers

Dividers are the thin separator lines between shell sections. You can control:

- **Tone** — hue, lightness, and chroma of the divider color
- **Width** — pixel thickness (0–4px)
- **Strength** — overall opacity of the divider line
- **Accent tint** — how much of the accent color bleeds into the divider
- **Edge glow** — a subtle luminance glow at the divider edge

Divider settings are per-mode, so dark mode and light mode can have different divider treatments.

### Typography

The Typography tab shows the current font family assignments for the four type roles — UI, Display, Label, and Mono — along with a live scale preview of every text style used across the workspace.

### Border radius

Four radius values control the rounding of different element tiers:

- **Shell** — outermost containers
- **Panel** — cards and panel surfaces
- **Control** — buttons and inputs
- **Pill** — tags, badges, and chip elements

## Theme templates

The workbench includes a library of named theme templates you can switch between. Selecting a template applies it immediately so you can preview it live. Templates are shown as swatches in the Themes section of the workbench.

You can also save your own custom configuration into a named slot using **Fork To Custom Slot**, which copies the current state into an editable custom template. This is useful for building variations from a factory template without losing the original.

To restore a template to its factory defaults, use **Factory Reset Active Theme**. To reset every template in the library to factory state, use **Factory Reset All Themes**.

## Creating and saving a custom theme

<Steps>
  <Step title="Open the workbench">
    Go to Settings → Themes and click **Open Workbench**, or use the workbench trigger in the sidebar on any page.
  </Step>
  <Step title="Adjust the accent color">
    In the workbench, expand the **Accent** section. Use the Hue, Lightness, and Chroma sliders to dial in the accent color you want. Watch the live swatch update as you adjust.
  </Step>
  <Step title="Adjust the background and surfaces">
    Expand the **Background** section to choose a background treatment. Then expand **Surfaces** and adjust the shell, rail, panel, and surface layers to complement your accent.
  </Step>
  <Step title="Refine dividers and radius">
    Expand **Dividers** to fine-tune the separator lines, and expand **Radius System** to adjust border rounding to match your aesthetic.
  </Step>
  <Step title="Save to a custom slot">
    In the **Themes** section of the workbench, click **Fork To Custom Slot**. This saves your current state to a custom theme template that you can return to and continue editing.
  </Step>
  <Step title="Apply the theme">
    Select your custom slot from the template grid to confirm it as the active theme. The change takes effect immediately across all workspace pages.
  </Step>
</Steps>

<Note>
  Theme state is stored in the browser's SQLite database and is not included in workspace data exports or backups. If you clear browser storage or move to a different device, your custom theme configuration will not carry over automatically.
</Note>

<Tip>
  You can experiment with the workbench without committing changes — your edits are reflected live, but they only become a saved template when you explicitly fork to a custom slot. Use **Factory Reset Active Theme** to discard uncommitted changes and restore the current template to its original state.
</Tip>`},"configuration/export-import":{slug:"configuration/export-import",title:"Back up, export, and import your Sherlock workspace data",description:"How to export a full workspace backup, restore from a backup file, clear all local data, and seed a self-hosted Sherlock with a demo workspace.",group:"Configuration",content:`Because Sherlock keeps all your workspace data in the browser, it's important to export backups before clearing browser storage, switching devices, or migrating to a new deployment. The backup system in Settings → Data lets you download a complete JSON snapshot of your workspace, restore from any prior snapshot, or wipe all local data when you want a clean slate.

## Where to find backup controls

All backup and restore actions live in **Settings → Data**, under the **Workspace Data** section.

## Exporting a backup

Click **Export** → **Workspace Data as JSON Backup** to download a \`.json\` file containing everything Sherlock has stored for your workspace. The file is saved to your browser's download location with a timestamped filename.

### What's included in a backup

A full workspace backup captures:

<CardGroup cols={2}>
  <Card title="Workspaces">
    Workspace metadata, display titles, launch topics, and configuration.
  </Card>
  <Card title="Artifacts">
    Full reports including key findings, evidence records, artifact sections, follow-up records, entities, and sources.
  </Card>
  <Card title="Investigation runs">
    All workspace run records with their pack, purpose, and model configuration.
  </Card>
  <Card title="Chat history">
    Chat sessions, messages, message attachments, and action audit records.
  </Card>
  <Card title="Research boards">
    Board-agent sessions and the full action history for each board session.
  </Card>
  <Card title="Saved signals">
    All signals saved to the workspace.
  </Card>
  <Card title="Library items">
    Workspace library entries — notes, links, files, and promoted chat excerpts.
  </Card>
  <Card title="Boards and snapshots">
    Workspace board shells and all persisted board canvas snapshots.
  </Card>
  <Card title="Graph data">
    Manual nodes and links added to the network graph.
  </Card>
  <Card title="Templates">
    Saved run templates.
  </Card>
</CardGroup>

### What's NOT included

The following are intentionally excluded from backups:

- **API keys** — stored separately in \`localStorage\` and never exported
- **Visual theme settings** — theme templates and mode preference are stored in the database but excluded from workspace backups
- **Device-local preferences** — quiet mode, auto-resolve, and similar per-device settings

This means you can safely share a workspace backup without exposing your credentials or personal display preferences.

## Restoring a backup

<Warning>
  Importing a backup **replaces all current workspace data**. Sherlock clears your existing workspaces, artifacts, runs, chat history, boards, signals, library items, and graph data before restoring the backup file. This cannot be undone. Export your current data first if you want to keep it.
</Warning>

Click **Restore Backup** and select your \`.json\` backup file. Sherlock validates and imports the file inside a single database transaction — if anything goes wrong during the import, your workspace domain is not left in a partial state.

The import also accepts older backup formats for backwards compatibility.

## Exporting a backup and restoring it later

<Steps>
  <Step title="Open Settings → Data">
    Navigate to Settings and click the **Data** tab.
  </Step>
  <Step title="Export your backup">
    Under Workspace Data, click **Export** → **Workspace Data as JSON Backup**. Save the downloaded file somewhere you'll find it later.
  </Step>
  <Step title="Continue working or switch environments">
    Use Sherlock normally, or move to a new browser or deployment.
  </Step>
  <Step title="Open Settings → Data on the new environment">
    Navigate to Settings → Data on the browser or deployment where you want to restore.
  </Step>
  <Step title="Restore the backup">
    Click **Restore Backup**, select the \`.json\` file you exported, and confirm. Sherlock will import the backup and restore your workspace.
  </Step>
</Steps>

## Clearing all workspace data

The **Delete Data** button in the Workspace Data section permanently removes all local workspace content — workspaces, artifacts, runs, chats, signals, templates, boards, library items, and graph data. It also resets graph hide/flag filters that reference workspace data.

This action is irreversible. Export a backup first if there's anything you want to keep.

## Single-workspace export

In addition to full backups, you can export individual workspaces from the artifact viewer or workspace actions. These single-workspace exports are available in HTML, Markdown, and JSON formats and are useful for sharing or archiving a specific investigation without exporting everything.

A single-workspace JSON export uses a different shape (\`workspace\` and \`artifacts\` keys) than a full backup. Both formats are accepted by the import flow.

## Demo workspace seeding for self-hosted deployments

If you self-host Sherlock, you can pre-seed the workspace for first-time visitors by placing a backup file at:

\`\`\`
public/seeds/demo-workspace.json
\`\`\`

When a new browser profile visits your deployment for the first time with an empty workspace, Sherlock automatically imports the seed file once. After that first import, the seed is not re-applied to that browser profile.

The seed file can be either a full workspace-data backup (from Settings → Data → Export) or a single-workspace JSON export with \`workspace\` and \`artifacts\` keys.

<Tip>
  The demo seed is applied per browser origin. Visitors on a Vercel preview URL have a separate browser storage namespace from visitors on the production domain, so the seed can apply independently to each.
</Tip>`},"deployment/vercel":{slug:"deployment/vercel",title:"Deploy Sherlock to Vercel: step-by-step setup guide",description:"Step-by-step guide to deploying Sherlock on Vercel, including env var setup, BYOK hosting configuration, and SPA routing requirements.",group:"Deployment",content:`Sherlock is a static Vite application that deploys cleanly to Vercel with no server database required. Workspace and artifact data live entirely in the visitor's browser via SQLite over IndexedDB, and API keys stay browser-local when users add them through Settings → Runtime. This makes Vercel an ideal host — you get global CDN delivery and zero backend infrastructure to manage.

## How the deployment works

Sherlock builds to a standard static \`dist/\` directory. The repo includes a \`vercel.json\` that configures the build commands and ensures all page routes work correctly for direct navigation and bookmarked links.

<Note>
  The \`vercel.json\` at the repo root handles routing automatically. If you configure the build manually in the Vercel dashboard, set install command to \`npm ci --include=optional\`, build command to \`npm run build\`, and output directory to \`dist\`.
</Note>

## Deploying to Vercel

<Steps>
  <Step title="Import the GitHub repository">
    Go to [vercel.com](https://vercel.com) and click **Add New Project**. Select the Sherlock GitHub repository. Vercel will detect the \`vercel.json\` configuration automatically.
  </Step>
  <Step title="Review build settings">
    Vercel reads the build configuration from \`vercel.json\`. You should see install command \`npm ci --include=optional\`, build command \`npm run build\`, and output directory \`dist\`. No manual changes are needed.
  </Step>
  <Step title="Configure the tldraw license key (optional)">
    If your deployment uses Sherlock's research board feature (powered by tldraw 4.x), add \`VITE_TLDRAW_LICENSE_KEY\` as an environment variable in the Vercel project settings before deploying. This is an app-level license for the canvas SDK — it's different from the AI provider API keys.
  </Step>
  <Step title="Leave provider API keys unset for public BYOK hosting">
    For a public or shared deployment where each visitor uses their own AI provider account, do **not** set \`VITE_GEMINI_API_KEY\`, \`VITE_OPENROUTER_API_KEY\`, \`VITE_OPENAI_API_KEY\`, or \`VITE_ANTHROPIC_API_KEY\` in Vercel. Each visitor will add their own key in Settings → Runtime after the site loads.
  </Step>
  <Step title="Add a demo workspace seed (optional)">
    If you want first-time visitors to land in a pre-seeded demo workspace, place a workspace backup JSON file at \`public/seeds/demo-workspace.json\` in the repository before deploying. Sherlock will auto-import it once for any browser profile that visits with an empty workspace.
  </Step>
  <Step title="Deploy">
    Click **Deploy**. Once the build completes, your Sherlock instance is live. Each visitor can start using it immediately for browsing and will be prompted to add a provider API key when they want to run analysis or chat.
  </Step>
</Steps>

## Environment variables

<CodeGroup>
  \`\`\`bash .env.local (local development)
  # Get your free API key from https://aistudio.google.com/app/apikey
  VITE_GEMINI_API_KEY=your_key_here

  # VITE_OPENROUTER_API_KEY=your_key_here
  # VITE_OPENAI_API_KEY=your_key_here
  # VITE_ANTHROPIC_API_KEY=your_key_here

  # tldraw SDK license key — for local testing or deployments using tldraw 4.x
  # VITE_TLDRAW_LICENSE_KEY=your_key_here
  \`\`\`

  \`\`\`bash Vercel project environment variables
  # Only set VITE_TLDRAW_LICENSE_KEY in Vercel for public deployments.
  # Leave all provider API keys unset — each user enters their own in-app.
  VITE_TLDRAW_LICENSE_KEY=your_tldraw_license_key_here
  \`\`\`
</CodeGroup>

<Warning>
  Do not set \`VITE_GEMINI_API_KEY\`, \`VITE_OPENROUTER_API_KEY\`, \`VITE_OPENAI_API_KEY\`, or \`VITE_ANTHROPIC_API_KEY\` in Vercel for a public-facing deployment. Because these are \`VITE_\` prefixed variables, they are baked into the client bundle at build time and visible to every visitor. Every request made through the site would be charged to your provider account. For public hosting, use strict BYOK mode — see [BYOK: bring your own key to Sherlock](/deployment/byok).
</Warning>

## Important notes

**Preview URLs have isolated storage**

Each Vercel preview URL is a separate browser origin. Workspace data and API keys stored on \`preview-xyz.vercel.app\` are completely separate from data on your production domain. This is useful for testing — you can use a preview deployment without touching production data.

**Redeploying does not wipe user data**

Deploying a new version to the same domain does not clear visitors' browser storage. Their workspaces, artifacts, and saved keys persist across redeployments unless they explicitly clear their browser data or use the Delete Data action in Settings.

**VITE_TLDRAW_LICENSE_KEY is not a provider API key**

The tldraw license key is an SDK license for the board canvas feature. It's configured at deploy time in Vercel (or in \`.env.local\` for local development) rather than entered in Settings → Runtime like provider API keys. You only need it if you're using the research board surface.

## Vercel Web Analytics

Sherlock's app shell includes the \`@vercel/analytics\` React component at the root of both the landing view and the workspace chrome view. When you deploy to Vercel and turn Web Analytics on for the project, the app sends privacy-friendly pageview and route-change events to Vercel Analytics automatically. No configuration is required inside Sherlock itself.

### When it applies

The analytics component only reports data when the app is served from a Vercel deployment with Web Analytics enabled in the project dashboard. In local development or on non-Vercel hosts, the component is a no-op — it does not send events and does not require an API key.

### Turn it on

<Steps>
  <Step title="Deploy to Vercel">
    Deploy the project following the steps above. The \`<Analytics />\` component is already wired into \`src/app/AppShell.tsx\`, so no code changes are needed.
  </Step>
  <Step title="Enable Web Analytics in the dashboard">
    In the Vercel project dashboard, open the **Analytics** tab and click **Enable**. Vercel begins recording pageviews on the next request served from your deployment.
  </Step>
  <Step title="Verify events are firing">
    Load your deployed site and open your browser's DevTools **Network** tab. Look for requests to \`/_vercel/insights/view\` — one fires per route change. If you see them, tracking is live.
  </Step>
</Steps>

### What gets tracked

Web Analytics records pageviews and route changes for the Sherlock SPA. It does **not** capture research content, artifact bodies, chat messages, board contents, entered API keys, or any other data from your local SQLite database. Sherlock's local-first data model (see [How Sherlock stores your data and protects privacy](/concepts/data-and-privacy)) is unaffected — analytics only sees which routes visitors navigate to and standard visitor metadata (approximate country, device type, referrer).

### Turn it off

To disable analytics for a self-hosted fork, remove the \`<Analytics />\` component from \`src/app/AppShell.tsx\` (both the landing view and the workspace chrome view) and drop \`@vercel/analytics\` from \`package.json\`. Deployments that don't enable Web Analytics in the Vercel dashboard also won't record data even with the component present.

## Alternative static hosts

Because Sherlock outputs a standard \`dist/\` directory from Vite, it deploys to any static hosting platform that supports SPA routing. You'll need to configure a catch-all rewrite rule (equivalent to the one in \`vercel.json\`) on whatever platform you use:

- **Netlify** — add a \`_redirects\` file with \`/* /index.html 200\`
- **Cloudflare Pages** — add a \`_routes.json\` or configure custom headers
- **GitHub Pages** — requires a workaround for SPA routing (a 404.html copy of index.html)

The build output itself is identical across all platforms.`},"deployment/byok":{slug:"deployment/byok",title:"BYOK: using your own AI provider key with Sherlock",description:"How Sherlock's bring-your-own-key model works for users and deployers — where keys are stored, which providers are supported, and how to manage them.",group:"Deployment",content:`Sherlock is built on a bring-your-own-key (BYOK) model. Sherlock never holds API keys on its servers — there are no server-side credentials, no shared provider pool, and no account system that stores your keys. Every user provides their own key directly in the app, and that key stays in their browser.

This matters for two reasons: your API usage is billed directly to your own provider account, and Sherlock has no visibility into your queries or the content you investigate. Your requests go from your browser straight to the AI provider.

## How it works for users

When you want to run analysis or use chat, you add your provider API key in **Settings → Runtime** under the Access Credentials section. The key is stored in your browser's \`localStorage\`, scoped to the origin (domain) of the Sherlock deployment you're using. From that point on, every API call Sherlock makes on your behalf uses your key from that browser.

Keys are not exported in workspace backups, not stored in the Sherlock SQLite database, and not synced across devices. They stay in the browser where you entered them.

To remove a key, clear the key field in Settings → Runtime and save.

## How it works for deployers

For public or shared Sherlock deployments, you leave all provider API key environment variables unset in your hosting configuration. Each visitor who wants to run analysis adds their own key in-app. Visitors who just want to browse existing workspace content can do so without entering a key at all.

<Warning>
  Do not set \`VITE_GEMINI_API_KEY\`, \`VITE_OPENROUTER_API_KEY\`, \`VITE_OPENAI_API_KEY\`, or \`VITE_ANTHROPIC_API_KEY\` in your Vercel (or other static host) environment variables for a public-facing deployment. These are \`VITE_\` prefixed variables, which means they are embedded in the client-side JavaScript bundle at build time and readable by anyone who loads the page. Setting a shared provider key in Vercel would expose that key to all visitors and route all API charges to your account.
</Warning>

## Supported providers

<CardGroup cols={2}>
  <Card title="Google Gemini" href="https://aistudio.google.com">
    Get a free API key from Google AI Studio. Gemini models include Gemini 2.5 Pro, Gemini Flash, and others. Good default choice for general research and analysis.
  </Card>
  <Card title="OpenRouter" href="https://openrouter.ai">
    Get a key from the OpenRouter keys dashboard. OpenRouter proxies hundreds of models from dozens of providers — one key gives you access to everything on the platform, including many models with free tiers.
  </Card>
  <Card title="OpenAI" href="https://platform.openai.com">
    Get a key from the OpenAI platform API keys page. Enables GPT-4o, o3, and other OpenAI models.
  </Card>
  <Card title="Anthropic" href="https://console.anthropic.com">
    Get a key from the Anthropic console API keys page. Enables Claude 3.5 Sonnet, Claude 3 Opus, and other Anthropic models.
  </Card>
</CardGroup>

<Note>
  OpenRouter is worth considering even if you already have keys for other providers. A single OpenRouter key gives you access to Gemini, Claude, GPT, Mistral, Llama, and many other models through a unified interface. OpenRouter's free-tier models let you explore Sherlock without any API cost.
</Note>

## Where keys are stored

Provider keys live exclusively in your browser's \`localStorage\`, scoped to the Sherlock origin you're using. Specifically:

- **Not** in the browser's SQLite database (where workspace data lives)
- **Not** exported in workspace backups from Settings → Data
- **Not** synced across devices or browsers
- **Not** visible to other users, even on shared deployments

## Per-user isolation on shared deployments

Because keys are stored per browser origin and per browser profile, multi-user shared hosting works naturally. Each person who uses the same deployed Sherlock URL on their own device has their own keys and their own workspace data. There is no cross-contamination between visitors.

If two people use the same physical computer and same browser, they can use separate browser profiles to maintain isolated key storage.

## Entering and managing keys

<Steps>
  <Step title="Open Settings → Runtime">
    Navigate to Settings and click the **Runtime** tab. The Access Credentials section lists all four provider key fields.
  </Step>
  <Step title="Enter your key">
    Paste your API key into the relevant provider field. Use the Show/Hide toggle to reveal the value as you paste if needed.
  </Step>
  <Step title="Save">
    The key is saved to \`localStorage\` automatically when you leave the field. You can verify it's stored by returning to the field and confirming it's populated.
  </Step>
  <Step title="Select the provider">
    In the Runtime Profile section, set your Active Provider to the provider whose key you just entered, then select the model you want to use.
  </Step>
  <Step title="Run analysis">
    Start a new investigation or chat session. Sherlock will route API calls using your key.
  </Step>
</Steps>

## Removing a key

To remove a key, open Settings → Runtime, click **Clear** next to the relevant provider field, and confirm. The key is deleted from \`localStorage\` immediately. Any subsequent analysis requests that require that provider will prompt you to re-enter a key.`},"changelog/2026-08-17":{slug:"changelog/2026-08-17",title:"August 17, 2026",description:"Vercel Web Analytics for hosted deployments.",group:"Changelog",content:`## Updates

### Vercel Web Analytics on hosted deployments

Sherlock deployments on [Vercel](/deployment/vercel) now include Vercel Web Analytics. Aggregate, privacy-friendly traffic data (page views and visitor counts) is reported for the hosted app, with no changes to how investigation data is stored or shared. Analytics only run when the app is deployed to Vercel and Web Analytics is enabled in the project dashboard, so self-hosted and local instances are unaffected.`},"changelog/2026-04-21":{slug:"changelog/2026-04-21",title:"April 21, 2026",description:"Protocol templates, divider color controls, documentation link, and stability fixes.",group:"Changelog",content:`## New features

### Protocol templates

You can now create reusable **protocol templates** from the settings panel. Templates save your scope, purpose, persona, model, and launch target into a single preset you can reuse across investigations. A step-by-step wizard walks you through choosing a domain pack, setting a launch target and hypothesis, and configuring runtime behavior — so you can start investigations faster without repeating setup each time.

### Divider color controls in the theme workbench

The [theme workbench](/configuration/themes) now includes **divider tone controls** — hue, lightness, and chroma sliders that let you customize the color of shell dividers independently from the accent palette. Each mode (dark and light) has its own divider tone, giving you more precise control over your workspace's visual identity.

## Updates

### Documentation accessible from the app

The landing page now includes a **Read Docs** button linking directly to the documentation site. A docs link has also been added to the footer, making it easier to find help without leaving the app.

### Timeline layout improvement

The [timeline](/features/timeline) event list is now constrained to a comfortable reading width, improving readability when the timeline panel is wide.

## Bug fixes

- **Global search** — Fixed an issue where the action menu could remain visible after closing search, improving reliability when using keyboard shortcuts or clicking outside the search panel.
- **Artifact viewer** — Resolved a rendering edge case in the artifact viewer that could cause display inconsistencies when switching between artifacts.
- **Theme storage** — Fixed a normalization issue with theme divider settings that could prevent saved themes from loading correctly.`}},O="introduction";function M(f){let o=f;return o=o.replace(/<Note>([\s\S]*?)<\/Note>/g,(c,s)=>`
:::note
${s.trim()}
:::
`),o=o.replace(/<Warning>([\s\S]*?)<\/Warning>/g,(c,s)=>`
:::warning
${s.trim()}
:::
`),o=o.replace(/<Tip>([\s\S]*?)<\/Tip>/g,(c,s)=>`
:::tip
${s.trim()}
:::
`),o=o.replace(/<CardGroup[\s\S]*?>/g,""),o=o.replace(/<\/CardGroup>/g,""),o=o.replace(/<Card\s+title="([^"]+)"\s*(?:icon="([^"]*)")?\s*(?:href="([^"]*)")?>([\s\S]*?)<\/Card>/g,(c,s,x,u,g)=>{const p=u?` [Open →](${u})`:"";return`
> **${s}**${p}
>
> ${g.trim().replace(/\n/g,`
> `)}
`}),o=o.replace(/<Steps>/g,""),o=o.replace(/<\/Steps>/g,""),o=o.replace(/<Step\s+title="([^"]+)">/g,`#### $1
`),o=o.replace(/<\/Step>/g,""),o}function H(){const f=L(),o=D(),[c,s]=i.useState(""),[x,u]=i.useState(null),[g,p]=i.useState(!1),h=i.useMemo(()=>{const t=f.pathname.replace(/^\/docs\/?/,"").replace(/\/$/,"");return t||O},[f.pathname]),r=i.useMemo(()=>w[h]||w[O]||Object.values(w)[0],[h]),E=i.useMemo(()=>M((r==null?void 0:r.content)||""),[r]),A=i.useMemo(()=>{if(!(r!=null&&r.content))return[];const t=r.content.split(`
`),n=[];for(const a of t){const l=a.match(/^(#{2,3})\s+(.*)$/);if(l){const j=l[1].length,I=l[2].trim().replace(/[*`_]/g,""),G=I.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");n.push({title:I,id:G,level:j})}}return n},[r]),y=i.useMemo(()=>{const t=[];for(const n of S)for(const a of n.pages)t.push({slug:a.slug,title:a.title,group:n.group});return t},[]),m=y.findIndex(t=>t.slug===h),v=m>0?y[m-1]:null,k=m>=0&&m<y.length-1?y[m+1]:null,C=i.useMemo(()=>{if(!c.trim())return[];const t=c.toLowerCase();return Object.values(w).filter(n=>n.title.toLowerCase().includes(t)||n.description.toLowerCase().includes(t)||n.content.toLowerCase().includes(t)).slice(0,8)},[c]),P=t=>{navigator.clipboard.writeText(t),u(t),setTimeout(()=>u(null),2e3)};return i.useEffect(()=>{window.scrollTo(0,0)},[h]),e.jsxs("div",{className:"min-h-screen bg-[#0d0c0e] text-[#e0dede] flex flex-col font-sans selection:bg-[#9b6288]/30 selection:text-white",children:[e.jsxs("header",{className:"sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-[#0d0c0e]/90 backdrop-blur-md px-4 lg:px-8 h-16 flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{type:"button",className:"lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60",onClick:()=>p(!g),"aria-label":"Toggle Navigation",children:g?e.jsx(T,{className:"w-5 h-5"}):e.jsx(W,{className:"w-5 h-5"})}),e.jsxs(d,{to:"/",className:"flex items-center gap-2.5 group",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-gradient-to-br from-[#9b6288] to-[#603b54] flex items-center justify-center text-white shadow-sm shadow-[#9b6288]/20 group-hover:scale-105 transition-transform",children:e.jsx(_,{className:"w-4 h-4"})}),e.jsxs("div",{className:"flex items-baseline gap-1.5",children:[e.jsx("span",{className:"font-semibold text-neutral-100 tracking-tight text-base",children:"Sherlock"}),e.jsx("span",{className:"text-xs font-medium text-[#c18ead] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#9b6288]/15 border border-[#9b6288]/20",children:"Docs"})]})]})]}),e.jsxs("div",{className:"relative max-w-md w-full mx-4 hidden md:block",children:[e.jsxs("div",{className:"relative flex items-center",children:[e.jsx(F,{className:"w-4 h-4 absolute left-3 text-neutral-500 pointer-events-none"}),e.jsx("input",{type:"text",placeholder:"Search documentation (⌘K)...",value:c,onChange:t=>s(t.target.value),className:"w-full bg-neutral-900/80 border border-neutral-800/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-[#9b6288] focus:ring-1 focus:ring-[#9b6288] transition-all"}),c&&e.jsx("button",{type:"button",onClick:()=>s(""),className:"absolute right-2.5 text-neutral-500 hover:text-neutral-300 text-xs",children:"Clear"})]}),C.length>0&&e.jsx("div",{className:"absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden z-50",children:e.jsx("div",{className:"p-1.5 max-h-80 overflow-y-auto divide-y divide-neutral-800/40",children:C.map(t=>e.jsxs("button",{type:"button",onClick:()=>{o(`/docs/${t.slug}`),s("")},className:"w-full text-left p-2 rounded hover:bg-neutral-800/70 transition-colors flex flex-col gap-0.5",children:[e.jsx("span",{className:"text-xs font-medium text-neutral-200",children:t.title}),e.jsx("span",{className:"text-[11px] text-neutral-400 line-clamp-1",children:t.description||t.group})]},t.slug))})})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs(d,{to:"/welcome",className:"flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/60 transition-all",children:[e.jsx(N,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden sm:inline",children:"Launch App"})]}),e.jsx("a",{href:"https://github.com/jamesnavinhill/sherlock",target:"_blank",rel:"noreferrer",className:"text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-neutral-800/60 transition-colors",title:"GitHub Repository",children:e.jsx(R,{className:"w-4 h-4"})})]})]}),e.jsxs("div",{className:"flex-1 max-w-7xl w-full mx-auto flex",children:[e.jsx("aside",{className:"w-64 shrink-0 hidden lg:block border-r border-neutral-800/60 p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto",children:e.jsx("nav",{className:"space-y-6",children:S.map(t=>e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("h3",{className:"text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2",children:t.group}),e.jsx("div",{className:"space-y-0.5",children:t.pages.map(n=>{const a=h===n.slug;return e.jsx(d,{to:`/docs/${n.slug}`,className:`block text-xs px-2.5 py-1.5 rounded-md transition-all ${a?"bg-[#9b6288]/20 text-[#e9c7dc] font-medium border-l-2 border-[#9b6288]":"text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"}`,children:n.title},n.slug)})})]},t.group))})}),g&&e.jsxs("div",{className:"fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex",children:[e.jsxs("div",{className:"w-72 bg-[#0d0c0e] border-r border-neutral-800 h-full p-6 overflow-y-auto",children:[e.jsxs("div",{className:"flex items-center justify-between pb-4 border-b border-neutral-800 mb-4",children:[e.jsx("span",{className:"font-semibold text-sm text-neutral-200",children:"Navigation"}),e.jsx("button",{type:"button",onClick:()=>p(!1),className:"p-1 rounded text-neutral-400 hover:text-white",children:e.jsx(T,{className:"w-5 h-5"})})]}),e.jsx("nav",{className:"space-y-6",children:S.map(t=>e.jsxs("div",{className:"space-y-1.5",children:[e.jsx("h3",{className:"text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2",children:t.group}),e.jsx("div",{className:"space-y-0.5",children:t.pages.map(n=>e.jsx(d,{to:`/docs/${n.slug}`,onClick:()=>p(!1),className:`block text-xs px-2.5 py-1.5 rounded-md ${h===n.slug?"bg-[#9b6288]/20 text-[#e9c7dc] font-medium":"text-neutral-400 hover:text-neutral-200"}`,children:n.title},n.slug))})]},t.group))})]}),e.jsx("div",{className:"flex-1",onClick:()=>p(!1)})]}),e.jsxs("main",{className:"flex-1 min-w-0 px-6 py-8 lg:px-12 max-w-3xl",children:[e.jsxs("div",{className:"flex items-center gap-1.5 text-[11px] text-neutral-500 mb-4 font-mono",children:[e.jsx("span",{children:"Docs"}),e.jsx(b,{className:"w-3 h-3 text-neutral-600"}),e.jsx("span",{children:r.group}),e.jsx(b,{className:"w-3 h-3 text-neutral-600"}),e.jsx("span",{className:"text-[#c18ead]",children:r.title})]}),e.jsx("h1",{className:"text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2",children:r.title}),r.description&&e.jsx("p",{className:"text-sm text-neutral-400 leading-relaxed mb-8 border-b border-neutral-800/80 pb-6",children:r.description}),e.jsx("article",{className:"prose prose-invert prose-neutral max-w-none text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-4",children:e.jsx(B,{components:{h2:({children:t})=>{const a=String(t).toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");return e.jsx("h2",{id:a,className:"text-lg sm:text-xl font-semibold text-white mt-8 mb-3 pt-4 border-t border-neutral-800/60 scroll-mt-20",children:t})},h3:({children:t})=>{const a=String(t).toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-");return e.jsx("h3",{id:a,className:"text-base font-medium text-neutral-100 mt-6 mb-2 scroll-mt-20",children:t})},p:({children:t})=>e.jsx("p",{className:"leading-relaxed text-neutral-300 my-3",children:t}),ul:({children:t})=>e.jsx("ul",{className:"list-disc list-outside pl-5 space-y-1.5 my-3 text-neutral-300",children:t}),ol:({children:t})=>e.jsx("ol",{className:"list-decimal list-outside pl-5 space-y-1.5 my-3 text-neutral-300",children:t}),blockquote:({children:t})=>e.jsx("blockquote",{className:"border-l-2 border-[#9b6288] bg-[#9b6288]/10 rounded-r-lg px-4 py-2.5 my-4 text-neutral-200",children:t}),code:({children:t,className:n})=>{const a=/language-(\w+)/.exec(n||""),l=String(t).replace(/\n$/,"");return!a&&!l.includes(`
`)?e.jsx("code",{className:"px-1.5 py-0.5 rounded bg-neutral-800/80 border border-neutral-700/60 font-mono text-[11px] text-[#e9c7dc]",children:t}):e.jsxs("div",{className:"relative group my-4 rounded-lg overflow-hidden border border-neutral-800 bg-[#09080a]",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-1.5 bg-neutral-900/80 border-b border-neutral-800/80 text-[11px] text-neutral-400 font-mono",children:[e.jsx("span",{children:a?a[1]:"code"}),e.jsx("button",{type:"button",onClick:()=>P(l),className:"flex items-center gap-1 hover:text-white transition-colors",children:x===l?e.jsxs(e.Fragment,{children:[e.jsx(V,{className:"w-3 h-3 text-emerald-400"}),e.jsx("span",{className:"text-[10px] text-emerald-400",children:"Copied"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Y,{className:"w-3 h-3"}),e.jsx("span",{className:"text-[10px]",children:"Copy"})]})})]}),e.jsx("pre",{className:"p-4 overflow-x-auto font-mono text-xs text-neutral-200 leading-normal",children:e.jsx("code",{children:t})})]})},a:({href:t,children:n})=>{if(((t==null?void 0:t.startsWith("/"))||(t==null?void 0:t.startsWith("#")))&&t&&!t.startsWith("#")){const l=t.startsWith("/docs")?t:`/docs${t}`;return e.jsx(d,{to:l,className:"text-[#c18ead] hover:underline font-medium",children:n})}return e.jsxs("a",{href:t,target:"_blank",rel:"noreferrer",className:"text-[#c18ead] hover:underline inline-flex items-center gap-0.5",children:[n,e.jsx(R,{className:"w-3 h-3 inline-block ml-0.5"})]})}},children:E})}),e.jsxs("div",{className:"mt-12 pt-6 border-t border-neutral-800 flex items-center justify-between gap-4",children:[v?e.jsxs(d,{to:`/docs/${v.slug}`,className:"group flex flex-col text-left p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/40 transition-all max-w-[48%]",children:[e.jsxs("span",{className:"text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1",children:[e.jsx(N,{className:"w-3 h-3 group-hover:-translate-x-0.5 transition-transform"})," Previous"]}),e.jsx("span",{className:"text-xs font-medium text-neutral-200 group-hover:text-white truncate",children:v.title})]}):e.jsx("div",{}),k&&e.jsxs(d,{to:`/docs/${k.slug}`,className:"group flex flex-col text-right p-3 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-800/40 transition-all max-w-[48%]",children:[e.jsxs("span",{className:"text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center justify-end gap-1",children:["Next ",e.jsx(b,{className:"w-3 h-3 group-hover:translate-x-0.5 transition-transform"})]}),e.jsx("span",{className:"text-xs font-medium text-neutral-200 group-hover:text-white truncate",children:k.title})]})]})]}),A.length>0&&e.jsx("aside",{className:"w-56 shrink-0 hidden xl:block p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto",children:e.jsxs("div",{className:"space-y-3",children:[e.jsx("h4",{className:"text-[11px] font-semibold text-neutral-400 uppercase tracking-wider",children:"On this page"}),e.jsx("nav",{className:"space-y-1.5 text-xs",children:A.map(t=>e.jsx("a",{href:`#${t.id}`,className:`block text-neutral-500 hover:text-neutral-200 transition-colors truncate ${t.level===3?"pl-3 text-[11px]":""}`,children:t.title},t.id))})]})})]})]})}export{H as DocsView,H as default};
