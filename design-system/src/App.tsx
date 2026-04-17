import {
  Bell,
  BookOpen,
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
  SlidersHorizontal,
  Sparkles,
  Sun,
  Moon,
  Workflow,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
  AccordionSection,
  ActionCard,
  Badge,
  Button,
  ChatComposer,
  ChatTranscript,
  ContentSection,
  ConfigPanel,
  ConfigPanelSection,
  CodeBlock,
  DateRangePicker,
  EmptyStateCard,
  Eyebrow,
  Heading,
  ListActionGroup,
  MenuButton,
  MetricGrid,
  ModalDialog,
  OptionGroup,
  PageShell,
  PanelNote,
  PanelRail,
  PopoverButton,
  RangeField,
  RailSectionTree,
  ResponsiveGrid,
  SearchField,
  SegmentedTabs,
  NavTabs,
  SelectField,
  SidebarAction,
  SidebarNav,
  SurfaceCard,
  Text,
  Toast,
  ToastStack,
  ToolbarBar,
  ToolbarCluster,
  Workbench,
  WorkflowDialog,
  useExclusiveDisclosure,
  type DateRangePreset,
  type DateRangeValue,
  type RailSectionNode,
  type ToastTone,
  type TranscriptMessage,
} from './components/canon';
import { buildThemeCssText, buildThemeCssVars } from './system/cssVars';
import {
  DEFAULT_THEME,
  cloneTheme,
  type StudioTheme,
} from './system/schema';

const STORAGE_KEY = 'canon-design-system-studio/v4';
const SHELL_OVERLAY_QUERY = '(max-width: 1180px)';

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
  { label: 'Toast Stack', kind: 'Feedback', tab: 'surfaces' },
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

const CONTROL_DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    id: 'last-7',
    label: 'Last 7d',
    range: { start: '2026-04-10', end: '2026-04-16' },
  },
  {
    id: 'last-30',
    label: 'Last 30d',
    range: { start: '2026-03-18', end: '2026-04-16' },
  },
];

type ToastPreviewItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description: string;
  meta: string;
  icon: ReactNode;
  actionLabel: string;
};

