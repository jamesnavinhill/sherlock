import {
  Bell,
  BookOpen,
  ChevronRight,
  Compass,
  Download,
  FileSearch,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Network,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  SearchCode,
  Settings2,
  Shapes,
  Sidebar,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
  Workflow,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  AccordionSection,
  ActionCard,
  Badge,
  Button,
  ChatComposer,
  ChatTranscript,
  EmptyStateCard,
  MenuButton,
  MetricGrid,
  ModalDialog,
  OverlayPanel,
  OverlaySection,
  PageShell,
  PanelNote,
  PanelRail,
  PopoverButton,
  RangeField,
  ResponsiveGrid,
  SearchField,
  SegmentedTabs,
  NavTabs,
  SelectField,
  SidebarNav,
  SurfaceCard,
  ToolbarBar,
  ToolbarCluster,
  Workbench,
  WorkflowDialog,
  useExclusiveDisclosure,
  useDisclosureSet,
  type TranscriptMessage,
} from './components/canon';
import { buildThemeCssVars } from './system/cssVars';
import {
  DEFAULT_THEME,
  cloneTheme,
  createDefaultGraphs,
  type StudioTheme,
} from './system/schema';

const STORAGE_KEY = 'canon-design-system-studio/v1';
const SHELL_OVERLAY_QUERY = '(max-width: 1180px)';
const LEGACY_RADIUS_DEFAULTS = {
  shell: 0,
  panel: 16,
  control: 12,
  pill: 999,
} as const;
const PREVIOUS_RADIUS_DEFAULTS = {
  shell: 5,
  panel: 5,
  control: 5,
  pill: 5,
} as const;
const PREVIOUS_SHELL_DEFAULTS = {
  sidebarWidth: 248,
  railWidth: 320,
  toolbarHeight: 78,
  contentWidth: 980,
  density: 1,
  surfaceOpacity: 1,
} as const;

const hasLegacyRadiusDefaults = (radii: Partial<StudioTheme['radii']> | undefined) =>
  radii?.shell === LEGACY_RADIUS_DEFAULTS.shell &&
  radii?.panel === LEGACY_RADIUS_DEFAULTS.panel &&
  radii?.control === LEGACY_RADIUS_DEFAULTS.control &&
  radii?.pill === LEGACY_RADIUS_DEFAULTS.pill;

const hasPreviousRadiusDefaults = (radii: Partial<StudioTheme['radii']> | undefined) =>
  radii?.shell === PREVIOUS_RADIUS_DEFAULTS.shell &&
  radii?.panel === PREVIOUS_RADIUS_DEFAULTS.panel &&
  radii?.control === PREVIOUS_RADIUS_DEFAULTS.control &&
  radii?.pill === PREVIOUS_RADIUS_DEFAULTS.pill;

const hasPreviousShellDefaults = (shell: Partial<StudioTheme['shell']> | undefined) =>
  shell?.sidebarWidth === PREVIOUS_SHELL_DEFAULTS.sidebarWidth &&
  shell?.railWidth === PREVIOUS_SHELL_DEFAULTS.railWidth &&
  shell?.toolbarHeight === PREVIOUS_SHELL_DEFAULTS.toolbarHeight &&
  shell?.contentWidth === PREVIOUS_SHELL_DEFAULTS.contentWidth &&
  shell?.density === PREVIOUS_SHELL_DEFAULTS.density &&
  shell?.surfaceOpacity === PREVIOUS_SHELL_DEFAULTS.surfaceOpacity;

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
      return () => mediaQuery.removeEventListener('change', update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, [query]);

  return matches;
};

type GalleryTab = 'shell' | 'navigation' | 'controls' | 'surfaces' | 'conversation' | 'typography';

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
  { label: 'Configuration Panel', kind: 'Overlay', tab: 'controls' },
  { label: 'Modal Dialog', kind: 'Controls', tab: 'controls' },
  { label: 'Workflow Dialog', kind: 'Overlay', tab: 'controls' },
  { label: 'Action Cards', kind: 'Surface', tab: 'surfaces' },
  { label: 'Chat Composer', kind: 'Conversation', tab: 'conversation' },
  { label: 'Transcript', kind: 'Conversation', tab: 'conversation' },
  { label: 'Typography Hierarchy', kind: 'Type', tab: 'typography' },
];

const FLOW_OUTPUT_OPTIONS = [
  { id: 'artifact', label: 'Artifact' },
  { id: 'brief', label: 'Brief' },
] as const;

