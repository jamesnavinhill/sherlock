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
import { useEffect, useState } from 'react';

import { Workbench } from './components/Workbench';
import {
  AccordionSection,
  ActionCard,
  Badge,
  Button,
  ChatComposer,
  ChatTranscript,
  EmptyStateCard,
  IconButton,
  MenuButton,
  MetricGrid,
  ModalDialog,
  PageShell,
  PanelNote,
  PanelRail,
  PopoverButton,
  ResponsiveGrid,
  SearchField,
  SegmentedTabs,
  SelectField,
  SidebarNav,
  SurfaceCard,
  ToolbarBar,
  ToolbarCluster,
  useExclusiveDisclosure,
  type TranscriptMessage,
} from './components/canon';
import { buildThemeCssVars } from './system/cssVars';
import { DEFAULT_THEME, cloneTheme, type StudioTheme } from './system/schema';

const STORAGE_KEY = 'canon-design-system-studio/v1';

type GalleryTab =
  | 'shell'
  | 'navigation'
  | 'controls'
  | 'surfaces'
  | 'conversation'
  | 'typography';

const GALLERY_TABS: Array<{ id: GalleryTab; label: string }> = [
  { id: 'shell', label: 'Shell' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'controls', label: 'Controls' },
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'typography', label: 'Type' },
];

const SEARCH_ITEMS: Array<{ label: string; kind: string; tab: GalleryTab }> = [
  { label: 'Page Shell', kind: 'Shell', tab: 'shell' },
  { label: 'Panel Rail', kind: 'Navigation', tab: 'navigation' },
  { label: 'Toolbar Menus', kind: 'Navigation', tab: 'navigation' },
  { label: 'Modal Dialog', kind: 'Controls', tab: 'controls' },
  { label: 'Action Cards', kind: 'Surface', tab: 'surfaces' },
  { label: 'Chat Composer', kind: 'Conversation', tab: 'conversation' },
  { label: 'Transcript', kind: 'Conversation', tab: 'conversation' },
  { label: 'Typography Hierarchy', kind: 'Type', tab: 'typography' },
];

const NAV_ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: Shapes },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'discover', label: 'Discovery', icon: LayoutDashboard },
];

const WORKSPACE_OPTIONS = [
  {
    value: 'workspace-a',
    label: 'Operations Workspace',
    description: 'Canonical shell sample',
  },
  {
    value: 'workspace-b',
    label: 'Incident Desk',
    description: 'Tighter rail density',
  },
];

const SURFACE_OPTIONS = [
  { value: 'classic', label: 'Classic', description: 'Balanced default canon' },
  { value: 'graphite', label: 'Graphite', description: 'Neutral chrome' },
  { value: 'archive', label: 'Archive', description: 'Paper-lean daylight surfaces' },
];

