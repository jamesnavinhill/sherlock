import { create } from 'zustand';

import type {
  AgentAction,
  Artifact,
  ArtifactSection,
  BoardAgentAction,
  BoardAgentSession,
  WorkspaceTemplate,
  ChatGenerationStatus,
  ChatLaunchContext,
  ChatMessage,
  ChatSession,
  EntityAliasMap,
  FeedItem,
  Headline,
  InvestigationScope,
  ManualConnection,
  ManualNode,
  MonitorEvent,
  Workspace,
  WorkspaceBoard,
  WorkspaceBoardDocument,
  WorkspaceBoardPlacementRequest,
  WorkspaceDataBackup,
  WorkspaceItem,
  WorkspaceRun,
} from '../types';
import type { BreadcrumbItem } from '../components/ui/Breadcrumbs';
import { WorkspaceRepository } from '../services/db/repositories/WorkspaceRepository';
import { normalizeWorkspaceDataBackup } from '../services/maintenance/workspaceData';
import { DEFAULT_ACCENT_SETTINGS, buildAccentColor } from '../utils/accent';
import {
  DEFAULT_THEME_SURFACE_SETTINGS,
  type ThemeSurfaceSettings,
} from '../utils/themeSurfaces';
import { DEFAULT_THEME_FONT_SETTINGS, type ThemeFontSettings } from '../utils/themeFonts';
import {
  hasAppliedDemoWorkspaceSeed,
} from '../utils/localStorage';
import { createBootstrapActions } from './actions/bootstrapActions';
import { createSimpleActions } from './actions/simpleActions';
import { createConversationActions } from './actions/conversationActions';
import { createArtifactRunActions } from './actions/artifactRunActions';
import { createWorkspaceActions } from './actions/workspaceActions';

export interface Toast {
  id: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
}

export type ThemeMode = 'dark' | 'light';

const DEMO_WORKSPACE_SEED_PATH = '/seeds/demo-workspace.json';