const FLOW_DEPTH_OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'deep', label: 'Deep' },
] as const;

const NAV_ITEMS = [
  { id: 'workspace', label: 'Workspace', icon: Shapes },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'discover', label: 'Discovery', icon: LayoutDashboard },
];

const WORKSPACE_OPTIONS = [
  {
    value: 'workspace-a',
    label: 'Workspace',
  },
  {
    value: 'workspace-b',
    label: 'Incident Desk',
  },
];

/* Redundant SURFACE_OPTIONS removed in favor of independent mode tuning in Workbench */

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
        Make the design system reusable enough that the application can treat it as the canon reference
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
    const parsed = JSON.parse(raw) as Partial<StudioTheme>;
    const nextTheme = cloneTheme(DEFAULT_THEME);

    return {
      ...nextTheme,
      ...parsed,
      surfaces: {
        dark: { ...nextTheme.surfaces.dark, ...parsed.surfaces?.dark },
        light: { ...nextTheme.surfaces.light, ...parsed.surfaces?.light },
      },
      graphs: parsed.graphs ?? createDefaultGraphs(parsed.accent ?? nextTheme.accent),
      shell: hasPreviousShellDefaults(parsed.shell)
        ? { ...nextTheme.shell }
        : { ...nextTheme.shell, ...parsed.shell },
      radii:
        hasLegacyRadiusDefaults(parsed.radii) || hasPreviousRadiusDefaults(parsed.radii)
          ? { ...nextTheme.radii }
          : { ...nextTheme.radii, ...parsed.radii, shell: nextTheme.radii.shell },
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
  const isOverlayShell = useMediaQuery(SHELL_OVERLAY_QUERY);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [theme, setThemeState] = useState<StudioTheme>(() => loadTheme());
  const [toolbarOffset, setToolbarOffset] = useState(DEFAULT_THEME.shell.toolbarHeight);
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<GalleryTab>('shell');
  const [activeNav, setActiveNav] = useState('workspace');
  const [workspaceId, setWorkspaceId] = useState('workspace-a');
  const [composerValue, setComposerValue] = useState(
    'Compare the strongest signal clusters against the last artifact summary and call out the missing evidence.'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [flowOutput, setFlowOutput] =
    useState<(typeof FLOW_OUTPUT_OPTIONS)[number]['id']>('artifact');
  const [flowDepth, setFlowDepth] = useState<(typeof FLOW_DEPTH_OPTIONS)[number]['id']>('deep');
  const [flowReviewBudget, setFlowReviewBudget] = useState(72);
  const [mobilePanel, setMobilePanel] = useState<'sidebar' | 'left' | 'right' | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftRailPinnedOpen, setLeftRailPinnedOpen] = useState(false);
  const [rightRailPinnedOpen, setRightRailPinnedOpen] = useState(false);

  const leftSections = useExclusiveDisclosure<'inventory' | 'filters' | 'saved'>(null);
  const rightSections = useExclusiveDisclosure<'details' | 'states' | 'tokens'>(null);
  const controlSections = useExclusiveDisclosure<'accordion' | 'modal' | 'mobile'>(null);
  
  const inventoryItems = useDisclosureSet<'pageShell' | 'rails' | 'menus'>();
  const savedItems = useDisclosureSet<'coverage' | 'export'>();
  const detailItems = useDisclosureSet<'generalRail' | 'collapsibles'>();

  const setTheme = (updater: (current: StudioTheme) => StudioTheme) => {
    setThemeState((current) => updater(current));
  };

  useEffect(() => {
    applyThemeToDocument(theme);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    const toolbarNode = toolbarRef.current;
    if (!toolbarNode || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setToolbarOffset(Math.ceil(entry.contentRect.height));
      }
    });

    observer.observe(toolbarNode);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setWorkbenchOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setWorkbenchOpen(false);
        setModalOpen(false);
        setWorkflowOpen(false);
        setMobilePanel(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setMobilePanel(null);
  }, [isOverlayShell]);

  const toggleOverlayPanel = (panel: 'sidebar' | 'left' | 'right') => {
    setMobilePanel((current) => (current === panel ? null : panel));
  };

  const toggleSidebar = () => {
    if (isOverlayShell) {
      toggleOverlayPanel('sidebar');
      return;
    }

    setSidebarCollapsed((current) => !current);
  };

  const toggleLeftRail = () => {
    if (isOverlayShell) {
      toggleOverlayPanel('left');
      return;
    }

    setLeftRailPinnedOpen((current) => !current);
  };

  const toggleRightRail = () => {
    if (isOverlayShell) {
      toggleOverlayPanel('right');
      return;
    }

    setRightRailPinnedOpen((current) => !current);
  };

  const sidebarToggleLabel = isOverlayShell
    ? mobilePanel === 'sidebar'
      ? 'Close navigation'
      : 'Open navigation'
    : sidebarCollapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar';

  const leftRailToggleLabel = isOverlayShell
    ? mobilePanel === 'left'
      ? 'Close library rail'
      : 'Open library rail'
    : leftRailPinnedOpen
      ? 'Hide library rail'
      : 'Show library rail';

  const rightRailToggleLabel = isOverlayShell
    ? mobilePanel === 'right'
      ? 'Close inspector rail'
      : 'Open inspector rail'
    : rightRailPinnedOpen
      ? 'Hide inspector rail'
      : 'Show inspector rail';

  const configurationPanel = ({ close }: { close: () => void }) => (
    <OverlayPanel
      title="Workbench Configuration"
      onClose={close}
      footer={
        <div className="ds-overlay-actions">
          <div className="ds-toolbar-inline ds-flex-end ds-fill">
            <Button variant="secondary" onClick={() => setThemeState(cloneTheme(DEFAULT_THEME))}>
              Reset Studio
            </Button>
            <Button variant="primary" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="ds-overlay-grid">

        <OverlaySection title="Shell Geometry">
          <RangeField
            label="Sidebar Width"
            value={theme.shell.sidebarWidth}
            min={208}
            max={320}
            step={8}
            format={(value) => `${Math.round(value)}px`}
            onChange={(value) =>
              setTheme((current) => ({
                ...current,
                shell: { ...current.shell, sidebarWidth: value },
              }))
            }
          />
          <RangeField
            label="Rail Width"
            value={theme.shell.railWidth}
            min={272}
            max={420}
            step={8}
            format={(value) => `${Math.round(value)}px`}
            onChange={(value) =>
              setTheme((current) => ({
                ...current,
                shell: { ...current.shell, railWidth: value },
              }))
            }
          />
          <RangeField
            label="Toolbar Height"
            value={theme.shell.toolbarHeight}
            min={64}
            max={110}
            step={2}
            format={(value) => `${Math.round(value)}px`}
            onChange={(value) =>
              setTheme((current) => ({
                ...current,
                shell: { ...current.shell, toolbarHeight: value },
              }))
            }
          />
        </OverlaySection>
      </div>
    </OverlayPanel>
  );

  return (
    <>
      <PageShell
        sidebar={
          <SidebarNav
            brandIcon={<Palette size={16} />}
            brandTitle="Canon Studio"
            brandPressLabel={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onBrandPress={!isOverlayShell ? toggleSidebar : undefined}
            items={NAV_ITEMS}
            activeId={activeNav}
            onSelect={setActiveNav}
            collapsed={!isOverlayShell && sidebarCollapsed}
            mobileOpen={mobilePanel === 'sidebar'}
            onCloseMobile={isOverlayShell ? () => setMobilePanel(null) : undefined}
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
                  {theme.mode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  <span className="ds-sidebar-nav-item-label">
                    {theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
                <button
                  type="button"
                  className="ds-sidebar-nav-item"
                  onClick={() => setWorkbenchOpen((current) => !current)}
                >
                  <Settings2 size={18} />
                  <span className="ds-sidebar-nav-item-label">Workbench</span>
                </button>
              </>
            }
          />
        }
        toolbar={
          <div ref={toolbarRef}>
            <ToolbarBar
              leading={
                <>
                  <Button
                    variant="secondary"
                    aria-label={leftRailPinnedOpen ? "Close Library Rail" : "Open Library Rail"}
                    onClick={toggleLeftRail}
                    data-active={leftRailPinnedOpen ? 'true' : undefined}
                    leadingIcon={leftRailPinnedOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                    className="ds-toolbar-rail-toggle"
                  />
                  <ToolbarCluster className="ds-toolbar-cluster-main">
                    <Button
                      variant="primary"
                      aria-label="New Pattern"
                    >
                      New +
                    </Button>
                    <SelectField
                      value={workspaceId}
                      onChange={setWorkspaceId}
                      options={WORKSPACE_OPTIONS}
                      className="ds-toolbar-select ds-toolbar-primary-select"
                    />
                  </ToolbarCluster>
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
                <>
                  <ToolbarCluster className="ds-toolbar-cluster-actions">
                    <PopoverButton
                      leadingIcon={<SlidersHorizontal size={14} />}
                      triggerClassName="ds-toolbar-responsive-control"
                      panelClassName="ds-toolbar-popover"
                      aria-label="Configure"
                      label=""
                    >
                      {configurationPanel}
                    </PopoverButton>
                    <MenuButton
                      leadingIcon={<Download size={14} />}
                      triggerClassName="ds-toolbar-responsive-control"
                      panelClassName="ds-toolbar-popover"
                      aria-label="Export"
                      label=""
                      items={[
                        {
                          id: 'json',
                          label: 'Export Token JSON',
                          icon: <BookOpen size={14} />,
                        },
                        {
                          id: 'css',
                          label: 'Export CSS Vars',
                          icon: <Workflow size={14} />,
                        },
                        {
                          id: 'inventory',
                          label: 'Export Component Inventory',
                          icon: <SearchCode size={14} />,
                        },
                      ]}
                    />
                  </ToolbarCluster>
                  <Button
                    variant="secondary"
                    aria-label={rightRailPinnedOpen ? "Close Workbench" : "Open Workbench"}
                    onClick={toggleRightRail}
                    data-active={rightRailPinnedOpen ? 'true' : undefined}
                    leadingIcon={rightRailPinnedOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    className="ds-toolbar-rail-toggle"
                  />
                </>
              }
            />
          </div>
        }
        leftRail={
          <PanelRail
            placement="left"
            pinnedOpen={leftRailPinnedOpen}
            mobileOpen={mobilePanel === 'left'}
            eyebrow="Library Rail"
            title="System Inventory"
            actions={
              <Button variant="ghost" size="sm" leadingIcon={<Compass size={14} />}>
                Scope
              </Button>
            }
            onCloseMobile={isOverlayShell ? () => setMobilePanel(null) : undefined}
          >
            <AccordionSection
              title="Inventory"
              meta="6"
              isOpen={leftSections.isOpen('inventory')}
              onToggle={() => leftSections.toggle('inventory')}
            >
              <AccordionSection
                variant="nested"
                title="Page Shell"
                icon={<Workflow size={16} />}
                isOpen={inventoryItems.isOpen('pageShell')}
                onToggle={() => inventoryItems.toggle('pageShell')}
              >
                <div className="ds-body-quiet">
                  Reusable app frame with mobile drawer remap.
                </div>
              </AccordionSection>
              
              <AccordionSection
                variant="nested"
                title="Rails"
                icon={<FolderKanban size={16} />}
                isOpen={inventoryItems.isOpen('rails')}
                onToggle={() => inventoryItems.toggle('rails')}
              >
                <div className="ds-body-quiet">
                  Left library and right inspector share one canon component.
                </div>
              </AccordionSection>
              
              <AccordionSection
                variant="nested"
                title="Menus + Selectors"
                icon={<SearchCode size={16} />}
                isOpen={inventoryItems.isOpen('menus')}
                onToggle={() => inventoryItems.toggle('menus')}
              >
                <div className="ds-body-quiet">
                  Unified popover contract for actions and configuration.
                </div>
              </AccordionSection>
            </AccordionSection>

            <AccordionSection
              title="Filters"
              meta="5"
              isOpen={leftSections.isOpen('filters')}
              onToggle={() => leftSections.toggle('filters')}
            >
              <div className="ds-stack-sm">
                {['Shell', 'Toolbars', 'Rails', 'Conversation', 'Typography'].map((item) => (
                  <button key={item} type="button" className="ds-list-item ds-list-item-sm">
                    <span className="ds-title-inline">{item}</span>
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
              <AccordionSection
                variant="nested"
                title="Shell Coverage"
                meta={<Badge variant="accent">Current</Badge>}
                isOpen={savedItems.isOpen('coverage')}
                onToggle={() => savedItems.toggle('coverage')}
              >
                <div className="ds-body-quiet">
                  Page shell, rails, toolbar, buttons, badges, selectors, modal, composer, transcript,
                  and accordions are all now represented as canon components.
                </div>
              </AccordionSection>
              <AccordionSection
                variant="nested"
                title="Next Export"
                isOpen={savedItems.isOpen('export')}
                onToggle={() => savedItems.toggle('export')}
              >
                <div className="ds-body-quiet">
                  Once the reference project settles, the `canon` folder can move out as the package
                  seed without Sherlock runtime imports.
                </div>
              </AccordionSection>
            </AccordionSection>
          </PanelRail>
        }
        rightRail={
          <PanelRail
            placement="right"
            pinnedOpen={rightRailPinnedOpen}
            mobileOpen={mobilePanel === 'right'}
            eyebrow="Tuning Rail"
            title="Workbench"
            className={workbenchOpen && !isOverlayShell ? 'ds-right-rail-offset' : undefined}
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
            onCloseMobile={isOverlayShell ? () => setMobilePanel(null) : undefined}
          >
            <AccordionSection
              title="Details"
              meta="3"
              isOpen={rightSections.isOpen('details')}
              onToggle={() => rightSections.toggle('details')}
            >
              <AccordionSection
                variant="nested"
                title="General Rail"
                isOpen={detailItems.isOpen('generalRail')}
                onToggle={() => detailItems.toggle('generalRail')}
              >
                <div className="ds-body-quiet">
                  One `PanelRail` handles library and inspector placement, which keeps the shell canon
                  smaller and easier to export.
                </div>
              </AccordionSection>
              <AccordionSection
                variant="nested"
                title="Working Collapsibles"
                isOpen={detailItems.isOpen('collapsibles')}
                onToggle={() => detailItems.toggle('collapsibles')}
              >
                <div className="ds-body-quiet">
                  The studio now uses shared toggle hooks, so the rail sections and component demo
                  accordions can actually open and close.
                </div>
              </AccordionSection>
            </AccordionSection>

            <AccordionSection
              title="States"
              meta="4"
              isOpen={rightSections.isOpen('states')}
              onToggle={() => rightSections.toggle('states')}
            >
              <div className="ds-stack-sm">
                {['Default', 'Hover', 'Active', 'Pinned'].map((item) => (
                  <button key={item} type="button" className="ds-list-item ds-list-item-sm">
                    <span className="ds-title-inline">{item}</span>
                  </button>
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
        sidebarCollapsed={sidebarCollapsed}
        leftRailPinnedOpen={leftRailPinnedOpen}
        rightRailPinnedOpen={rightRailPinnedOpen}
        overlayOpen={isOverlayShell && mobilePanel !== null}
        onDismissOverlay={() => setMobilePanel(null)}
        toolbarOffset={toolbarOffset}
        floatingContent={
          <Workbench
            isOpen={workbenchOpen}
            onClose={() => setWorkbenchOpen(false)}
            theme={theme}
            setTheme={setTheme}
          />
        }
      >
        <div className="ds-page-layout">

          <div className="ds-page-main">
            <div className="ds-content-header ds-main-tabs">
              <NavTabs value={galleryTab} onChange={setGalleryTab} items={GALLERY_TABS} />
            </div>

            <div className="ds-page-title-section ds-stack-sm">
              <div className="ds-meta-label">Studio Page</div>
              <h1 className="ds-title-page">Reusable shell and component canon</h1>
            </div>

            {galleryTab === 'shell' ? (
              <ResponsiveGrid>
                <SurfaceCard
                  title="Page Shell"
                  eyebrow="Layout"
                  actions={<Badge variant="accent">Canon</Badge>}
                >
                  <PanelNote title="One shell contract">
                    `PageShell` now owns the sidebar, toolbar, left rail, right rail, content
                    region, mobile backdrop, and floating workbench slot.
                  </PanelNote>
                  <PanelNote title="Toolbar stays shared">
                    `ToolbarBar` and `ToolbarCluster` give us one header anatomy for search,
                    selectors, menus, and page actions across different surfaces.
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
                    Showcase grids now auto-fit cards and align items to the top so taller sections
                    no longer stretch unrelated cards into awkward heights.
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
                          icon: <MessageSquare size={14} />,
                        },
                        {
                          id: 'board',
                          label: 'Open Board',
                          icon: <Shapes size={14} />,
                        },
                        {
                          id: 'timeline',
                          label: 'Open Timeline',
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
                    Header, action slot, body scroll, disclosure groups, and mobile close affordance
                    all live in `PanelRail`.
                  </PanelNote>
                  <PanelNote title="Role-specific content">
                    Library and inspector surfaces stay different through their children and
                    actions, not through separate shell implementations.
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
                      label="Active Workspace"
                      value={workspaceId}
                      onChange={setWorkspaceId}
                      options={WORKSPACE_OPTIONS}
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
                    <ToolbarCluster className="ds-wrap">
                      <Button
                        variant="ghost"
                        leadingIcon={<Workflow size={16} />}
                        onClick={() => setWorkflowOpen(true)}
                      >
                        Open Workflow Dialog
                      </Button>
                      <Button
                        variant="secondary"
                        leadingIcon={<Bell size={16} />}
                        onClick={() => setModalOpen(true)}
                      >
                        Open Review Modal
                      </Button>
                    </ToolbarCluster>
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
                      The shared disclosure component now uses real toggle state, so section bodies
                      can open and close instead of staying stuck open.
                    </AccordionSection>
                    <AccordionSection
                      title="Modal + Popout Coordination"
                      meta="Overlay"
                      isOpen={controlSections.isOpen('modal')}
                      onToggle={() => controlSections.toggle('modal')}
                    >
                      Popouts use one dismissable-layer contract, while modals keep a separate
                      blocking layer with keyboard dismissal.
                    </AccordionSection>
                    <AccordionSection
                      title="Mobile Shell Behavior"
                      meta="Remap"
                      isOpen={controlSections.isOpen('mobile')}
                      onToggle={() => controlSections.toggle('mobile')}
                    >
                      Mobile uses overlay drawers for navigation and panels so important surface
                      areas do not disappear when the layout collapses.
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
                <SurfaceCard
                  title="Context Chat"
                  eyebrow="Conversation"
                  className="ds-conversation-main"
                  actions={<Badge variant="accent">Combined View</Badge>}
                >
                  <div className="ds-chat-layout-combined ds-stack">
                    <ChatTranscript messages={TRANSCRIPT_MESSAGES} />
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
                  </div>
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
                      typography settings are now surfaced through reusable cards and selectors
                      instead of buried in page-specific markup.
                    </p>
                    <pre className="ds-type-mono">
                      <code>{`accent=${Math.round(theme.accent.hue)}\nvariant=${theme.background.variant}\nmode=${theme.mode}`}</code>
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
          </div>

        </div>
      </PageShell>

      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow="Modal"
        title="Component Review"
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
      />

      <WorkflowDialog
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        eyebrow="Workflow"
        title="Start Artifact Flow"
        actions={<Badge variant="accent">Structured Launch</Badge>}
        footer={
          <div className="ds-overlay-actions">
            <div className="ds-chip-grid">
              <Badge variant="outline">Workspace {workspaceId === 'workspace-a' ? 'A' : 'B'}</Badge>
              <Badge variant="outline">
                {flowDepth === 'deep' ? 'Deep Review' : 'Standard Review'}
              </Badge>
            </div>
            <ToolbarCluster className="ds-wrap">
              <Button variant="secondary" onClick={() => setWorkflowOpen(false)}>
                Keep Editing
              </Button>
              <Button
                variant="primary"
                leadingIcon={<Play size={16} />}
                onClick={() => setWorkflowOpen(false)}
              >
                Start Flow
              </Button>
            </ToolbarCluster>
          </div>
        }
        sidebar={
          <div className="ds-stack">
            <OverlaySection title="Launch Summary" tone="accent">
              <MetricGrid
                items={[
                  {
                    label: 'Workspace',
                    value: workspaceId === 'workspace-a' ? 'Operations' : 'Incident',
                  },
                  { label: 'Output', value: flowOutput === 'artifact' ? 'Artifact' : 'Brief' },
                  { label: 'Depth', value: flowDepth === 'deep' ? 'Deep' : 'Standard' },
                  { label: 'Budget', value: `${flowReviewBudget}%` },
                ]}
              />
            </OverlaySection>
          </div>
        }
      >
        <div className="ds-overlay-grid ds-overlay-grid-split">
          <OverlaySection title="Launch Context">
            <SelectField
              label="Workspace"
              value={workspaceId}
              onChange={setWorkspaceId}
              options={WORKSPACE_OPTIONS}
            />
            <div className="ds-stack">
              <span className="ds-meta-label">Delivery Shape</span>
              <SegmentedTabs
                value={flowOutput}
                onChange={setFlowOutput}
                items={FLOW_OUTPUT_OPTIONS}
                stretch
              />
            </div>
          </OverlaySection>
        </div>

        <OverlaySection title="Evidence Settings">
          <div className="ds-stack">
            <span className="ds-meta-label">Investigation Depth</span>
            <SegmentedTabs
              value={flowDepth}
              onChange={setFlowDepth}
              items={FLOW_DEPTH_OPTIONS}
              stretch
            />
          </div>
          <RangeField
            label="Review Budget"
            value={flowReviewBudget}
            min={30}
            max={100}
            step={5}
            format={(value) => `${value}%`}
            onChange={setFlowReviewBudget}
          />
        </OverlaySection>
      </WorkflowDialog>
    </>
  );
}