const createToastPreviewItems = (): ToastPreviewItem[] => [
  {
    id: 'canon-export',
    tone: 'graph-1',
    title: 'Canon export ready',
    description: 'Shared dialog widths and toast surfaces are aligned for the next packaging pass.',
    meta: 'Graph 1',
    icon: <Download size={16} />,
    actionLabel: 'Inspect',
  },
  {
    id: 'feedback-layer',
    tone: 'graph-2',
    title: 'Feedback layer updated',
    description:
      'Notifications now live in the shared surfaces family instead of relying on page-local markup.',
    meta: 'Graph 2',
    icon: <Bell size={16} />,
    actionLabel: 'Open Surface',
  },
  {
    id: 'modal-shape',
    tone: 'graph-3',
    title: 'Modal rhythm tightened',
    description:
      'Standard modals now bias toward a narrower, more vertical review shape while the workflow dialog stays wide.',
    meta: 'Graph 3',
    icon: <Compass size={16} />,
    actionLabel: 'Compare',
  },
  {
    id: 'workflow-ready',
    tone: 'graph-4',
    title: 'Workflow path preserved',
    description:
      'The wide structured dialog remains available for launches, approvals, and multi-step configuration flows.',
    meta: 'Graph 4',
    icon: <Workflow size={16} />,
    actionLabel: 'View Flow',
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
        The canon system is stable enough to serve as actual app-facing product code now. The
        biggest wins are the shared shell, the generalized rail contract, and making every
        disclosure surface behave the same way on desktop and mobile.
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
    return cloneTheme(JSON.parse(raw) as StudioTheme);
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
  const [workbenchPlacement, setWorkbenchPlacement] = useState<'left' | 'right'>('right');
  const [galleryTab, setGalleryTab] = useState<GalleryTab>('shell');
  const [activeNav, setActiveNav] = useState('workspace');
  const [workspaceId, setWorkspaceId] = useState('workspace-a');
  const [composerValue, setComposerValue] = useState(
    'Compare the strongest signal clusters against the last artifact summary and call out the missing evidence.'
  );
  const [toastPreviewItems, setToastPreviewItems] = useState<ToastPreviewItem[]>(() =>
    createToastPreviewItems()
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modelessModalOpen, setModelessModalOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [flowOutput, setFlowOutput] =
    useState<(typeof FLOW_OUTPUT_OPTIONS)[number]['id']>('artifact');
  const [flowDepth, setFlowDepth] = useState<(typeof FLOW_DEPTH_OPTIONS)[number]['id']>('deep');
  const [flowReviewBudget, setFlowReviewBudget] = useState(72);
  const [controlsDateRange, setControlsDateRange] = useState<DateRangeValue>({
    start: '2026-04-10',
    end: '2026-04-16',
  });
  const [controlChromeChoice, setControlChromeChoice] = useState('glass');
  const [controlBehaviorTags, setControlBehaviorTags] = useState<string[]>([
    'selected',
    'removable',
  ]);
  const [mobilePanel, setMobilePanel] = useState<'sidebar' | 'left' | 'right' | 'utility' | null>(
    null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leftRailPinnedOpen, setLeftRailPinnedOpen] = useState(false);
  const [rightRailPinnedOpen, setRightRailPinnedOpen] = useState(false);

  const controlSections = useExclusiveDisclosure<'accordion' | 'modal' | 'mobile'>(null);

  const setTheme = (updater: (current: StudioTheme) => StudioTheme) => {
    setThemeState((current) => updater(current));
  };

  const resetToastPreviewItems = () => {
    setToastPreviewItems(createToastPreviewItems());
  };

  const copyText = async (text: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // The studio can still prove menu wiring even if clipboard access is unavailable.
    }
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
        setModelessModalOpen(false);
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

  const toggleOverlayPanel = (panel: 'sidebar' | 'left' | 'right' | 'utility') => {
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

  const toggleWorkbench = () => {
    if (isOverlayShell) {
      toggleOverlayPanel('utility');
      return;
    }

    setWorkbenchOpen((current) => !current);
  };

  const closeWorkbench = () => {
    if (isOverlayShell) {
      setMobilePanel((current) => (current === 'utility' ? null : current));
      return;
    }

    setWorkbenchOpen(false);
  };

  const libraryRailSections: RailSectionNode[] = [
    {
      id: 'inventory',
      title: 'Inventory',
      meta: '6',
      sections: [
        {
          id: 'page-shell',
          title: 'Page Shell',
          icon: <Workflow size={16} />,
          content: (
            <Text as="div" variant="quiet">
              Reusable app frame with mobile drawer remap.
            </Text>
          ),
        },
        {
          id: 'rails',
          title: 'Rails',
          icon: <FolderKanban size={16} />,
          content: (
            <Text as="div" variant="quiet">
              Left library and right inspector share one canon component.
            </Text>
          ),
        },
        {
          id: 'menus',
          title: 'Menus + Selectors',
          icon: <SearchCode size={16} />,
          content: (
            <Text as="div" variant="quiet">
              Unified popover contract for actions and configuration.
            </Text>
          ),
        },
      ],
    },
    {
      id: 'filters',
      title: 'Filters',
      meta: '5',
      content: (
        <ListActionGroup
          compact
          items={['Shell', 'Toolbars', 'Rails', 'Conversation', 'Typography'].map((item) => ({
            id: item.toLowerCase(),
            label: item,
          }))}
        />
      ),
    },
    {
      id: 'saved',
      title: 'Saved Views',
      meta: '2',
      sections: [
        {
          id: 'coverage',
          title: 'Shell Coverage',
          meta: <Badge variant="accent">Current</Badge>,
          content: (
            <Text as="div" variant="quiet">
              Page shell, rails, toolbar, buttons, badges, selectors, modal, composer, transcript,
              and accordions are all now represented as canon components.
            </Text>
          ),
        },
        {
          id: 'export',
          title: 'Next Export',
          content: (
            <Text as="div" variant="quiet">
              Once the reference project settles, the `canon` folder can move out as the package
              seed without application runtime imports.
            </Text>
          ),
        },
      ],
    },
  ];

  const inspectorRailSections: RailSectionNode[] = [
    {
      id: 'details',
      title: 'Details',
      meta: '3',
      sections: [
        {
          id: 'general-rail',
          title: 'General Rail',
          content: (
            <Text as="div" variant="quiet">
              One `PanelRail` handles library and inspector placement, which keeps the shell canon
              smaller and easier to export.
            </Text>
          ),
        },
        {
          id: 'collapsibles',
          title: 'Working Collapsibles',
          content: (
            <Text as="div" variant="quiet">
              The studio now uses shared toggle hooks, so the rail sections and reference
              accordions can actually open and close.
            </Text>
          ),
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      meta: '4',
      content: (
        <ListActionGroup
          compact
          items={['Default', 'Hover', 'Active', 'Pinned'].map((item) => ({
            id: item.toLowerCase(),
            label: item,
          }))}
        />
      ),
    },
    {
      id: 'tokens',
      title: 'Tokens',
      meta: 'Live',
      content: (
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
      ),
    },
  ];

  const configurationPanel = ({ close }: { close: () => void }) => (
    <ConfigPanel
      title="Workbench Configuration"
      onClose={close}
      onReset={() => setThemeState(cloneTheme(DEFAULT_THEME))}
    >
      <ConfigPanelSection title="Shell Geometry">
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
          label="Utility Width"
          value={theme.shell.utilityWidth}
          min={320}
          max={520}
          step={8}
          format={(value) => `${Math.round(value)}px`}
          onChange={(value) =>
            setTheme((current) => ({
              ...current,
              shell: { ...current.shell, utilityWidth: value },
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
      </ConfigPanelSection>
    </ConfigPanel>
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
                <SidebarAction
                  icon={theme.mode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  label={theme.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  onClick={() =>
                    setTheme((current) => ({
                      ...current,
                      mode: current.mode === 'dark' ? 'light' : 'dark',
                    }))
                  }
                />
                <SidebarAction
                  icon={<Settings2 size={18} />}
                  label="Workbench"
                  onClick={toggleWorkbench}
                />
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
                    <DateRangePicker
                      value={controlsDateRange}
                      onChange={setControlsDateRange}
                      presets={CONTROL_DATE_RANGE_PRESETS}
                      layout="inline"
                      triggerVariant="icon"
                      triggerLabel="Filter date range"
                      align="end"
                    />
                    <PopoverButton
                      leadingIcon={<SlidersHorizontal size={14} />}
                      triggerClassName="ds-toolbar-responsive-control"
                      aria-label="Configure"
                      label=""
                    >
                      {configurationPanel}
                    </PopoverButton>
                    <MenuButton
                      leadingIcon={<Download size={14} />}
                      triggerClassName="ds-toolbar-responsive-control"
                      aria-label="Export"
                      label=""
                      items={[
                        {
                          id: 'json',
                          label: 'Export Token JSON',
                          icon: <BookOpen size={14} />,
                          onSelect: () => void copyText(JSON.stringify(theme, null, 2)),
                        },
                        {
                          id: 'css',
                          label: 'Export CSS Vars',
                          icon: <Workflow size={14} />,
                          onSelect: () => void copyText(buildThemeCssText(theme)),
                        },
                        {
                          id: 'inventory',
                          label: 'Export Component Inventory',
                          icon: <SearchCode size={14} />,
                          onSelect: () => setGalleryTab('controls'),
                        },
                      ]}
                    />
                  </ToolbarCluster>
                  <Button
                    variant="secondary"
                    aria-label={rightRailPinnedOpen ? 'Close Inspector' : 'Open Inspector'}
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
              <Button variant="secondary" size="compact" leadingIcon={<Compass size={14} />}>
                Scope
              </Button>
            }
            onCloseMobile={isOverlayShell ? () => setMobilePanel(null) : undefined}
          >
            <RailSectionTree sections={libraryRailSections} />
          </PanelRail>
        }
        rightRail={
          <PanelRail
            placement="right"
            pinnedOpen={rightRailPinnedOpen}
            mobileOpen={mobilePanel === 'right'}
            eyebrow="Inspector Rail"
            title="Inspector"
            actions={
              <Button
                variant="secondary"
                size="compact"
                leadingIcon={<Palette size={14} />}
                data-active={workbenchOpen ? 'true' : undefined}
                onClick={toggleWorkbench}
              >
                Tokens
              </Button>
            }
            onCloseMobile={isOverlayShell ? () => setMobilePanel(null) : undefined}
          >
            <RailSectionTree sections={inspectorRailSections} />
          </PanelRail>
        }
        sidebarCollapsed={sidebarCollapsed}
        leftRailPinnedOpen={leftRailPinnedOpen}
        rightRailPinnedOpen={rightRailPinnedOpen}
        leftUtility={
          workbenchPlacement === 'left' ? (
            <Workbench
              open={workbenchOpen}
              placement="left"
              mobileOpen={mobilePanel === 'utility'}
              onClose={closeWorkbench}
              onMove={setWorkbenchPlacement}
              theme={theme}
              setTheme={setTheme}
            />
          ) : undefined
        }
        rightUtility={
          workbenchPlacement === 'right' ? (
            <Workbench
              open={workbenchOpen}
              placement="right"
              mobileOpen={mobilePanel === 'utility'}
              onClose={closeWorkbench}
              onMove={setWorkbenchPlacement}
              theme={theme}
              setTheme={setTheme}
            />
          ) : undefined
        }
        leftUtilityOpen={workbenchPlacement === 'left' && workbenchOpen}
        rightUtilityOpen={workbenchPlacement === 'right' && workbenchOpen}
        overlayOpen={isOverlayShell && mobilePanel !== null}
        onDismissOverlay={() => setMobilePanel(null)}
        toolbarOffset={toolbarOffset}
      >
        <div className="ds-page-layout">

          <div className="ds-page-main">
            <div className="ds-content-header ds-main-tabs">
              <NavTabs value={galleryTab} onChange={setGalleryTab} items={GALLERY_TABS} />
            </div>

            <div className="ds-page-title-section ds-stack-sm">
              <Eyebrow as="div">Studio Page</Eyebrow>
              <Heading level="page">Reusable shell and component canon</Heading>
            </div>

            {galleryTab === 'shell' ? (
              <ResponsiveGrid>
                <SurfaceCard
                  title="Page Shell"
                  eyebrow="Layout"
                  actions={<Badge variant="accent">Canon</Badge>}
                >
                  <PanelNote title="One shell contract">
                    `PageShell` now owns the sidebar, toolbar, left rail, right rail, optional
                    docked utility panels, content region, and mobile backdrop.
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
                      { label: 'Utility', value: `${Math.round(theme.shell.utilityWidth)}px` },
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
                  <ListActionGroup
                    items={NAV_ITEMS.map((item) => {
                      const Icon = item.icon;

                      return {
                        id: item.id,
                        label: item.label,
                        icon: <Icon size={16} />,
                        active: item.id === activeNav,
                      };
                    })}
                  />
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
                          onSelect: () => setGalleryTab('conversation'),
                        },
                        {
                          id: 'board',
                          label: 'Open Board',
                          icon: <Shapes size={14} />,
                          onSelect: () => setGalleryTab('shell'),
                        },
                        {
                          id: 'timeline',
                          label: 'Open Timeline',
                          icon: <Workflow size={14} />,
                          onSelect: () => setGalleryTab('controls'),
                        },
                      ]}
                    />
                    <PopoverButton
                      label="Config"
                      leadingIcon={<SlidersHorizontal size={14} />}
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
                    <div className="ds-chip-grid">
                      <Badge variant="outline">Chrome {theme.controls.chrome}</Badge>
                    </div>
                    <ToolbarCluster className="ds-wrap">
                      <Button variant="primary" leadingIcon={<Sparkles size={16} />}>
                        Primary
                      </Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="secondary" size="compact">
                        Compact
                      </Button>
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

                <SurfaceCard title="Selectors + Option Group" eyebrow="Navigation">
                  <div className="ds-stack">
                    <SelectField
                      label="Active Workspace"
                      value={workspaceId}
                      onChange={setWorkspaceId}
                      options={WORKSPACE_OPTIONS}
                    />
                    <OptionGroup
                      label="Single Select"
                      columns={1}
                      value={controlChromeChoice}
                      onChange={setControlChromeChoice}
                      options={[
                        {
                          id: 'glass',
                          label: 'Glass',
                          description: 'Translucent shared control chrome.',
                        },
                        {
                          id: 'solid',
                          label: 'Solid',
                          description: 'Filled control bodies with stronger weight.',
                        },
                        {
                          id: 'line',
                          label: 'Line',
                          description: 'Border-first editorial chrome.',
                        },
                      ]}
                    />
                    <OptionGroup
                      label="Multi Select"
                      selectionMode="multiple"
                      columns={1}
                      value={controlBehaviorTags}
                      onChange={setControlBehaviorTags}
                      options={[
                        {
                          id: 'selected',
                          label: 'Selected',
                          description: 'Chip or row can show checked state inside the same system.',
                        },
                        {
                          id: 'contextual',
                          label: 'Contextual',
                          description: 'Config content stays page-specific while surface behavior stays shared.',
                        },
                        {
                          id: 'removable',
                          label: 'Removable',
                          description: 'Multi-select chips can include remove affordances later.',
                        },
                      ]}
                    />
                  </div>
                </SurfaceCard>

                <SurfaceCard title="Date Range + Dialogs" eyebrow="Overlays">
                  <div className="ds-stack">
                    <DateRangePicker
                      label="Shared Date Range"
                      value={controlsDateRange}
                      onChange={setControlsDateRange}
                      presets={CONTROL_DATE_RANGE_PRESETS}
                    />
                    <ToolbarCluster className="ds-wrap">
                      <PopoverButton
                        label="Open Configuration Popout"
                        variant="secondary"
                        leadingIcon={<Settings2 size={14} />}
                        align="start"
                      >
                        {configurationPanel}
                      </PopoverButton>
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
                      <Button
                        variant="secondary"
                        leadingIcon={<Bell size={16} />}
                        onClick={() => setModelessModalOpen(true)}
                      >
                        Open Modeless Dialog
                      </Button>
                    </ToolbarCluster>
                  </div>
                </SurfaceCard>

                <SurfaceCard title="Menu Behavior" eyebrow="Popup">
                  <div className="ds-stack">
                    <MenuButton
                      label="Open Action Menu"
                      items={[
                        {
                          id: 'save',
                          label: 'Save Draft',
                          description: 'Real handler keeps the menu primitive canon-ready.',
                          icon: <BookOpen size={14} />,
                          shortcut: 'S',
                          onSelect: () => setGalleryTab('surfaces'),
                        },
                        {
                          id: 'checked',
                          label: 'Checked Item',
                          description: 'Shared row chrome with explicit checked state.',
                          icon: <Bell size={14} />,
                          checked: true,
                          shortcut: 'C',
                          onSelect: () => setGalleryTab('controls'),
                        },
                        {
                          id: 'disabled',
                          label: 'Disabled Item',
                          description: 'Disabled rows stay visible without a different shell.',
                          icon: <SlidersHorizontal size={14} />,
                          disabled: true,
                          shortcut: 'D',
                        },
                      ]}
                    />
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
                      <Eyebrow>Default</Eyebrow>
                      <Text as="span" variant="quiet">Resting surface treatment</Text>
                    </div>
                    <div className="ds-state-card" data-tone="hover">
                      <Eyebrow>Hover</Eyebrow>
                      <Text as="span" variant="quiet">Interaction hover state</Text>
                    </div>
                    <div className="ds-state-card" data-tone="active">
                      <Eyebrow>Active</Eyebrow>
                      <Text as="span" variant="quiet">Selection and focus state</Text>
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

                <SurfaceCard
                  title="Toast Stack"
                  eyebrow="Feedback"
                  actions={
                    <Button
                      variant="toolbar"
                      size="compact"
                      leadingIcon={<Bell size={14} />}
                      onClick={resetToastPreviewItems}
                    >
                      Reset Stack
                    </Button>
                  }
                >
                  <div className="ds-stack">
                    <Text variant="quiet">
                      Toasts now sit in the reusable surfaces family and use the existing graph
                      palette instead of introducing separate notification colors.
                    </Text>
                    {toastPreviewItems.length ? (
                      <ToastStack placement="inline">
                        {toastPreviewItems.map((item) => (
                          <Toast
                            key={item.id}
                            tone={item.tone}
                            title={item.title}
                            description={item.description}
                            meta={item.meta}
                            icon={item.icon}
                            onDismiss={() =>
                              setToastPreviewItems((current) =>
                                current.filter((toast) => toast.id !== item.id)
                              )
                            }
                            actions={
                              <Button variant="toolbar" size="compact">
                                {item.actionLabel}
                              </Button>
                            }
                          />
                        ))}
                      </ToastStack>
                    ) : (
                      <PanelNote title="Stack Cleared" meta={<Badge variant="outline">Dismissed</Badge>}>
                        Restore the sample stack to review the non-blocking feedback surface again.
                      </PanelNote>
                    )}
                  </div>
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
                  <div className="ds-stack">
                    <Eyebrow as="div">Operational System</Eyebrow>
                    <Heading level="display">
                      Signal review stays sharp without becoming decorative.
                    </Heading>
                    <Text>
                      The canon system keeps the same editorial, controlled tone, but the typography
                      settings are now surfaced through reusable cards and selectors instead of
                      buried in page-specific markup.
                    </Text>
                    <CodeBlock>{`accent=${Math.round(theme.accent.hue)}\nvariant=${theme.background.variant}\nmode=${theme.mode}`}</CodeBlock>
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
        title="Component Review"
        actions={
          <ToolbarCluster className="ds-modal-actions">
            <Button variant="secondary" size="compact" onClick={() => setModalOpen(false)}>
              Keep Editing
            </Button>
            <Button
              variant="secondary"
              size="compact"
              leadingIcon={<Sparkles size={16} />}
              onClick={() => setModalOpen(false)}
            >
              Approve Canon
            </Button>
          </ToolbarCluster>
        }
      >
        <ContentSection
          title="Review Snapshot"
          description="Use the compact dialog for focused signoff while the larger workspace and workflow surfaces stay in the background."
          meta={<Badge variant="outline">Focused Review</Badge>}
        >
          <MetricGrid
            items={[
              { label: 'Scope', value: 'Single component' },
              { label: 'Status', value: 'Ready for approval' },
              { label: 'Next step', value: 'Promote to canon' },
            ]}
          />
        </ContentSection>
      </ModalDialog>

      <ModalDialog
        open={modelessModalOpen}
        onClose={() => setModelessModalOpen(false)}
        presentation="modeless"
        title="Docked System Panel"
        actions={
          <ToolbarCluster className="ds-modal-actions">
            <Button
              variant="secondary"
              size="compact"
              onClick={() => setModelessModalOpen(false)}
            >
              Close
            </Button>
          </ToolbarCluster>
        }
      >
        <ContentSection
          title="Non-blocking Review"
          description="Same dialog family, lighter interaction contract."
          meta={<Badge variant="outline">Modeless</Badge>}
        >
          <div className="ds-chip-grid">
            <Badge variant="outline">Menu</Badge>
            <Badge variant="outline">Date Range</Badge>
            <Badge variant="accent">Dialog</Badge>
          </div>
        </ContentSection>
      </ModalDialog>

      <WorkflowDialog
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
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
              <Button variant="secondary" size="compact" onClick={() => setWorkflowOpen(false)}>
                Keep Editing
              </Button>
              <Button
                variant="primary"
                size="compact"
                leadingIcon={<Play size={16} />}
                onClick={() => setWorkflowOpen(false)}
              >
                Start Flow
              </Button>
            </ToolbarCluster>
          </div>
        }
        sidebar={
          <ContentSection
            title="Launch Summary"
            description="A compact readout of the current launch configuration."
            meta={<Badge variant="outline">Live Summary</Badge>}
          >
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
          </ContentSection>
        }
      >
        <ContentSection
          title="Launch Context"
          description="Set the workspace and delivery shape for this flow."
        >
          <ResponsiveGrid minWidth="16rem">
            <SelectField
              label="Workspace"
              value={workspaceId}
              onChange={setWorkspaceId}
              options={WORKSPACE_OPTIONS}
            />
            <div className="ds-stack">
              <Eyebrow>Delivery Shape</Eyebrow>
              <SegmentedTabs
                value={flowOutput}
                onChange={setFlowOutput}
                items={FLOW_OUTPUT_OPTIONS}
                stretch
              />
            </div>
          </ResponsiveGrid>
        </ContentSection>

        <ContentSection
          title="Evidence Settings"
          description="Tune how much depth and review budget this run should use."
        >
          <ResponsiveGrid minWidth="16rem">
            <div className="ds-stack">
              <Eyebrow>Investigation Depth</Eyebrow>
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
          </ResponsiveGrid>
        </ContentSection>
      </WorkflowDialog>
    </>
  );
}
