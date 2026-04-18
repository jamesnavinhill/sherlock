import React, { useEffect, useState } from 'react';
import {
  Search,
  FileText,
  Radio,
  Network,
  Clock3,
  MessageSquare,
  Shapes,
  Shield,
  Layers,
  Zap,
  Brain,
  Database,
  Key,
  Globe,
  ArrowRight,
  Sun,
  Moon,
  Crosshair,
  BarChart3,
  BookOpen,
  Workflow,
} from 'lucide-react';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';

/* ------------------------------------------------------------------ */
/*  LandingPage                                                       */
/*  Standalone public landing for first-time visitors.                */
/*  Uses the project theme system (CSS custom properties + Tailwind). */
/* ------------------------------------------------------------------ */

interface LandingPageProps {
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  onGetStarted: () => void;
}

const LANDING_ACCENT_FILL = 'color-mix(in oklab, var(--osint-primary) 12%, var(--osint-panel) 88%)';
const LANDING_ACCENT_FILL_STRONG =
  'color-mix(in oklab, var(--osint-primary) 18%, var(--osint-panel) 82%)';
const LANDING_ACCENT_GLOW = '0 0 8px -8px color-mix(in oklab, var(--osint-primary) 18%, transparent)';

/* ---- tiny helpers ------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-mono uppercase tracking-widest"
      style={{
        borderColor: 'var(--osint-primary-soft-border)',
        color: 'var(--osint-primary)',
        backgroundColor: LANDING_ACCENT_FILL,
      }}
    >
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group relative rounded-lg p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: 'var(--osint-interaction-bg)',
        border: '1px solid var(--osint-interaction-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--osint-raised-outline-strong)';
        e.currentTarget.style.boxShadow = 'var(--osint-rail-interaction-shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--osint-interaction-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-md"
        style={{
          backgroundColor: LANDING_ACCENT_FILL,
          color: 'var(--osint-primary)',
        }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className="mb-2 font-sans text-base font-semibold"
        style={{ color: 'var(--osint-text-heading)' }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--osint-text-muted)' }}>
        {description}
      </p>
    </div>
  );
}

function WorkflowStep({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold"
          style={{
            backgroundColor: LANDING_ACCENT_FILL,
            color: 'var(--osint-primary)',
            border: '1px solid var(--osint-primary-soft-border)',
          }}
        >
          {step}
        </div>
        {step < 5 && (
          <div
            className="mt-2 w-px flex-1"
            style={{ backgroundColor: 'var(--osint-interaction-border)' }}
          />
        )}
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Icon className="h-4 w-4" style={{ color: 'var(--osint-primary)' }} />
          <h4
            className="font-sans text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            {title}
          </h4>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--osint-text-muted)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function SurfaceCard({
  icon: Icon,
  name,
  tagline,
}: {
  icon: React.ElementType;
  name: string;
  tagline: string;
}) {
  return (
    <div
      className="flex items-start gap-3.5 rounded-lg p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        border: '1px solid var(--osint-interaction-border)',
        backgroundColor: 'var(--osint-interaction-bg)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--osint-raised-outline-strong)';
        e.currentTarget.style.boxShadow = 'var(--osint-rail-interaction-shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--osint-interaction-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: LANDING_ACCENT_FILL,
          color: 'var(--osint-primary)',
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <h4
          className="font-sans text-sm font-semibold"
          style={{ color: 'var(--osint-text-heading)' }}
        >
          {name}
        </h4>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--osint-text-muted)' }}>
          {tagline}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                              */
/* ================================================================== */