const TRANSCRIPT_MESSAGES: TranscriptMessage[] = [
  {
    id: 'assistant-1',
    role: 'assistant',
    meta: '2 min ago',
    tags: ['Workspace', 'Inspector', 'Reusable'],
    body: (
      <p>
        The extracted system is stable enough to turn into actual app-facing components now. The
        biggest wins are the shared shell, the generalized rail contract, and making every
        disclosure surface operate the same way on desktop and mobile.
      </p>
    ),
    sections: [
      {
        id: 'sources',
        label: 'Linked Context',
        meta: '3',
        defaultOpen: true,
        content:
          'Toolbar anatomy, rail section treatment, and transcript actions now all point back to the same component set instead of one-off page markup.',
      },
      {
        id: 'follow-up',
        label: 'Next Slice',
        meta: '2',
        content:
          'Extract the canon package once the shell, overlays, and conversation components are stable across the reference pages.',
      },
    ],
    actions: [
      { id: 'save', label: 'Save Draft', icon: <BookOpen size={14} /> },
      { id: 'append', label: 'Append To Spec', icon: <FileSearch size={14} /> },
      { id: 'launch', label: 'Follow-up Run', icon: <Play size={14} /> },
    ],
  },
  {
    id: 'user-1',
    role: 'user',
    meta: '1 min ago',
    body: (
      <p>
        Make the design system reusable enough that Sherlock can treat it as the canon reference
        before we move it into its own package.
      </p>
    ),
  },
  {
    id: 'system-1',
    role: 'system',
    meta: 'Updating live',
    status: 'streaming',
    body: (
      <p>
        Workbench and rail tokens are still available while the shell stays interactive. This
        preserves the non-blocking tuning workflow.
      </p>
    ),
  },
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
  const [workspaceId, setWorkspaceId] = useState('workspace-a');
  const [surfacePreset, setSurfacePreset] = useState('classic');
  const [composerValue, setComposerValue] = useState(
    'Compare the strongest signal clusters against the last artifact summary and call out the missing evidence.'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'sidebar' | 'left' | 'right' | null>(null);
  const [leftRailPinnedOpen, setLeftRailPinnedOpen] = useState(true);
  const [rightRailPinnedOpen, setRightRailPinnedOpen] = useState(true);

  const leftSections = useExclusiveDisclosure<'inventory' | 'filters' | 'saved'>('inventory');
  const rightSections = useExclusiveDisclosure<'details' | 'states' | 'tokens'>('details');
  const controlSections = useExclusiveDisclosure<'accordion' | 'modal' | 'mobile'>('accordion');

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
        setModalOpen(false);
        setMobilePanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const configurationPanel = (
    <div className="ds-stack ds-popover-stack">
      <PanelNote title="Shell Geometry">
        One toolbar, one general rail, and one page shell contract are carrying both library and
        inspector patterns now.
      </PanelNote>
      <MetricGrid
        items={[
          { label: 'Sidebar', value: `${Math.round(theme.shell.sidebarWidth)}px` },
          { label: 'Rail', value: `${Math.round(theme.shell.railWidth)}px` },
          { label: 'Toolbar', value: `${Math.round(theme.shell.toolbarHeight)}px` },
          { label: 'Radius', value: `${Math.round(theme.radii.panel)}px` },
        ]}
      />
      <div className="ds-chip-grid">
        <Badge variant="accent">Mobile Remap</Badge>
        <Badge variant="outline">Reusable Toolbar</Badge>
        <Badge variant="outline">Shared Rail</Badge>
      </div>
    </div>
  );

  return (
    <>
      <PageShell
        sidebar={
          <SidebarNav
            brandIcon={<Palette size={24} />}
            brandEyebrow="Design System"
            brandTitle="Canon Studio"
            brandSubtitle="Portable reference app for the extracted shell and component language."
            items={NAV_ITEMS}
            activeId={activeNav}
            onSelect={setActiveNav}
            mobileOpen={mobilePanel === 'sidebar'}
            onCloseMobile={() => setMobilePanel(null)}
            footer={
              <>
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
                  <span>{theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  type="button"
                  className="ds-sidebar-nav-item"
                  onClick={() => setWorkbenchOpen((current) => !current)}
                >
                  <Settings2 size={18} />
                  <span>Workbench</span>
                </button>
              </>
            }
          />
        }
        toolbar={
          <ToolbarBar
            leading={
              <>
                <IconButton
                  className="ds-mobile-only"
                  label="Open navigation"
                  icon={<Sidebar size={16} />}
                  onClick={() => setMobilePanel('sidebar')}
                />
                <IconButton
                  className="ds-mobile-only"
                  label="Open library rail"
                  icon={<FolderKanban size={16} />}
                  onClick={() => setMobilePanel('left')}
                />
                <IconButton
                  className="ds-desktop-only"
                  label={leftRailPinnedOpen ? 'Hide library rail' : 'Show library rail'}
                  icon={<FolderKanban size={16} />}
                  active={leftRailPinnedOpen}
                  onClick={() => setLeftRailPinnedOpen((current) => !current)}
                />
                <Button variant="primary" leadingIcon={<Play size={16} />}>
                  New Pattern
                </Button>
                <SelectField
                  value={workspaceId}
                  onChange={setWorkspaceId}
                  options={WORKSPACE_OPTIONS}
                  className="ds-toolbar-select"
                />
              </>
            }
            center={
              <SearchField
                items={SEARCH_ITEMS}
                itemLabel={(item) => item.label}
                itemKind={(item) => item.kind}
                onSelect={(item) => setGalleryTab(item.tab)}
              />
            }
            trailing={
              <ToolbarCluster className="ds-wrap">
                <PopoverButton
                  label="Configure"
                  leadingIcon={<SlidersHorizontal size={14} />}
                  panelClassName="ds-toolbar-popover"
                >
                  {configurationPanel}
                </PopoverButton>
                <MenuButton
                  label="Export"
                  items={[
                    {
                      id: 'json',
                      label: 'Export Token JSON',
                      description: 'Portable token contract',
                      icon: <BookOpen size={14} />,
                    },
                    {
                      id: 'css',
                      label: 'Export CSS Vars',
                      description: 'Resolved runtime variables',
                      icon: <Workflow size={14} />,
                    },
                    {
                      id: 'inventory',
                      label: 'Export Component Inventory',
                      description: 'Canon coverage snapshot',
                      icon: <SearchCode size={14} />,
                    },
                  ]}
                />
                <Button
                  variant="ghost"
                  className="ds-desktop-only"
                  leadingIcon={<Palette size={16} />}
                  onClick={() => setWorkbenchOpen((current) => !current)}
                >
                  Workbench
                </Button>
                <IconButton
                  className="ds-mobile-only"
                  label="Open inspector rail"
                  icon={<PanelRight size={16} />}
                  onClick={() => setMobilePanel('right')}
                />
                <IconButton
                  className="ds-desktop-only"
                  label={rightRailPinnedOpen ? 'Hide inspector rail' : 'Show inspector rail'}
                  icon={<PanelRight size={16} />}
                  active={rightRailPinnedOpen}
                  onClick={() => setRightRailPinnedOpen((current) => !current)}
                />
              </ToolbarCluster>
            }
          />
        }
        leftRail={
          <PanelRail
            placement="left"
            pinnedOpen={leftRailPinnedOpen}
            mobileOpen={mobilePanel === 'left'}
            eyebrow="Library Rail"
            title="System Inventory"
            subtitle="One rail component handling both browse and inspect roles."
            actions={
              <Button variant="ghost" size="sm" leadingIcon={<Compass size={14} />}>
                Scope
              </Button>
            }
            onCloseMobile={() => setMobilePanel(null)}
          >
            <AccordionSection
              title="Inventory"
              meta="6"
              isOpen={leftSections.isOpen('inventory')}
              onToggle={() => leftSections.toggle('inventory')}
            >
              <button type="button" className="ds-list-item" data-active="true">
                <Workflow size={16} />
                <span className="ds-list-item-stack">
                  <span className="ds-title-inline">Page Shell</span>
                  <span className="ds-body-quiet">
                    Reusable app frame with mobile drawer remap.
                  </span>
                </span>
                <ChevronRight size={15} />
              </button>
              <button type="button" className="ds-list-item">
                <FolderKanban size={16} />
                <span className="ds-list-item-stack">
                  <span className="ds-title-inline">Rails</span>
                  <span className="ds-body-quiet">
                    Left library and right inspector share one canon component.
                  </span>
                </span>
                <ChevronRight size={15} />
              </button>
              <button type="button" className="ds-list-item">
                <SearchCode size={16} />
                <span className="ds-list-item-stack">
                  <span className="ds-title-inline">Menus + Selectors</span>
                  <span className="ds-body-quiet">
                    Unified popover contract for actions and configuration.
                  </span>
                </span>
                <ChevronRight size={15} />
              </button>
            </AccordionSection>

            <AccordionSection
              title="Filters"
              meta="5"
              isOpen={leftSections.isOpen('filters')}
              onToggle={() => leftSections.toggle('filters')}
            >
              <div className="ds-chip-grid">
                {['Shell', 'Toolbars', 'Rails', 'Conversation', 'Typography'].map((item) => (
                  <button key={item} type="button" className="ds-filter-chip">
                    {item}
                  </button>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection
              title="Saved Views"
              meta="2"
              isOpen={leftSections.isOpen('saved')}
              onToggle={() => leftSections.toggle('saved')}
            >
              <PanelNote title="Shell Coverage" meta={<Badge variant="accent">Current</Badge>}>
                Page shell, rails, toolbar, buttons, badges, selectors, modal, composer,
                transcript, and accordions are all now represented as canon components.
              </PanelNote>
              <PanelNote title="Next Export">
                Once the reference project settles, the `canon` folder can move out as the package
                seed without Sherlock runtime imports.
              </PanelNote>
            </AccordionSection>
          </PanelRail>
        }
        rightRail={
          <PanelRail
            placement="right"
            pinnedOpen={rightRailPinnedOpen}
            mobileOpen={mobilePanel === 'right'}
            eyebrow="Inspector Rail"
            title="Canon Notes"
            subtitle="Shared disclosure, state, and token reference."
            className={workbenchOpen ? 'ds-right-rail-offset' : undefined}
            actions={
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Palette size={14} />}
                onClick={() => setWorkbenchOpen((current) => !current)}
              >
                Tokens
              </Button>
            }
            onCloseMobile={() => setMobilePanel(null)}
          >
            <AccordionSection
              title="Details"
              meta="3"
              isOpen={rightSections.isOpen('details')}
              onToggle={() => rightSections.toggle('details')}
            >
              <PanelNote title="General Rail">
                One `PanelRail` handles library and inspector placement, which keeps the shell canon
                smaller and easier to export.
              </PanelNote>
              <PanelNote title="Working Collapsibles">
                The studio now uses shared toggle hooks, so the rail sections and component demo
                accordions can actually open and close.
              </PanelNote>
            </AccordionSection>

            <AccordionSection
              title="States"
              meta="4"
              isOpen={rightSections.isOpen('states')}
              onToggle={() => rightSections.toggle('states')}
            >
              <div className="ds-chip-grid">
                {['Default', 'Hover', 'Active', 'Pinned'].map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection
              title="Tokens"
              meta="Live"
              isOpen={rightSections.isOpen('tokens')}
              onToggle={() => rightSections.toggle('tokens')}
            >
              <MetricGrid
                items={[
                  { label: 'Mode', value: theme.mode },
                  { label: 'Background', value: theme.background.variant },
                  {
                    label: 'Accent',
                    value: `${Math.round(theme.accent.hue)} / ${theme.accent.chroma.toFixed(3)}`,
                  },
                  { label: 'Radius', value: `${Math.round(theme.radii.panel)}px` },
                ]}
              />
            </AccordionSection>
          </PanelRail>
        }
        leftRailPinnedOpen={leftRailPinnedOpen}
        rightRailPinnedOpen={rightRailPinnedOpen}
        overlayOpen={mobilePanel !== null}
        onDismissOverlay={() => setMobilePanel(null)}
        floatingContent={
          <Workbench
            isOpen={workbenchOpen}
            onClose={() => setWorkbenchOpen(false)}
            theme={theme}
            setTheme={setTheme}
          />
        }
      >
        <div className="ds-content-header">
          <div>
            <div className="ds-meta-label">Studio Page</div>
            <h1 className="ds-title-page">Reusable shell and component canon</h1>
            <p className="ds-body-copy">
              The studio is now exercising actual system components instead of one large hand-built
              mock page. Rails, toolbar controls, badges, modals, conversation surfaces, and
              disclosures all flow through the same canon layer. Press{' '}
              <span className="ds-keycap-inline">F1</span> to open the workbench without blocking
              the main page.
            </p>
          </div>
          <div className="ds-hero-actions">
            <Button
              variant="primary"
              leadingIcon={<Palette size={16} />}
              onClick={() => setWorkbenchOpen((current) => !current)}
            >
              Open Workbench
            </Button>
            <Button
              variant="ghost"
              leadingIcon={<Sparkles size={16} />}
              onClick={() => setModalOpen(true)}
            >
              Review Modal
            </Button>
          </div>
        </div>

        <div className="ds-main-tabs">
          <SegmentedTabs value={galleryTab} onChange={setGalleryTab} items={GALLERY_TABS} />
        </div>

        {galleryTab === 'shell' ? (
          <ResponsiveGrid>
            <SurfaceCard title="Page Shell" eyebrow="Layout" actions={<Badge variant="accent">Canon</Badge>}>
              <PanelNote title="One shell contract">
                `PageShell` now owns the sidebar, toolbar, left rail, right rail, content region,
                mobile backdrop, and floating workbench slot.
              </PanelNote>
              <PanelNote title="Toolbar stays shared">
                `ToolbarBar` and `ToolbarCluster` give us one header anatomy for search, selectors,
                menus, and page actions across different surfaces.
              </PanelNote>
            </SurfaceCard>

            <SurfaceCard title="Layout Tokens" eyebrow="Geometry">
              <MetricGrid
                items={[
                  { label: 'Sidebar', value: `${Math.round(theme.shell.sidebarWidth)}px` },
                  { label: 'Rail', value: `${Math.round(theme.shell.railWidth)}px` },
                  { label: 'Toolbar', value: `${Math.round(theme.shell.toolbarHeight)}px` },
                  { label: 'Content', value: `${Math.round(theme.shell.contentWidth)}px` },
                ]}
              />
            </SurfaceCard>

            <SurfaceCard title="Responsive Remap" eyebrow="Mobile">
              <PanelNote title="Drawer behavior" meta={<Badge variant="outline">New</Badge>}>
                Sidebar and both rails remap into overlay drawers on smaller screens instead of
                disappearing. The content column keeps its own width and scroll behavior.
              </PanelNote>
              <PanelNote title="Natural card sizing">
                Showcase grids now auto-fit cards and align items to the top so taller sections no
                longer stretch unrelated cards into awkward heights.
              </PanelNote>
            </SurfaceCard>
          </ResponsiveGrid>
        ) : null}

        {galleryTab === 'navigation' ? (
          <ResponsiveGrid>
            <SurfaceCard title="Sidebar Navigation" eyebrow="Sidebar">
              <div className="ds-stack">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="ds-list-item"
                      data-active={item.id === activeNav ? 'true' : undefined}
                    >
                      <Icon size={16} />
                      <span className="ds-title-inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SurfaceCard>

            <SurfaceCard title="Toolbar Actions" eyebrow="Header">
              <ToolbarCluster className="ds-wrap">
                <Button variant="primary" leadingIcon={<Play size={16} />}>
                  New
                </Button>
                <MenuButton
                  label="Open"
                  items={[
                    {
                      id: 'chat',
                      label: 'Open Context Chat',
                      description: 'Route handoff into conversation',
                      icon: <MessageSquare size={14} />,
                    },
                    {
                      id: 'board',
                      label: 'Open Board',
                      description: 'Shared launch route',
                      icon: <Shapes size={14} />,
                    },
                    {
                      id: 'timeline',
                      label: 'Open Timeline',
                      description: 'Chronology handoff',
                      icon: <Workflow size={14} />,
                    },
                  ]}
                />
                <PopoverButton
                  label="Config"
                  leadingIcon={<SlidersHorizontal size={14} />}
                  panelClassName="ds-toolbar-popover"
                >
                  {configurationPanel}
                </PopoverButton>
              </ToolbarCluster>
            </SurfaceCard>

            <SurfaceCard title="General Rail" eyebrow="Panel">
              <PanelNote title="Shared anatomy">
                Header, action slot, body scroll, disclosure groups, and mobile close affordance all
                live in `PanelRail`.
              </PanelNote>
              <PanelNote title="Role-specific content">
                Library and inspector surfaces stay different through their children and actions, not
                through separate shell implementations.
              </PanelNote>
            </SurfaceCard>
          </ResponsiveGrid>
        ) : null}

        {galleryTab === 'controls' ? (
          <ResponsiveGrid>
            <SurfaceCard title="Buttons + Badges" eyebrow="Inputs">
              <div className="ds-stack">
                <ToolbarCluster className="ds-wrap">
                  <Button variant="primary" leadingIcon={<Sparkles size={16} />}>
                    Primary
                  </Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="toolbar" leadingIcon={<BookOpen size={14} />}>
                    Toolbar
                  </Button>
                </ToolbarCluster>
                <div className="ds-chip-grid">
                  <Badge variant="accent">Accent</Badge>
                  <Badge>Neutral</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Selectors + Tabs" eyebrow="Navigation">
              <div className="ds-stack">
                <SelectField
                  label="Surface Preset"
                  value={surfacePreset}
                  onChange={setSurfacePreset}
                  options={SURFACE_OPTIONS}
                />
                <SegmentedTabs
                  value={galleryTab}
                  onChange={setGalleryTab}
                  items={GALLERY_TABS}
                  stretch
                />
              </div>
            </SurfaceCard>

            <SurfaceCard title="Popouts + Modal" eyebrow="Overlays">
              <div className="ds-stack">
                <PopoverButton
                  label="Open Configuration Popout"
                  variant="secondary"
                  leadingIcon={<Settings2 size={14} />}
                  align="start"
                  panelClassName="ds-toolbar-popover"
                >
                  {configurationPanel}
                </PopoverButton>
                <Button
                  variant="ghost"
                  leadingIcon={<Bell size={16} />}
                  onClick={() => setModalOpen(true)}
                >
                  Open Modal Review
                </Button>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Working Accordions" eyebrow="Disclosure">
              <div className="ds-stack">
                <AccordionSection
                  title="Accordion Contract"
                  meta="Open"
                  isOpen={controlSections.isOpen('accordion')}
                  onToggle={() => controlSections.toggle('accordion')}
                >
                  The shared disclosure component now uses real toggle state, so section bodies can
                  open and close instead of staying stuck open.
                </AccordionSection>
                <AccordionSection
                  title="Modal + Popout Coordination"
                  meta="Overlay"
                  isOpen={controlSections.isOpen('modal')}
                  onToggle={() => controlSections.toggle('modal')}
                >
                  Popouts use one dismissable-layer contract, while modals keep a separate blocking
                  layer with keyboard dismissal.
                </AccordionSection>
                <AccordionSection
                  title="Mobile Shell Behavior"
                  meta="Remap"
                  isOpen={controlSections.isOpen('mobile')}
                  onToggle={() => controlSections.toggle('mobile')}
                >
                  Mobile uses overlay drawers for navigation and panels so important surface areas do
                  not disappear when the layout collapses.
                </AccordionSection>
              </div>
            </SurfaceCard>
          </ResponsiveGrid>
        ) : null}

        {galleryTab === 'surfaces' ? (
          <ResponsiveGrid>
            <SurfaceCard title="Action Cards" eyebrow="Cards">
              <div className="ds-stack">
                <ActionCard
                  title="Artifact Summary Treatment"
                  description="Nested item anatomy for boards, chat context, and inspector highlights."
                  meta={<Bell size={16} />}
                >
                  <div className="ds-chip-grid">
                    <Badge>Library</Badge>
                    <Badge variant="outline">Inspector</Badge>
                    <Badge variant="outline">Reusable</Badge>
                  </div>
                </ActionCard>
                <ActionCard
                  title="Section Safety"
                  description="Cards now size to their own content naturally instead of stretching each row."
                  meta={<FolderKanban size={16} />}
                />
              </div>
            </SurfaceCard>

            <SurfaceCard title="State Cards" eyebrow="Surface">
              <div className="ds-state-grid">
                <div className="ds-state-card">
                  <span className="ds-meta-label">Default</span>
                  <span className="ds-body-quiet">Resting surface treatment</span>
                </div>
                <div className="ds-state-card" data-tone="hover">
                  <span className="ds-meta-label">Hover</span>
                  <span className="ds-body-quiet">Interaction hover state</span>
                </div>
                <div className="ds-state-card" data-tone="active">
                  <span className="ds-meta-label">Active</span>
                  <span className="ds-body-quiet">Selection and focus state</span>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Empty State" eyebrow="Feedback">
              <EmptyStateCard
                icon={<FileSearch size={24} />}
                title="No components filtered out"
                description="Use search, tabs, or the workbench to move through the canon inventory."
                actions={
                  <Button variant="toolbar" leadingIcon={<SearchCode size={14} />}>
                    Clear Filters
                  </Button>
                }
              />
            </SurfaceCard>
          </ResponsiveGrid>
        ) : null}

        {galleryTab === 'conversation' ? (
          <div className="ds-conversation-showcase">
            <SurfaceCard title="Transcript" eyebrow="Conversation" className="ds-conversation-main">
              <ChatTranscript messages={TRANSCRIPT_MESSAGES} />
            </SurfaceCard>

            <SurfaceCard title="Composer" eyebrow="Input">
              <ChatComposer
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={() => setComposerValue('')}
                placeholder="Ask for a comparison, summary, next-step plan, or evidence review..."
                leadingActions={[
                  { id: 'attach', label: 'Attach', icon: <FolderKanban size={14} /> },
                  { id: 'prompt', label: 'Prompt Library', icon: <BookOpen size={14} /> },
                ]}
                contextTags={[
                  { id: 'workspace', label: 'Operations Workspace', meta: 'Workspace' },
                  { id: 'artifact', label: 'April Signal Review', meta: 'Artifact' },
                ]}
                footerNote="Composer, transcript, and transcript disclosures are all reusable canon components now."
              />
            </SurfaceCard>
          </div>
        ) : null}

        {galleryTab === 'typography' ? (
          <ResponsiveGrid className="ds-showcase-grid-wide">
            <SurfaceCard title="Type Hierarchy" eyebrow="Typography">
              <div className="ds-type-stack">
                <div className="ds-type-eyebrow">Operational System</div>
                <h2 className="ds-type-display">
                  Signal review stays sharp without becoming decorative.
                </h2>
                <p className="ds-type-body">
                  The extracted system keeps Sherlock&apos;s editorial, controlled tone, but the
                  typography settings are now surfaced through reusable cards and selectors instead
                  of buried in page-specific markup.
                </p>
                <pre className="ds-type-mono">
                  <code>{`surface=${surfacePreset}\nvariant=${theme.background.variant}\nmode=${theme.mode}`}</code>
                </pre>
              </div>
            </SurfaceCard>

            <SurfaceCard title="Assignments" eyebrow="Current">
              <MetricGrid
                items={[
                  { label: 'UI', value: theme.typography.ui },
                  { label: 'Display', value: theme.typography.display },
                  { label: 'Label', value: theme.typography.label },
                  { label: 'Mono', value: theme.typography.mono },
                ]}
              />
            </SurfaceCard>
          </ResponsiveGrid>
        ) : null}
      </PageShell>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Modal"
        title="Component Review"
        description="Use the modal contract for focused decision points, not for the workbench or the main page shell."
        actions={
          <ToolbarCluster className="ds-modal-actions">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Keep Editing
            </Button>
            <Button
              variant="primary"
              leadingIcon={<Sparkles size={16} />}
              onClick={() => setModalOpen(false)}
            >
              Approve Canon
            </Button>
          </ToolbarCluster>
        }
      >
        <div className="ds-stack">
          <PanelNote title="Reusable modal shell">
            Title, description, body, footer actions, Escape dismissal, and click-away dismissal are
            now all part of one component instead of ad hoc page overlays.
          </PanelNote>
          <PanelNote title="Non-blocking workbench">
            The workbench intentionally stays out of this modal system so it can remain docked and
            non-blocking while the page shell stays interactive.
          </PanelNote>
        </div>
      </ModalDialog>
    </>
  );
}
