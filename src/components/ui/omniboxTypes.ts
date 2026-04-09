import type {
  Artifact,
  ChatSession,
  Workspace,
  WorkspaceContextSnippet,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import type { TimelineSavedView } from '@/components/features/Timeline/timelineSavedViews';
import type { StoredOmniboxRecent } from '@/utils/localStorage';

export type OmniboxResultKind =
  | 'ROUTE'
  | 'WORKSPACE'
  | 'SAVED_VIEW'
  | 'ARTIFACT'
  | 'FINDING'
  | 'SECTION'
  | 'SOURCE'
  | 'ENTITY'
  | 'SIGNAL'
  | 'CHAT_SESSION'
  | 'RUN'
  | 'WORKSPACE_ITEM';

export type OmniboxActionId =
  | 'OPEN'
  | 'OPEN_IN_CHAT'
  | 'PLACE_ON_BOARD'
  | 'OPEN_IN_TIMELINE'
  | 'OPEN_IN_NETWORK'
  | 'OPEN_IN_FILES';

export interface OmniboxResult {
  id: string;
  kind: OmniboxResultKind;
  title: string;
  subtitle: string;
  snippet?: string;
  workspaceId?: string;
  artifactId?: string;
  refId?: string;
  score: number;
  timestamp?: number;
  actions: OmniboxActionId[];
  metadata?: Record<string, unknown>;
}

export interface BuildOmniboxResultsInput {
  query: string;
  activeWorkspaceId: string | null;
  artifacts: Artifact[];
  chatSessions: ChatSession[];
  snippets: WorkspaceContextSnippet[];
  storedRecents?: StoredOmniboxRecent[];
  savedViews?: TimelineSavedView[];
  workspaceItems: WorkspaceItem[];
  workspaceRuns: WorkspaceRun[];
  workspaces: Workspace[];
}