export function LandingPage({ themeMode, onToggleTheme, onGetStarted }: LandingPageProps) {
  const brandLogoSrc = '/logo-dark.jpg';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="relative isolate min-h-screen overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--osint-dark)', color: 'var(--osint-text)' }}
    >
      <MainContentDotGrid className="z-0" testId="landing-dot-grid-background" />
      <div className="relative z-10">
      {/* ─── Top Bar ─────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-3 transition-all duration-300 md:px-10"
        style={{
          backgroundColor: scrolled
            ? 'color-mix(in oklab, var(--osint-dark) 92%, transparent)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(1.4)' : 'none',
          borderBottom: scrolled
            ? '1px solid var(--osint-interaction-border)'
            : '1px solid transparent',
        }}
      >
        <div className="flex items-center">
          <span
            className="font-sans text-[1.55rem] font-bold leading-none tracking-[0.19em] md:text-[1.95rem]"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            SHER<span style={{ color: 'var(--osint-primary)' }}>LOCK</span>
          </span>
        </div>

        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200"
          style={{
            color: 'var(--osint-primary)',
          }}
          title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
          aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pt-20 text-center">
        {/* Decorative radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 44% at 50% 38%, color-mix(in oklab, var(--osint-primary) 6%, transparent), transparent)',
          }}
        />

        <div className="relative z-10 max-w-3xl -mt-24">
          <img
            src={brandLogoSrc}
            alt=""
            className="mx-auto -mb-12 h-[22rem] w-[22rem] object-contain"
            aria-hidden="true"
          />

          <h1
            className="font-sans text-4xl font-bold leading-tight tracking-tight md:text-5xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            AI-Powered Research
            <br />
            <span style={{ color: 'var(--osint-primary)' }}>Workspace</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed md:text-lg"
            style={{ color: 'var(--osint-text-muted)' }}
          >
            Sherlock is a local-first knowledge workspace for structured investigations,
            real-time monitoring, and AI-assisted reporting — all running in your browser.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2.5 rounded-lg px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                style={{
                  backgroundColor: LANDING_ACCENT_FILL,
                  border: '1px solid var(--osint-primary-soft-border)',
                  color: 'var(--osint-primary)',
                  boxShadow: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = LANDING_ACCENT_FILL_STRONG;
                  e.currentTarget.style.borderColor =
                    'color-mix(in oklab, var(--osint-primary) 60%, transparent)';
                  e.currentTarget.style.boxShadow = LANDING_ACCENT_GLOW;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = LANDING_ACCENT_FILL;
                  e.currentTarget.style.borderColor = 'var(--osint-primary-soft-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Open Workspace
                <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p
            className="mt-5 text-xs font-mono tracking-wide"
            style={{ color: 'var(--osint-text-quiet)' }}
          >
            Free &amp; open source · BYOK · Nothing leaves your browser
          </p>
        </div>
      </section>

      {/* ─── Demo Video Placeholder ──────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-4">
        <div
          className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl"
          style={{
            border: '1px solid var(--osint-interaction-border)',
            backgroundColor: 'var(--osint-interaction-bg)',
            boxShadow: '0 24px 64px -32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                backgroundColor: LANDING_ACCENT_FILL,
                border: '1px solid var(--osint-primary-soft-border)',
              }}
            >
              <svg
                className="h-6 w-6 ml-0.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: 'var(--osint-primary)' }}
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span
              className="text-sm font-mono tracking-wide"
              style={{ color: 'var(--osint-text-quiet)' }}
            >
              Demo video coming soon
            </span>
          </div>
        </div>
      </section>

      {/* ─── Core Capabilities ───────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <SectionLabel>Core Capabilities</SectionLabel>
          <h2
            className="mt-5 font-sans text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            Everything you need for deep research
          </h2>
          <p
            className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed"
            style={{ color: 'var(--osint-text-muted)' }}
          >
            Sherlock brings AI analysis, structured outputs, multi-surface workspaces, and
            persistent local storage together in one workspace — organized around your
            investigation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Brain}
            title="Multi-Provider AI"
            description="Route analysis through Gemini, OpenRouter, OpenAI, or Anthropic. A capability-aware model registry with dynamic catalog, curated picks, and manual slug entry."
          />
          <FeatureCard
            icon={Layers}
            title="Structured Artifacts"
            description="AI generates typed artifact sections, evidence records, provenance chains, methodology blocks, deep dives, and follow-up records — not just raw text."
          />
          <FeatureCard
            icon={Search}
            title="Omnibox Navigation"
            description="One shared search bar for routes, workspaces, saved views, artifacts, items, chats, runs, and signals — with recent destinations and context-aware handoffs."
          />
          <FeatureCard
            icon={Shapes}
            title="Research Boards"
            description="Multi-board canvas built on tldraw with a canonical library, note ingestion, promoted chat excerpts, and a board-agent with approval-first review sheets."
          />
          <FeatureCard
            icon={MessageSquare}
            title="Workspace Chat"
            description="Grounded chat sessions with streaming output, @mention references to workspace records, excerpt promotion, transcript export, and guided run launches."
          />
          <FeatureCard
            icon={Globe}
            title="Web Search Integration"
            description="Server-side web search via OpenRouter with configurable engine, result limits, context size, and domain filtering built into the analysis pipeline."
          />
          <FeatureCard
            icon={Clock3}
            title="Timeline"
            description="Workspace chronology unifying signals, runs, artifacts, entity milestones, chat sessions, and library events with lineage focus, snapshot export, and saved views."
          />
          <FeatureCard
            icon={Network}
            title="Network Graph"
            description="D3-powered entity graph with manual nodes, concept-aware types, entity resolution, flag/hide controls, and a dossier rail for deep inspection."
          />
          <FeatureCard
            icon={Radio}
            title="Live Monitor"
            description="Real-time signal scans with filtering, save/persist actions, and feeder-style CTAs that launch directly into synthesis runs."
          />
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="mb-12 text-center">
          <SectionLabel>How It Works</SectionLabel>
          <h2
            className="mt-5 font-sans text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            From question to evidence
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: 'var(--osint-text-muted)' }}
          >
            Sherlock&apos;s workflow is designed around the way real investigations unfold.
          </p>
        </div>

        <div className="pl-1">
          <WorkflowStep
            step={1}
            icon={Crosshair}
            title="Scope & Launch"
            description="Define your investigation topic and angle. Choose a domain pack, purpose profile, and AI provider. Sherlock resolves built-in scopes and starters into run metadata and prompt behavior."
          />
          <WorkflowStep
            step={2}
            icon={Zap}
            title="AI Analysis"
            description="Sherlock runs structured analysis — single-pass or staged — through your chosen provider. Results come back as typed artifact sections with evidence, provenance, methodology, and follow-ups."
          />
          <WorkflowStep
            step={3}
            icon={BookOpen}
            title="Review & Explore"
            description="Read the full report in Operation View with key findings, section editing, and inline evidence navigation. Inspect entities, signals, and headlines in the dossier panel."
          />
          <WorkflowStep
            step={4}
            icon={Workflow}
            title="Expand the Investigation"
            description="Chat with the AI about findings, compose visual boards, trace the timeline, explore the network graph. Promote discoveries back into the canonical library."
          />
          <WorkflowStep
            step={5}
            icon={BarChart3}
            title="Export & Archive"
            description="Export workspaces as HTML, Markdown, or JSON. Back up everything — artifacts, runs, chat history, boards, graph data, signals — and restore on any browser."
          />
        </div>
      </section>

      {/* ─── Workspace Surfaces ──────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <SectionLabel>Workspace Surfaces</SectionLabel>
          <h2
            className="mt-5 font-sans text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            Purpose-built surfaces for every phase
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: 'var(--osint-text-muted)' }}
          >
            Each workspace ships with interconnected surfaces that share context, entities, and
            artifacts so you never lose your thread.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SurfaceCard
            icon={FileText}
            name="Operation View"
            tagline="Document-first artifact reading with key findings, section editing, evidence navigation, and entity inspection."
          />
          <SurfaceCard
            icon={Shapes}
            name="Research Board"
            tagline="Multi-board canvas with canonical library, note/link/file ingestion, AI board-agent, and presentation mode."
          />
          <SurfaceCard
            icon={MessageSquare}
            name="Workspace Chat"
            tagline="AI chat grounded in your workspace with @mentions, excerpt promotion, transcript export, and guided runs."
          />
          <SurfaceCard
            icon={Clock3}
            name="Timeline"
            tagline="Unified chronology across signals, runs, artifacts, entity milestones, and chat sessions."
          />
          <SurfaceCard
            icon={Network}
            name="Network Graph"
            tagline="D3 entity graph with manual nodes, entity resolution, concept types, and an overlaying dossier rail."
          />
          <SurfaceCard
            icon={Radio}
            name="Live Monitor"
            tagline="Real-time signal scanning with filtering, save actions, and direct launch into synthesis."
          />
        </div>
      </section>

      {/* ─── Architecture / Trust ────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <div className="mb-12 text-center">
          <SectionLabel>Architecture</SectionLabel>
          <h2
            className="mt-5 font-sans text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            Local-first. Yours to keep.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Database,
              title: 'Browser SQLite',
              text: 'All data persists via wa-sqlite + IndexedDB. No server database required.',
            },
            {
              icon: Key,
              title: 'BYOK',
              text: 'Bring your own API keys. Nothing is stored on a server — keys stay in your browser.',
            },
            {
              icon: Shield,
              title: 'Nothing Leaves',
              text: 'Every workspace, artifact, and chat session lives entirely on your device.',
            },
            {
              icon: Globe,
              title: 'Deploy Anywhere',
              text: 'Ships as a static Vite app. One-click Vercel deploy, self-host, or run local.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg p-5 text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{
                border: '1px solid var(--osint-interaction-border)',
                backgroundColor: 'var(--osint-interaction-bg)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--osint-raised-outline-strong)';
                e.currentTarget.style.boxShadow = 'var(--osint-rail-interaction-shadow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--osint-interaction-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <item.icon
                className="mx-auto mb-3 h-6 w-6"
                style={{ color: 'var(--osint-primary)' }}
              />
              <h4
                className="mb-1.5 font-sans text-sm font-semibold"
                style={{ color: 'var(--osint-text-heading)' }}
              >
                {item.title}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--osint-text-muted)' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-32 text-center">
        <div
          className="rounded-xl p-10 md:p-14"
          style={{
            border: '1px solid var(--osint-primary-soft-border)',
            backgroundColor: LANDING_ACCENT_FILL,
          }}
        >
          <h2
            className="font-sans text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: 'var(--osint-text-heading)' }}
          >
            Start your first investigation
          </h2>
          <p
            className="mx-auto mt-4 max-w-lg text-sm leading-relaxed"
            style={{ color: 'var(--osint-text-muted)' }}
          >
            Add an API key — Gemini, OpenRouter, OpenAI, or Anthropic — and you&apos;re ready.
            Everything runs in your browser, right now.
          </p>
          <button
            onClick={onGetStarted}
            className="mt-8 inline-flex items-center gap-2.5 rounded-lg px-8 py-3 text-sm font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              backgroundColor: LANDING_ACCENT_FILL,
              border: '1px solid var(--osint-primary-soft-border)',
              color: 'var(--osint-primary)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = LANDING_ACCENT_FILL_STRONG;
              e.currentTarget.style.borderColor =
                'color-mix(in oklab, var(--osint-primary) 60%, transparent)';
              e.currentTarget.style.boxShadow = LANDING_ACCENT_GLOW;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = LANDING_ACCENT_FILL;
              e.currentTarget.style.borderColor = 'var(--osint-primary-soft-border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Open Workspace
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between border-t px-6 py-6 md:px-10"
        style={{
          borderColor: 'var(--osint-interaction-border)',
          color: 'var(--osint-text-quiet)',
        }}
      >
        <span className="text-xs font-mono tracking-wide">Sherlock · MIT License</span>
        <a
          href="https://github.com/jamesnavinhill/sherlock"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono tracking-wide transition-colors duration-200"
          style={{ color: 'var(--osint-text-quiet)' }}
        >
          GitHub
        </a>
      </footer>
      </div>
    </div>
  );
}
