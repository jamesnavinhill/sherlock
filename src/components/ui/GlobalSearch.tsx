import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CircleDot,
  Command,
  FileSearch,
  FileText,
  Fingerprint,
  FolderKanban,
  Hash,
  Loader2,
  MessageSquare,
  Network,
  Radio,
  Search,
  Sparkles,
  Target,
  Workflow,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { Source } from '@/types';
import { CANONICAL_NOUNS } from '@/domain';
import { findWorkspaceLandingArtifact } from '@/app/navigation';
import {
  buildDiscoverPath,
  buildFilesPath,
  buildMonitorPath,
  buildRunPath,
  buildSettingsPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceChatPath,
  buildWorkspaceHomePath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import { WorkspaceSearchRepository } from '@/services/db/repositories/WorkspaceSearchRepository';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceItemReference,
  buildWorkspaceSignalReference,
  buildWorkspaceSourceReference,
} from '@/services/workspace/library';
import { useWorkspaceStore } from '@/store/caseStore';
import { buildTimelineRouteQuery, parseTimelineRouteQuery } from '@/components/features/Timeline/timelineRouteState';
import {
  buildOmniboxResults,
  type OmniboxActionId,
  type OmniboxResult,
} from './omniboxModel';

const resultIconByKind: Record<OmniboxResult['kind'], LucideIcon> = {
  ROUTE: CircleDot,
  WORKSPACE: Target,
  ARTIFACT: FileText,
  SECTION: FileSearch,
  SOURCE: Hash,
  ENTITY: Fingerprint,
  SIGNAL: Radio,
  CHAT_SESSION: MessageSquare,
  RUN: Sparkles,
  WORKSPACE_ITEM: FolderKanban,
};

const resultLabelByKind: Record<OmniboxResult['kind'], string> = {
  ROUTE: 'Route',
  WORKSPACE: CANONICAL_NOUNS.workspace,
  ARTIFACT: CANONICAL_NOUNS.artifact,
  SECTION: 'Section',
  SOURCE: CANONICAL_NOUNS.source,
  ENTITY: 'Entity',
  SIGNAL: CANONICAL_NOUNS.signal,
  CHAT_SESSION: 'Chat',
  RUN: CANONICAL_NOUNS.run,
  WORKSPACE_ITEM: CANONICAL_NOUNS.item,
};

const isTimelinePathForWorkspace = (pathname: string, workspaceId: string) =>
  pathname === buildWorkspaceTimelinePath(workspaceId);

const buildTimelineFocusedPath = (
  locationSearch: string,
  workspaceId: string,
  track: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM',
  refId?: string
) => {
  const params = parseTimelineRouteQuery(new URLSearchParams(locationSearch));
  const next = buildTimelineRouteQuery({
    ...params,
    focusedTrack: track === 'ITEM' ? 'ITEM' : track,
    focusedRefId: refId,
  });
  const query = next.toString();
  return `${buildWorkspaceTimelinePath(workspaceId)}${query ? `?${query}` : ''}`;
};

const resolveTimelineFocus = (
  result: OmniboxResult
): { track: 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM'; refId?: string } | null => {
  switch (result.kind) {
    case 'ARTIFACT':
    case 'SECTION':
    case 'SOURCE':
      return {
        track: 'ARTIFACT',
        refId: result.artifactId || result.refId,
      };
    case 'SIGNAL':
      return {
        track: 'SIGNAL',
        refId: result.refId,
      };
    case 'RUN':
      return {
        track: 'RUN',
        refId: result.refId,
      };
    case 'CHAT_SESSION':
      return {
        track: 'CHAT',
        refId: result.refId,
      };
    case 'ENTITY':
      return {
        track: 'ENTITY',
        refId:
          typeof result.metadata?.entityName === 'string'
            ? result.metadata.entityName
            : result.title,
      };
    case 'WORKSPACE_ITEM':
      return {
        track: 'ITEM',
        refId: result.refId,
      };
    default:
      return null;
  }
};

const toOpenLabel = (result: OmniboxResult) => {
  switch (result.kind) {
    case 'RUN':
      return 'Open Run';
    case 'CHAT_SESSION':
      return 'Open Chat';
    case 'WORKSPACE_ITEM':
      return 'Open In Files';
    case 'SIGNAL':
      return 'Open Timeline';
    default:
      return 'Open';
  }
};

