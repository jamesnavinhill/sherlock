import {
  Bell,
  BookOpen,
  ChevronRight,
  Compass,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Network,
  Palette,
  PanelRight,
  Play,
  SearchCode,
  Settings2,
  Shapes,
  Sidebar,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Workbench } from './components/Workbench';
import {
  AccordionSection,
  MenuButton,
  SearchField,
  SegmentedTabs,
  SelectField,
  SurfaceCard,
  cx,
} from './components/primitives';
import { buildThemeCssVars } from './system/cssVars';
import { DEFAULT_THEME, cloneTheme, type StudioTheme } from './system/schema';

const STORAGE_KEY = 'canon-design-system-studio/v1';

type GalleryTab = 'shell' | 'navigation' | 'forms' | 'cards' | 'typography';

const GALLERY_TABS: Array<{ id: GalleryTab; label: string }> = [
  { id: 'shell', label: 'Shell' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'forms', label: 'Forms' },
  { id: 'cards', label: 'Cards' },
  { id: 'typography', label: 'Type' },
];

const SEARCH_ITEMS = [
  { label: 'Global Search', kind: 'Input' },
  { label: 'Sidebar Rail', kind: 'Shell' },
  { label: 'Inspector Accordion', kind: 'Panel' },
  { label: 'Toolbar Menus', kind: 'Navigation' },
  { label: 'Action Cards', kind: 'Surface' },
  { label: 'Type Workbench', kind: 'Typography' },
  { label: 'Radius Tokens', kind: 'Token' },
  { label: 'Background Variants', kind: 'Theme' },
];

const NAV_ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: Shapes },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'discover', label: 'Discovery', icon: LayoutDashboard },
];

const loadTheme = (): StudioTheme => {
  if (typeof window === 'undefined') {
    return cloneTheme(DEFAULT_THEME);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneTheme(DEFAULT_THEME);
  }

  try {
    return {
      ...cloneTheme(DEFAULT_THEME),
      ...JSON.parse(raw),
    } as StudioTheme;
  } catch {
    return cloneTheme(DEFAULT_THEME);
  }
};