const hasExistingWorkspaceData = (input: {
  workspaces: Workspace[];
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  chatSessions: ChatSession[];
  boardAgentSessions: BoardAgentSession[];
  headlines: Headline[];
  templates: WorkspaceTemplate[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: WorkspaceBoardDocument[];
  manualNodes: ManualNode[];
  manualLinks: ManualConnection[];
}) =>
  input.workspaces.length > 0 ||
  input.artifacts.length > 0 ||
  input.workspaceRuns.length > 0 ||
  input.chatSessions.length > 0 ||
  input.boardAgentSessions.length > 0 ||
  input.headlines.length > 0 ||
  input.templates.length > 0 ||
  input.workspaceItems.length > 0 ||
  input.workspaceBoards.length > 0 ||
  input.workspaceBoardDocuments.length > 0 ||
  input.manualNodes.length > 0 ||
  input.manualLinks.length > 0;

const persistWorkspaceDataBackup = async (payload: WorkspaceDataBackup) => {
  await WorkspaceRepository.replaceWorkspaceDataBackup(payload);
};

const loadDemoWorkspaceSeed = async () => {
  if (typeof window === 'undefined') return null;
  if (hasAppliedDemoWorkspaceSeed()) return null;

  try {
    const response = await fetch(DEMO_WORKSPACE_SEED_PATH, { cache: 'no-store' });
    if (!response.ok) return null;

    const payload = normalizeWorkspaceDataBackup(await response.json());
    return payload;
  } catch (error) {
    console.warn('Demo workspace seed bootstrap skipped:', error);
    return null;
  }
};

export interface WorkspaceState {
  isLoading: boolean;
  error: string | null;
  initializeStore: () => Promise<void>;

  workspaces: Workspace[];
  artifacts: Artifact[];
  workspaceRuns: WorkspaceRun[];
  chatSessions: ChatSession[];
  chatMessagesBySessionId: Record<string, ChatMessage[]>;
  chatActionsBySessionId: Record<string, AgentAction[]>;
  boardAgentSessions: BoardAgentSession[];
  boardAgentActionsBySessionId: Record<string, BoardAgentAction[]>;
  activeChatSessionId: string | null;
  chatGenerationStatus: ChatGenerationStatus;
  partialAssistantOutput: string;
  selectedChatLaunchContext: ChatLaunchContext | null;
  activeRunId: string | null;
  liveEvents: MonitorEvent[];
  headlines: Headline[];
  templates: WorkspaceTemplate[];
  workspaceItems: WorkspaceItem[];
  workspaceBoards: WorkspaceBoard[];
  workspaceBoardDocuments: Record<string, WorkspaceBoardDocument>;
  activeWorkspaceBoardId: string | null;
  queuedBoardPlacement: WorkspaceBoardPlacementRequest | null;
  entityAliases: EntityAliasMap;
  toasts: Toast[];
  feedItems: FeedItem[];
  feedConfig: {
    limit: number;
    prioritySources: string;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  manualLinks: ManualConnection[];
  manualNodes: ManualNode[];
  hiddenNodeIds: string[];
  flaggedNodeIds: string[];
  activeWorkspaceId: string | null;

  customScopes: InvestigationScope[];
  activeScope: string | null;
  defaultScopeId: string;

  navStack: BreadcrumbItem[];
  isSidebarCollapsed: boolean;
  themeMode: ThemeMode;
  themeColor: string;
  accentSettings: {
    hue: number;
    lightness: number;
    chroma: number;
  };
  themeSurfaceSettings: ThemeSurfaceSettings;
  themeFontSettings: ThemeFontSettings;
  showGlobalSearch: boolean;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  setWorkspaceRuns: (workspaceRuns: WorkspaceRun[]) => void;
  setChatSessions: (sessions: ChatSession[]) => void;
  setChatMessagesBySessionId: (messages: Record<string, ChatMessage[]>) => void;
  setBoardAgentSessions: (sessions: BoardAgentSession[]) => void;
  setBoardAgentActionsBySessionId: (actions: Record<string, BoardAgentAction[]>) => void;
  setActiveChatSessionId: (id: string | null) => void;
  setChatGenerationStatus: (status: ChatGenerationStatus) => void;
  setPartialAssistantOutput: (value: string) => void;
  setSelectedChatLaunchContext: (context: ChatLaunchContext | null) => void;
  setActiveRunId: (id: string | null) => void;
  setLiveEvents: (events: MonitorEvent[] | ((prev: MonitorEvent[]) => MonitorEvent[])) => void;
  setNavStack: (stack: BreadcrumbItem[]) => void;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: string) => void;
  setAccentSettings: (settings: { hue: number; lightness: number; chroma: number }) => void;
  setThemeSurfaceSettings: (settings: ThemeSurfaceSettings) => void;
  setThemeFontSettings: (settings: ThemeFontSettings) => void;
  setShowGlobalSearch: (show: boolean) => void;
  setTemplates: (templates: WorkspaceTemplate[]) => void;
  setHeadlines: (headlines: Headline[]) => void;
  setWorkspaceItems: (items: WorkspaceItem[]) => void;
  setWorkspaceBoards: (boards: WorkspaceBoard[]) => void;
  setActiveWorkspaceBoardId: (id: string | null) => void;
  queueBoardPlacement: (request: WorkspaceBoardPlacementRequest | null) => void;
  clearQueuedBoardPlacement: () => void;
  addHeadline: (headline: Headline) => Promise<void>;
  addTemplate: (template: WorkspaceTemplate) => void;
  deleteTemplate: (id: string) => void;
  setEntityAliases: (aliases: EntityAliasMap) => Promise<void>;
  addAlias: (variant: string, canonical: string) => void;
  resolveEntity: (name: string) => string;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setFeedItems: (items: FeedItem[]) => void;
  setFeedConfig: (config: WorkspaceState['feedConfig']) => void;
  setManualLinks: (links: ManualConnection[]) => void;
  setManualNodes: (nodes: ManualNode[]) => void;
  setHiddenNodeIds: (ids: string[]) => void;
  setFlaggedNodeIds: (ids: string[]) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  toggleFlag: (id: string) => void;
  toggleHide: (id: string) => void;

  setActiveScope: (id: string | null) => void;
  setDefaultScope: (id: string) => void;
  addScope: (scope: InvestigationScope) => void;
  deleteScope: (id: string) => void;

  addWorkspaceRun: (workspaceRun: WorkspaceRun) => Promise<void>;
  addRun: (run: WorkspaceRun) => Promise<void>;
  createChatSession: (input: {
    workspaceId: string;
    title?: string;
    sourceArtifactId?: string;
    packId?: string;
    purposeId?: string;
    provider?: ChatSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<ChatSession>;
  updateChatSession: (
    sessionId: string,
    patch: Partial<Omit<ChatSession, 'id' | 'workspaceId' | 'createdAt'>>
  ) => Promise<void>;
  renameChatSession: (sessionId: string, title: string) => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  addChatMessage: (message: ChatMessage) => Promise<void>;
  updateChatMessage: (
    messageId: string,
    sessionId: string,
    patch: Partial<ChatMessage>
  ) => Promise<void>;
  addChatAction: (action: AgentAction) => Promise<void>;
  createBoardAgentSession: (input: {
    workspaceId: string;
    boardId: string;
    title?: string;
    request: string;
    provider?: BoardAgentSession['provider'];
    modelId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<BoardAgentSession>;
  updateBoardAgentSession: (
    sessionId: string,
    patch: Partial<Omit<BoardAgentSession, 'id' | 'workspaceId' | 'boardId' | 'createdAt'>>
  ) => Promise<void>;
  addBoardAgentAction: (action: BoardAgentAction) => Promise<void>;
  updateBoardAgentAction: (
    actionId: string,
    sessionId: string,
    patch: Partial<
      Omit<BoardAgentAction, 'id' | 'sessionId' | 'workspaceId' | 'boardId' | 'createdAt'>
    >
  ) => Promise<void>;
  appendSectionToArtifact: (artifactId: string, section: ArtifactSection) => Promise<void>;
  updateArtifactSummary: (artifactId: string, summary: string) => Promise<void>;
  updateArtifactSection: (
    artifactId: string,
    sectionId: string,
    patch: Partial<Pick<ArtifactSection, 'title' | 'content' | 'items' | 'order'>>
  ) => Promise<void>;
  completeWorkspaceRun: (id: string, artifact: Artifact) => Promise<void>;
  completeRun: (id: string, artifact: Artifact) => Promise<void>;
  failRun: (id: string, error: string) => Promise<void>;
  clearCompletedRuns: () => Promise<void>;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  updateArtifactTitle: (artifactId: string, title: string) => Promise<void>;
  renameEntityAcrossArtifacts: (oldName: string, newName: string) => Promise<void>;
  deleteArtifact: (artifactId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  purgeWorkspace: (workspaceId: string) => Promise<void>;
  ensureWorkspaceBoard: (workspaceId: string) => Promise<WorkspaceBoard>;
  createWorkspaceBoard: (input: {
    workspaceId: string;
    name?: string;
    description?: string;
    presentationMode?: boolean;
  }) => Promise<WorkspaceBoard>;
  updateWorkspaceBoard: (boardId: string, patch: Partial<WorkspaceBoard>) => Promise<void>;
  deleteWorkspaceBoard: (boardId: string) => Promise<void>;
  saveWorkspaceBoardDocument: (document: WorkspaceBoardDocument) => Promise<void>;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<void>;
  updateWorkspaceItem: (itemId: string, patch: Partial<WorkspaceItem>) => Promise<void>;
  deleteWorkspaceItem: (itemId: string) => Promise<void>;
  importWorkspaceData: (payload: WorkspaceDataBackup) => Promise<void>;
  clearWorkspaceData: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  isLoading: true,
  error: null,

  workspaces: [],
  artifacts: [],
  workspaceRuns: [],
  chatSessions: [],
  chatMessagesBySessionId: {},
  chatActionsBySessionId: {},
  boardAgentSessions: [],
  boardAgentActionsBySessionId: {},
  activeChatSessionId: null,
  chatGenerationStatus: 'IDLE',
  partialAssistantOutput: '',
  selectedChatLaunchContext: null,
  activeRunId: null,
  liveEvents: [],
  toasts: [],
  navStack: [],
  isSidebarCollapsed: true,
  themeMode: 'dark',
  themeColor: buildAccentColor(DEFAULT_ACCENT_SETTINGS),
  accentSettings: DEFAULT_ACCENT_SETTINGS,
  themeSurfaceSettings: DEFAULT_THEME_SURFACE_SETTINGS,
  themeFontSettings: DEFAULT_THEME_FONT_SETTINGS,
  showGlobalSearch: false,
  templates: [],
  headlines: [],
  workspaceItems: [],
  workspaceBoards: [],
  workspaceBoardDocuments: {},
  activeWorkspaceBoardId: null,
  queuedBoardPlacement: null,
  entityAliases: {},
  feedItems: [],
  feedConfig: {
    limit: 8,
    prioritySources: '',
    autoRefresh: false,
    refreshInterval: 60000,
  },
  manualLinks: [],
  manualNodes: [],
  hiddenNodeIds: [],
  flaggedNodeIds: [],
  activeWorkspaceId: null,

  customScopes: [],
  activeScope: null,
  defaultScopeId: 'open-investigation',

  ...createBootstrapActions(
    { set, get },
    {
      hasExistingWorkspaceData,
      loadDemoWorkspaceSeed,
      persistWorkspaceDataBackup,
    }
  ),
  ...createSimpleActions({ set, get }),
  ...createConversationActions({ set, get }),
  ...createArtifactRunActions({ set, get }),
  ...createWorkspaceActions(
    { set, get },
    {
      persistWorkspaceDataBackup,
    }
  ),
}));