interface GlobalSearchModalProps {
  onClose: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    chatSessions,
    ensureWorkspaceBoard,
    headlines,
    queueBoardPlacement,
    setActiveTaskId,
    setActiveWorkspaceId,
    workspaceItems,
    workspaceRuns,
    workspaces,
  } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [workspaceResults, setWorkspaceResults] = useState<OmniboxResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseResults = useMemo(
    () =>
      buildOmniboxResults({
        query,
        activeWorkspaceId,
        artifacts,
        chatSessions,
        snippets: [],
        workspaceItems,
        workspaceRuns,
        workspaces,
      }),
    [activeWorkspaceId, artifacts, chatSessions, query, workspaceItems, workspaceRuns, workspaces]
  );
  const results = query.trim() && activeWorkspaceId ? workspaceResults : baseResults;
  const safeSelectedIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);

  const selectedResult =
    results.length > 0 ? results[safeSelectedIndex] : null;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!activeWorkspaceId || !query.trim()) {
      return () => {
        cancelled = true;
      };
    }

    const timeoutId = window.setTimeout(() => {
      void WorkspaceSearchRepository.searchWorkspace(activeWorkspaceId, query.trim(), {
        limit: 10,
      })
        .then((snippets) => {
          if (cancelled) return;
          setWorkspaceResults(
            buildOmniboxResults({
              query,
              activeWorkspaceId,
              artifacts,
              chatSessions,
              snippets,
              workspaceItems,
              workspaceRuns,
              workspaces,
            })
          );
        })
        .catch(() => {
          if (!cancelled) {
            setWorkspaceResults(baseResults);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeWorkspaceId,
    artifacts,
    baseResults,
    chatSessions,
    query,
    workspaceItems,
    workspaceRuns,
    workspaces,
  ]);

  const openTimeline = (result: OmniboxResult) => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);
    const timelineFocus = resolveTimelineFocus(result);
    navigate(
      timelineFocus
        ? buildTimelineFocusedPath(location.search, result.workspaceId, timelineFocus.track, timelineFocus.refId)
        : buildWorkspaceTimelinePath(result.workspaceId)
    );
    onClose();
  };

  const openNetwork = (result: OmniboxResult) => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);
    navigate(buildWorkspaceNetworkPath(result.workspaceId));
    onClose();
  };

  const openFiles = (result: OmniboxResult) => {
    if (result.workspaceId) {
      setActiveWorkspaceId(result.workspaceId);
    }
    navigate(buildFilesPath());
    onClose();
  };

  const placeOnBoard = async (result: OmniboxResult) => {
    if (!result.workspaceId) return;
    setActiveWorkspaceId(result.workspaceId);

    let boardId = activeWorkspaceBoardId;
    if (!boardId || activeWorkspaceId !== result.workspaceId) {
      const board = await ensureWorkspaceBoard(result.workspaceId);
      boardId = board.id;
    }

    const artifact =
      result.artifactId || result.kind === 'ARTIFACT'
        ? artifacts.find((entry) => entry.id === (result.artifactId || result.refId))
        : null;
    const item = result.kind === 'WORKSPACE_ITEM'
      ? workspaceItems.find((entry) => entry.id === result.refId)
      : null;
    const signal = result.kind === 'SIGNAL'
      ? headlines.find((entry) => entry.id === result.refId)
      : null;

    let reference = null;
    if (artifact?.id) {
      reference = buildWorkspaceArtifactReference(result.workspaceId, {
        ...artifact,
        id: artifact.id,
      });
    } else if (item) {
      reference = buildWorkspaceItemReference(item);
    } else if (signal) {
      reference = buildWorkspaceSignalReference(result.workspaceId, signal);
    } else if (result.kind === 'ENTITY') {
      const entityName =
        typeof result.metadata?.entityName === 'string' ? result.metadata.entityName : result.title;
      reference = buildWorkspaceEntityReference(result.workspaceId, {
        name: entityName,
        type: 'UNKNOWN',
      });
    } else if (result.kind === 'SOURCE') {
      reference = buildWorkspaceSourceReference(result.workspaceId, {
        title: result.title,
        url: typeof result.metadata?.url === 'string' ? result.metadata.url : '',
      } as Source);
    }

    if (!reference || !boardId) return;

    queueBoardPlacement({
      workspaceId: result.workspaceId,
      boardId,
      item: reference,
      openInBoard: true,
    });
    navigate(buildWorkspaceBoardDocumentPath(result.workspaceId, boardId));
    onClose();
  };

  const openResult = (result: OmniboxResult) => {
    if (result.kind === 'ROUTE') {
      const routeId = String(result.metadata?.routeId || '');
      const workspaceRouteMatch = routeId.match(/^route:workspace:(.+):(chat|board|timeline|network)$/);
      const workspaceRouteId = workspaceRouteMatch?.[1];
      const workspaceRouteSurface = workspaceRouteMatch?.[2];
      if (routeId === 'route:discover') navigate(buildDiscoverPath());
      if (routeId === 'route:files') navigate(buildFilesPath());
      if (routeId === 'route:monitor') navigate(buildMonitorPath());
      if (routeId === 'route:settings') navigate(buildSettingsPath());
      if (workspaceRouteId && workspaceRouteSurface) {
        setActiveWorkspaceId(workspaceRouteId);
        if (workspaceRouteSurface === 'chat') navigate(buildWorkspaceChatPath(workspaceRouteId));
        if (workspaceRouteSurface === 'board') navigate(buildWorkspaceBoardPath(workspaceRouteId));
        if (workspaceRouteSurface === 'timeline') navigate(buildWorkspaceTimelinePath(workspaceRouteId));
        if (workspaceRouteSurface === 'network') navigate(buildWorkspaceNetworkPath(workspaceRouteId));
      }
      onClose();
      return;
    }

    if (result.kind === 'WORKSPACE' && result.workspaceId) {
      setActiveWorkspaceId(result.workspaceId);
      const landingArtifact = findWorkspaceLandingArtifact(result.workspaceId, artifacts);
      navigate(
        landingArtifact?.id
          ? buildWorkspaceArtifactPath(result.workspaceId, landingArtifact.id)
          : buildWorkspaceHomePath(result.workspaceId)
      );
      onClose();
      return;
    }

    if (result.workspaceId) {
      setActiveWorkspaceId(result.workspaceId);

      const timelineFocus = resolveTimelineFocus(result);
      if (
        timelineFocus &&
        isTimelinePathForWorkspace(location.pathname, result.workspaceId)
      ) {
        navigate(
          buildTimelineFocusedPath(location.search, result.workspaceId, timelineFocus.track, timelineFocus.refId)
        );
        onClose();
        return;
      }
    }

    if ((result.kind === 'ARTIFACT' || result.kind === 'SECTION' || result.kind === 'SOURCE') && result.workspaceId && (result.artifactId || result.refId)) {
      const artifactId = result.artifactId || result.refId;
      if (artifactId) {
        const existingTask = workspaceRuns.find((entry) => entry.report?.id === artifactId);
        setActiveTaskId(existingTask?.id || null);
        navigate(buildWorkspaceArtifactPath(result.workspaceId, artifactId));
      }
      onClose();
      return;
    }

    if (result.kind === 'RUN' && result.refId) {
      setActiveTaskId(result.refId);
      navigate(buildRunPath(result.refId));
      onClose();
      return;
    }

    if (result.kind === 'CHAT_SESSION' && result.workspaceId && result.refId) {
      navigate(buildWorkspaceChatSessionPath(result.workspaceId, result.refId));
      onClose();
      return;
    }

    if (result.kind === 'SIGNAL') {
      openTimeline(result);
      return;
    }

    if (result.kind === 'ENTITY') {
      openNetwork(result);
      return;
    }

    if (result.kind === 'WORKSPACE_ITEM') {
      openFiles(result);
      return;
    }
  };

  const handleAction = async (result: OmniboxResult, action: OmniboxActionId) => {
    if (action === 'OPEN') {
      openResult(result);
      return;
    }
    if (action === 'PLACE_ON_BOARD') {
      await placeOnBoard(result);
      return;
    }
    if (action === 'OPEN_IN_TIMELINE') {
      openTimeline(result);
      return;
    }
    if (action === 'OPEN_IN_NETWORK') {
      openNetwork(result);
      return;
    }
    if (action === 'OPEN_IN_FILES') {
      openFiles(result);
    }
  };

  const handleKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      setSelectedIndex((previous) => (previous + 1) % results.length);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      setSelectedIndex((previous) => (previous - 1 + results.length) % results.length);
      event.preventDefault();
      return;
    }
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (!selectedResult || event.key !== 'Enter') return;

    event.preventDefault();

    if (event.shiftKey && selectedResult.actions.includes('PLACE_ON_BOARD')) {
      await handleAction(selectedResult, 'PLACE_ON_BOARD');
      return;
    }
    if (event.altKey && selectedResult.actions.includes('OPEN_IN_TIMELINE')) {
      await handleAction(selectedResult, 'OPEN_IN_TIMELINE');
      return;
    }

    await handleAction(selectedResult, 'OPEN');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 px-4 pt-20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl overflow-hidden border border-zinc-800 bg-osint-panel shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 border-b border-zinc-800 p-4">
          <Search className="h-5 w-5 text-osint-primary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setSelectedIndex(0);
              if (!nextQuery.trim() || !activeWorkspaceId) {
                setWorkspaceResults([]);
                setIsLoading(false);
                return;
              }
              setIsLoading(true);
            }}
            onKeyDown={(event) => void handleKeyDown(event)}
            placeholder="Search routes, workspaces, artifacts, items, chats, runs, and signals..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
          />
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : null}
          <button onClick={onClose}>
            <X className="h-4 w-4 text-zinc-500 transition-colors hover:text-white" />
          </button>
        </div>

        <div className="max-h-[440px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-10 text-center">
              {query.trim() ? (
                <p className="text-xs font-mono text-zinc-500">
                  No workspace records matching &quot;{query.trim()}&quot;
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center opacity-20">
                    <Command className="mb-2 h-12 w-12" />
                    <p className="text-xs font-mono uppercase tracking-widest">
                      Sherlock Omnibox
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="rounded border border-zinc-800/50 p-2 text-[10px] font-mono text-zinc-600">
                      Recents, artifacts, items, and chat sessions
                    </div>
                    <div className="rounded border border-zinc-800/50 p-2 text-[10px] font-mono text-zinc-600">
                      `Enter` opens, `Shift+Enter` places on board
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {results.map((result, index) => {
                const Icon = resultIconByKind[result.kind];
                const isSelected = index === Math.min(selectedIndex, results.length - 1);

                return (
                  <button
                    key={result.id}
                    onClick={() => void handleAction(result, 'OPEN')}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-osint-primary/30 bg-osint-primary/10'
                        : 'border-transparent hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                          isSelected ? 'text-osint-primary' : 'text-zinc-600'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-[10px] uppercase tracking-tighter text-zinc-500">
                          {result.subtitle || resultLabelByKind[result.kind]}
                        </div>
                        <div className="line-clamp-1 text-sm text-zinc-200">{result.title}</div>
                        {result.snippet ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                            {result.snippet}
                          </p>
                        ) : null}
                      </div>
                      <ArrowRight
                        className={`mt-2 h-4 w-4 transition-all ${
                          isSelected
                            ? 'translate-x-0 text-osint-primary opacity-100'
                            : '-translate-x-2 text-zinc-700 opacity-0'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-950/50 p-3 text-[10px] font-mono text-zinc-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {results.length} {query.trim() ? 'results' : 'recents'}
            </span>
            {selectedResult ? <span>{selectedResult.title}</span> : null}
          </div>

          <div className="flex items-center gap-2">
            {selectedResult ? (
              <>
                <button
                  onClick={() => void handleAction(selectedResult, 'OPEN')}
                  className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  <ArrowRight className="h-3 w-3" />
                  {toOpenLabel(selectedResult)}
                </button>
                {selectedResult.actions.includes('PLACE_ON_BOARD') ? (
                  <button
                    onClick={() => void handleAction(selectedResult, 'PLACE_ON_BOARD')}
                    className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    title="Place on board"
                  >
                    <Workflow className="h-3 w-3" />
                    Place
                  </button>
                ) : null}
                {selectedResult.actions.includes('OPEN_IN_TIMELINE') ? (
                  <button
                    onClick={() => void handleAction(selectedResult, 'OPEN_IN_TIMELINE')}
                    className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    title="Open in timeline"
                  >
                    <Radio className="h-3 w-3" />
                    Timeline
                  </button>
                ) : null}
                {selectedResult.actions.includes('OPEN_IN_NETWORK') ? (
                  <button
                    onClick={() => void handleAction(selectedResult, 'OPEN_IN_NETWORK')}
                    className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    title="Open in network"
                  >
                    <Network className="h-3 w-3" />
                    Network
                  </button>
                ) : null}
                {selectedResult.actions.includes('OPEN_IN_FILES') ? (
                  <button
                    onClick={() => void handleAction(selectedResult, 'OPEN_IN_FILES')}
                    className="inline-flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    title="Open in Files"
                  >
                    <FolderKanban className="h-3 w-3" />
                    Files
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalSearch: React.FC = () => {
  const { showGlobalSearch, setShowGlobalSearch } = useWorkspaceStore();

  if (!showGlobalSearch) return null;

  return (
    <GlobalSearchModal
      onClose={() => setShowGlobalSearch(false)}
    />
  );
};