const applyThemeToDocument = (theme: StudioTheme) => {
  const vars = buildThemeCssVars(theme);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);
  root.style.colorScheme = theme.mode;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export default function App() {
  const [theme, setThemeState] = useState<StudioTheme>(() => loadTheme());
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<GalleryTab>('shell');
  const [activeNav, setActiveNav] = useState('workspace');
  const [leftSection, setLeftSection] = useState<'library' | 'filters' | 'saved'>('library');
  const [rightSection, setRightSection] = useState<'details' | 'states' | 'tokens'>('details');

  const setTheme = (updater: (current: StudioTheme) => StudioTheme) => {
    setThemeState((current) => updater(current));
  };

  useEffect(() => {
    applyThemeToDocument(theme);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setWorkbenchOpen((current) => !current);
      }
      if (event.key === 'Escape') {
        setWorkbenchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sidebarItems = useMemo(() => NAV_ITEMS, []);

  return (
    <div className="ds-app-shell">
      <div className="ds-shell-layout">
        <aside className="ds-sidebar">
          <div className="ds-sidebar-brand">
            <div className="ds-brand-mark">
              <Palette size={24} />
            </div>
            <div>
              <div className="ds-meta-label">Design System</div>
              <div className="ds-title-inline">Canon Studio</div>
            </div>
          </div>

          <nav className="ds-sidebar-nav">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="ds-sidebar-nav-item"
                  data-active={activeNav === item.id ? 'true' : undefined}
                  onClick={() => setActiveNav(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ds-sidebar-footer">
            <button
              type="button"
              className="ds-sidebar-nav-item"
              onClick={() =>
                setTheme((current) => ({
                  ...current,
                  mode: current.mode === 'dark' ? 'light' : 'dark',
                }))
              }
            >
              <SlidersHorizontal size={18} />
              <span>{theme.mode === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              type="button"
              className="ds-sidebar-nav-item"
              onClick={() => setWorkbenchOpen((current) => !current)}
            >
              <Settings2 size={18} />
              <span>Workbench</span>
            </button>
          </div>
        </aside>

        <div className="ds-shell-main">
          <header className="ds-toolbar">
            <div className="ds-toolbar-group">
              <button type="button" className="ds-toolbar-icon-button">
                <Sidebar size={16} />
              </button>
              <button type="button" className="ds-primary-button">
                <Play size={16} />
                New
              </button>
              <SelectField
                value="workspace-a"
                onChange={() => undefined}
                options={[
                  { value: 'workspace-a', label: 'Operations Workspace' },
                  { value: 'workspace-b', label: 'Incident Desk' },
                ]}
                className="ds-toolbar-select"
              />
            </div>

            <div className="ds-toolbar-search">
              <SearchField
                items={SEARCH_ITEMS}
                itemLabel={(item) => item.label}
                itemKind={(item) => item.kind}
              />
            </div>

            <div className="ds-toolbar-group ds-toolbar-group-end">
              <MenuButton
                label="Open"
                items={[
                  { id: 'chat', label: 'Open Context Chat', description: 'Workspace handoff' },
                  { id: 'board', label: 'Open Board', description: 'Shell route handoff' },
                  { id: 'timeline', label: 'Open Timeline', description: 'Chronology handoff' },
                ]}
              />
              <MenuButton
                label="Export"
                items={[
                  { id: 'json', label: 'Export Token JSON', description: 'Portable config' },
                  { id: 'css', label: 'Export CSS Vars', description: 'Resolved theme surface' },
                  {
                    id: 'inventory',
                    label: 'Export Component Inventory',
                    description: 'Studio audit',
                  },
                ]}
              />
              <button type="button" className="ds-toolbar-icon-button">
                <PanelRight size={16} />
              </button>
            </div>
          </header>

          <div className="ds-shell-columns">
            <aside className="ds-rail ds-left-rail">
              <div className="ds-rail-header">
                <div>
                  <div className="ds-meta-label">Library</div>
                  <h2 className="ds-panel-title">Shell Inventory</h2>
                </div>
                <button type="button" className="ds-ghost-button">
                  <Compass size={15} />
                  Scope
                </button>
              </div>
              <div className="ds-rail-body">
                <AccordionSection
                  title="Core Shell"
                  isOpen={leftSection === 'library'}
                  onToggle={() => setLeftSection('library')}
                  meta="4"
                >
                  <button type="button" className="ds-list-item" data-active="true">
                    <Workflow size={16} />
                    <span className="ds-list-item-stack">
                      <span className="ds-title-inline">Toolbar + Search</span>
                      <span className="ds-body-quiet">Canon header treatment</span>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <button type="button" className="ds-list-item">
                    <Shapes size={16} />
                    <span className="ds-list-item-stack">
                      <span className="ds-title-inline">Sidebar + Rails</span>
                      <span className="ds-body-quiet">Pinned, independent shell regions</span>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                  <button type="button" className="ds-list-item">
                    <SearchCode size={16} />
                    <span className="ds-list-item-stack">
                      <span className="ds-title-inline">Menus + Selectors</span>
                      <span className="ds-body-quiet">Shared popover contract</span>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                </AccordionSection>
                <AccordionSection
                  title="Filters"
                  isOpen={leftSection === 'filters'}
                  onToggle={() => setLeftSection('filters')}
                  meta="5"
                >
                  <div className="ds-chip-grid">
                    {['Toolbars', 'Cards', 'Accordions', 'Menus', 'Tokens'].map((item) => (
                      <button key={item} type="button" className="ds-filter-chip">
                        {item}
                      </button>
                    ))}
                  </div>
                </AccordionSection>
                <AccordionSection
                  title="Saved Views"
                  isOpen={leftSection === 'saved'}
                  onToggle={() => setLeftSection('saved')}
                  meta="2"
                >
                  <div className="ds-panel-note">
                    <div className="ds-meta-label">Preview A</div>
                    <p className="ds-body-quiet">Current canon shell with default surfaces.</p>
                  </div>
                  <div className="ds-panel-note">
                    <div className="ds-meta-label">Preview B</div>
                    <p className="ds-body-quiet">
                      Archive preset with wider rails and softer radii.
                    </p>
                  </div>
                </AccordionSection>
              </div>
            </aside>

            <main className="ds-content">
              <div className="ds-content-header">
                <div>
                  <div className="ds-meta-label">Studio Page</div>
                  <h1 className="ds-title-page">Reusable shell and component canon</h1>
                  <p className="ds-body-copy">
                    One page for shells, rails, toolbars, menus, cards, selectors, search, type,
                    and token tuning. Press <span className="ds-keycap-inline">F1</span> to open
                    the workbench without blocking the page.
                  </p>
                </div>
                <div className="ds-hero-actions">
                  <button
                    type="button"
                    className="ds-primary-button"
                    onClick={() => setWorkbenchOpen((current) => !current)}
                  >
                    <Palette size={16} />
                    Open Workbench
                  </button>
                  <button type="button" className="ds-ghost-button">
                    <Sparkles size={16} />
                    Save Preset
                  </button>
                </div>
              </div>

              <div className="ds-main-tabs">
                <SegmentedTabs value={galleryTab} onChange={setGalleryTab} items={GALLERY_TABS} />
              </div>

              {galleryTab === 'shell' ? (
                <div className="ds-showcase-grid">
                  <SurfaceCard title="Toolbar Anatomy" eyebrow="Shell">
                    <div className="ds-toolbar-mini">
                      <button type="button" className="ds-toolbar-icon-button">
                        <FolderKanban size={16} />
                      </button>
                      <button type="button" className="ds-primary-button">
                        <Play size={16} />
                        New
                      </button>
                      <div className="ds-toolbar-spacer" />
                      <button type="button" className="ds-toolbar-button">
                        Open
                      </button>
                      <button type="button" className="ds-toolbar-button">
                        Export
                      </button>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Rail Behavior" eyebrow="Accordion">
                    <div className="ds-stack">
                      <div className="ds-panel-note">
                        <div className="ds-title-inline">Pinned sections</div>
                        <p className="ds-body-quiet">
                          One-open-at-a-time behavior keeps rails from developing double scroll
                          drift.
                        </p>
                      </div>
                      <div className="ds-panel-note">
                        <div className="ds-title-inline">Shared actions</div>
                        <p className="ds-body-quiet">
                          Action rows sit under headers, not inside random subsections.
                        </p>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Shell Tokens" eyebrow="Layout">
                    <div className="ds-token-pairs">
                      <div>
                        <div className="ds-meta-label">Sidebar</div>
                        <div className="ds-meta-value">{Math.round(theme.shell.sidebarWidth)}px</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Rail</div>
                        <div className="ds-meta-value">{Math.round(theme.shell.railWidth)}px</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Toolbar</div>
                        <div className="ds-meta-value">{Math.round(theme.shell.toolbarHeight)}px</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Radius</div>
                        <div className="ds-meta-value">{Math.round(theme.radii.panel)}px</div>
                      </div>
                    </div>
                  </SurfaceCard>
                </div>
              ) : null}

              {galleryTab === 'navigation' ? (
                <div className="ds-showcase-grid">
                  <SurfaceCard title="Navigation Items" eyebrow="Sidebar">
                    <div className="ds-stack">
                      {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="ds-list-item"
                            data-active={item.id === 'workspace' ? 'true' : undefined}
                          >
                            <Icon size={16} />
                            <span className="ds-title-inline">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Menus" eyebrow="Popover">
                    <div className="ds-toolbar-inline">
                      <MenuButton
                        label="Config"
                        items={[
                          {
                            id: 'appearance',
                            label: 'Appearance',
                            description: 'Theme + surfaces',
                          },
                          { id: 'layout', label: 'Layout', description: 'Rails + density' },
                          { id: 'export', label: 'Export', description: 'Tokens + inventory' },
                        ]}
                      />
                      <MenuButton
                        label="Selector"
                        items={[
                          {
                            id: 'classic',
                            label: 'Classic',
                            description: 'Default canon preset',
                          },
                          { id: 'graphite', label: 'Graphite', description: 'Neutral chrome' },
                          { id: 'archive', label: 'Archive', description: 'Paper daylight' },
                        ]}
                      />
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Search" eyebrow="Global">
                    <SearchField
                      items={SEARCH_ITEMS}
                      itemLabel={(item) => item.label}
                      itemKind={(item) => item.kind}
                    />
                  </SurfaceCard>
                </div>
              ) : null}

              {galleryTab === 'forms' ? (
                <div className="ds-showcase-grid">
                  <SurfaceCard title="Selectors" eyebrow="Inputs">
                    <div className="ds-grid-two">
                      <SelectField
                        label="Workspace"
                        value="workspace-a"
                        onChange={() => undefined}
                        options={[
                          { value: 'workspace-a', label: 'Operations Workspace' },
                          { value: 'workspace-b', label: 'Incident Desk' },
                        ]}
                      />
                      <SelectField
                        label="Surface Preset"
                        value="classic"
                        onChange={() => undefined}
                        options={[
                          { value: 'classic', label: 'Classic' },
                          { value: 'graphite', label: 'Graphite' },
                          { value: 'terminal', label: 'Terminal' },
                        ]}
                      />
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Buttons + Filters" eyebrow="Controls">
                    <div className="ds-stack">
                      <div className="ds-toolbar-inline">
                        <button type="button" className="ds-primary-button">
                          <Sparkles size={16} />
                          Primary
                        </button>
                        <button type="button" className="ds-ghost-button">
                          Secondary
                        </button>
                        <button type="button" className="ds-toolbar-button">
                          Toolbar
                        </button>
                      </div>
                      <div className="ds-chip-grid">
                        {['Compact', 'Default', 'Wide', 'Archive'].map((item, index) => (
                          <button
                            key={item}
                            type="button"
                            className="ds-filter-chip"
                            data-active={index === 1 ? 'true' : undefined}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Action Rows" eyebrow="Inspector">
                    <div className="ds-toolbar-inline ds-wrap">
                      <button type="button" className="ds-toolbar-button">
                        <BookOpen size={14} />
                        Summary
                      </button>
                      <button type="button" className="ds-toolbar-button">
                        <Shapes size={14} />
                        Add To Board
                      </button>
                      <button type="button" className="ds-toolbar-button">
                        <MessageSquare size={14} />
                        Open Chat
                      </button>
                    </div>
                  </SurfaceCard>
                </div>
              ) : null}

              {galleryTab === 'cards' ? (
                <div className="ds-showcase-grid">
                  <SurfaceCard title="Nested Action Card" eyebrow="Card">
                    <div className="ds-action-card">
                      <div className="ds-action-card-header">
                        <div>
                          <div className="ds-title-inline">Artifact summary treatment</div>
                          <p className="ds-body-quiet">
                            Reusable nested item anatomy for boards, chat context, and details.
                          </p>
                        </div>
                        <Bell size={16} />
                      </div>
                      <div className="ds-chip-grid">
                        <span className="ds-inline-chip">Library</span>
                        <span className="ds-inline-chip">Inspector</span>
                        <span className="ds-inline-chip">Reusable</span>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="State Cards" eyebrow="Surface">
                    <div className="ds-state-grid">
                      <div className="ds-state-card">
                        <span className="ds-meta-label">Default</span>
                        <span className="ds-body-quiet">Resting surface</span>
                      </div>
                      <div className="ds-state-card" data-tone="hover">
                        <span className="ds-meta-label">Hover</span>
                        <span className="ds-body-quiet">Interaction hover</span>
                      </div>
                      <div className="ds-state-card" data-tone="active">
                        <span className="ds-meta-label">Active</span>
                        <span className="ds-body-quiet">Selection state</span>
                      </div>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Empty State" eyebrow="Feedback">
                    <div className="ds-empty-state-card">
                      <FileSearch size={24} />
                      <div className="ds-title-inline">No components filtered out</div>
                      <p className="ds-body-quiet">
                        Use the workbench to change surfaces, typography, or shell geometry.
                      </p>
                    </div>
                  </SurfaceCard>
                </div>
              ) : null}

              {galleryTab === 'typography' ? (
                <div className="ds-showcase-grid ds-showcase-grid-wide">
                  <SurfaceCard title="Type Hierarchy" eyebrow="Typography">
                    <div className="ds-type-stack">
                      <div className="ds-type-eyebrow">Operational System</div>
                      <h2 className="ds-type-display">
                        Signal review stays sharp without becoming decorative.
                      </h2>
                      <p className="ds-type-body">
                        The studio keeps Sherlock’s voice: controlled, editorial, and serious.
                        Typeface tuning is family-specific, so the selected fonts carry their own
                        spacing and weight adjustments without flooding the UI with unused sliders.
                      </p>
                      <pre className="ds-type-mono">
                        <code>{`surface=panel\nvariant=${theme.background.variant}\nmode=${theme.mode}`}</code>
                      </pre>
                    </div>
                  </SurfaceCard>

                  <SurfaceCard title="Assignments" eyebrow="Current">
                    <div className="ds-token-pairs">
                      <div>
                        <div className="ds-meta-label">UI</div>
                        <div className="ds-meta-value">{theme.typography.ui}</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Display</div>
                        <div className="ds-meta-value">{theme.typography.display}</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Label</div>
                        <div className="ds-meta-value">{theme.typography.label}</div>
                      </div>
                      <div>
                        <div className="ds-meta-label">Mono</div>
                        <div className="ds-meta-value">{theme.typography.mono}</div>
                      </div>
                    </div>
                  </SurfaceCard>
                </div>
              ) : null}
            </main>

            <aside className={cx('ds-rail ds-right-rail', workbenchOpen && 'ds-right-rail-offset')}>
              <div className="ds-rail-header">
                <div>
                  <div className="ds-meta-label">Inspector</div>
                  <h2 className="ds-panel-title">Canon Notes</h2>
                </div>
                <button type="button" className="ds-ghost-button">
                  <Palette size={15} />
                  Tokens
                </button>
              </div>
              <div className="ds-rail-body">
                <AccordionSection
                  title="Details"
                  isOpen={rightSection === 'details'}
                  onToggle={() => setRightSection('details')}
                  meta="3"
                >
                  <div className="ds-panel-note">
                    <div className="ds-title-inline">Separate app</div>
                    <p className="ds-body-quiet">
                      Self-contained directory with no Sherlock imports or routing dependencies.
                    </p>
                  </div>
                  <div className="ds-panel-note">
                    <div className="ds-title-inline">Non-blocking workbench</div>
                    <p className="ds-body-quiet">
                      `F1` opens the tuning drawer without covering the main page with a modal
                      backdrop.
                    </p>
                  </div>
                </AccordionSection>
                <AccordionSection
                  title="States"
                  isOpen={rightSection === 'states'}
                  onToggle={() => setRightSection('states')}
                  meta="4"
                >
                  <div className="ds-chip-grid">
                    {['Default', 'Hover', 'Active', 'Selected'].map((item) => (
                      <span key={item} className="ds-inline-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </AccordionSection>
                <AccordionSection
                  title="Tokens"
                  isOpen={rightSection === 'tokens'}
                  onToggle={() => setRightSection('tokens')}
                  meta="live"
                >
                  <div className="ds-token-pairs">
                    <div>
                      <div className="ds-meta-label">Mode</div>
                      <div className="ds-meta-value">{theme.mode}</div>
                    </div>
                    <div>
                      <div className="ds-meta-label">Background</div>
                      <div className="ds-meta-value">{theme.background.variant}</div>
                    </div>
                    <div>
                      <div className="ds-meta-label">Accent</div>
                      <div className="ds-meta-value">
                        {Math.round(theme.accent.hue)} / {theme.accent.chroma.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <div className="ds-meta-label">Radii</div>
                      <div className="ds-meta-value">{Math.round(theme.radii.panel)}px</div>
                    </div>
                  </div>
                </AccordionSection>
              </div>
            </aside>
          </div>
        </div>

        <Workbench
          isOpen={workbenchOpen}
          onClose={() => setWorkbenchOpen(false)}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    </div>
  );
}
