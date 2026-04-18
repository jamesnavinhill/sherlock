import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  CircleDot,
  Command,
  FileSearch,
  FileText,
  Fingerprint,
  FolderKanban,
  GripVertical,
  Hash,
  Loader2,
  MessageSquare,
  Network,
  Radio,
  Search,
  Sparkles,
  Target,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  CompactMenuHeader,
  CompactMenuPanel,
  COMPACT_MENU_ICON_CLASS,
  COMPACT_MENU_ITEM_CLASS,
  COMPACT_MENU_ITEM_DIVIDER_CLASS,
} from '@/components/ui/CompactMenu';
import { CANONICAL_NOUNS } from '@/domain';
import { WorkspaceSearchRepository } from '@/services/db/repositories/WorkspaceSearchRepository';
import { useWorkspaceStore } from '@/store/workspaceStore';
import {
  getAllTimelineSavedViews,
  type TimelineSavedView,
} from '@/components/features/Timeline/timelineSavedViews';
import { getStoredOmniboxRecents, setStoredOmniboxRecents } from '@/utils/localStorage';
import {
  buildOmniboxResults,
  createStoredOmniboxRecent,
  type OmniboxActionId,
  type OmniboxResult,
} from './omniboxModel';
import { executeOmniboxAction, getOmniboxOpenLabel } from './omniboxActions';
import { OMNIBOX_FOCUS_EVENT } from './omniboxFocus';

const resultIconByKind: Record<OmniboxResult['kind'], LucideIcon> = {
  ROUTE: CircleDot,
  WORKSPACE: Target,
  SAVED_VIEW: Bookmark,
  ARTIFACT: FileText,
  FINDING: FileSearch,
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
  SAVED_VIEW: 'Saved view',
  ARTIFACT: CANONICAL_NOUNS.artifact,
  FINDING: 'Finding',
  SECTION: 'Section',
  SOURCE: CANONICAL_NOUNS.source,
  ENTITY: 'Entity',
  SIGNAL: CANONICAL_NOUNS.signal,
  CHAT_SESSION: 'Chat',
  RUN: CANONICAL_NOUNS.run,
  WORKSPACE_ITEM: CANONICAL_NOUNS.item,
};

const actionMetaById: Record<
  Exclude<OmniboxActionId, 'OPEN'>,
  { icon: LucideIcon; label: string; title: string }
> = {
  OPEN_IN_CHAT: {
    icon: MessageSquare,
    label: 'Chat',
    title: 'Open in workspace chat',
  },
  PLACE_ON_BOARD: {
    icon: Workflow,
    label: 'Place',
    title: 'Place on board',
  },
  OPEN_IN_TIMELINE: {
    icon: Radio,
    label: 'Timeline',
    title: 'Open in timeline',
  },
  OPEN_IN_NETWORK: {
    icon: Network,
    label: 'Network',
    title: 'Open in network',
  },
  OPEN_IN_FILES: {
    icon: FolderKanban,
    label: 'Files',
    title: 'Open in files',
  },
};

interface GlobalSearchInlineProps {
  className?: string;
  compact?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

interface ActionMenuState {
  resultId: string;
  placement: 'left' | 'right';
  anchorTop: number;
  anchorLeft: number;
}

const ACTION_MENU_WIDTH_PX = 220;
const ACTION_MENU_GAP_PX = 24;

const GlobalSearchInline: React.FC<GlobalSearchInlineProps> = ({
  className,
  compact = false,
  isOpen,
  onClose,
  onOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addChatMessage,
    addToast,
    activeWorkspaceBoardId,
    activeWorkspaceId,
    artifacts,
    chatMessagesBySessionId,
    chatSessions,
    createChatSession,
    ensureWorkspaceBoard,
    headlines,
    queueBoardPlacement,
    setActiveChatSessionId,
    setActiveRunId,
    setActiveWorkspaceId,
    workspaceItems,
    workspaceRuns,
    workspaces,
  } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [workspaceResults, setWorkspaceResults] = useState<OmniboxResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [storedRecents, setStoredRecents] = useState(() => getStoredOmniboxRecents());
  const [savedViews, setSavedViews] = useState<TimelineSavedView[]>([]);
  const [actionMenuState, setActionMenuState] = useState<ActionMenuState | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const baseResults = useMemo(
    () =>
      buildOmniboxResults({
        query,
        activeWorkspaceId,
        artifacts,
        chatSessions,
        savedViews,
        snippets: [],
        storedRecents,
        workspaceItems,
        workspaceRuns,
        workspaces,
      }),
    [
      activeWorkspaceId,
      artifacts,
      chatSessions,
      query,
      savedViews,
      storedRecents,
      workspaceItems,
      workspaceRuns,
      workspaces,
    ]
  );
  const results = query.trim() && activeWorkspaceId ? workspaceResults : baseResults;
  const safeSelectedIndex = results.length === 0 ? 0 : Math.min(selectedIndex, results.length - 1);
  const selectedResult = results.length > 0 ? results[safeSelectedIndex] : null;

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    setActionMenuState(null);
    setActionMenuPosition(null);
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;

    void getAllTimelineSavedViews(workspaces.map((workspace) => workspace.id))
      .then((views) => {
        if (!cancelled) {
          setSavedViews(views);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedViews([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaces]);

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
              savedViews,
              snippets,
              storedRecents,
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
    savedViews,
    storedRecents,
    workspaceItems,
    workspaceRuns,
    workspaces,
  ]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionMenuRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest('[data-action-menu-trigger="true"]')
      ) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        setActionMenuState(null);
        setActionMenuPosition(null);
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose]);

  useEffect(() => {
    if (!actionMenuState) return;

    const closeActionMenu = () => {
      setActionMenuState(null);
      setActionMenuPosition(null);
    };

    window.addEventListener('resize', closeActionMenu);
    window.addEventListener('scroll', closeActionMenu, true);

    return () => {
      window.removeEventListener('resize', closeActionMenu);
      window.removeEventListener('scroll', closeActionMenu, true);
    };
  }, [actionMenuState]);

  useLayoutEffect(() => {
    if (!actionMenuState || !actionMenuRef.current) return;

    const menuRect = actionMenuRef.current.getBoundingClientRect();
    const top = Math.min(
      Math.max(actionMenuState.anchorTop, 8),
      Math.max(8, window.innerHeight - menuRect.height - 8)
    );
    const left =
      actionMenuState.placement === 'right'
        ? Math.min(
            actionMenuState.anchorLeft,
            Math.max(8, window.innerWidth - menuRect.width - 8)
          )
        : Math.max(actionMenuState.anchorLeft - menuRect.width, 8);

    if (actionMenuPosition?.top === top && actionMenuPosition?.left === left) return;
    setActionMenuPosition({ top, left });
  }, [actionMenuPosition, actionMenuState]);

  useEffect(() => {
    const handleFocusRequest = () => {
      onOpen();
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    };

    window.addEventListener(OMNIBOX_FOCUS_EVENT, handleFocusRequest);
    return () => window.removeEventListener(OMNIBOX_FOCUS_EVENT, handleFocusRequest);
  }, [onOpen]);

  const rememberRecent = (result: OmniboxResult) => {
    const recent = createStoredOmniboxRecent(result);
    if (!recent) return;

    setStoredRecents((current) => {
      const next = [
        recent,
        ...current.filter((entry) => !(entry.kind === recent.kind && entry.refId === recent.refId)),
      ].slice(0, 12);
      setStoredOmniboxRecents(next);
      return next;
    });
  };

  const handleAction = async (result: OmniboxResult, action: OmniboxActionId) => {
    setActionMenuState(null);
    rememberRecent(result);
    await executeOmniboxAction({
      action,
      activeWorkspaceBoardId,
      activeWorkspaceId,
      addChatMessage,
      addToast,
      artifacts,
      chatMessagesBySessionId,
      chatSessions,
      createChatSession,
      ensureWorkspaceBoard,
      headlines,
      locationPathname: location.pathname,
      locationSearch: location.search,
      navigate,
      onClose,
      queueBoardPlacement,
      result,
      setActiveChatSessionId,
      setActiveRunId,
      setActiveWorkspaceId,
      workspaceItems,
      workspaceRuns,
      workspaces,
    });
  };

  const toggleActionMenu = (resultId: string, index: number, trigger: HTMLButtonElement) => {
    const rect = trigger.getBoundingClientRect();
    const canOpenRight = window.innerWidth - rect.right >= ACTION_MENU_WIDTH_PX + ACTION_MENU_GAP_PX;

    setSelectedIndex(index);
    setActionMenuPosition(null);
    setActionMenuState((current) => {
      if (current?.resultId === resultId) {
        return null;
      }

      return {
        resultId,
        placement: canOpenRight ? 'right' : 'left',
        anchorTop: rect.top,
        anchorLeft: canOpenRight ? rect.right + ACTION_MENU_GAP_PX : rect.left - ACTION_MENU_GAP_PX,
      };
    });
  };

  const handleKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length > 0) {
      onOpen();
      setSelectedIndex((previous) => (previous + 1) % results.length);
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      onOpen();
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
    <div
      ref={rootRef}
      className={`relative w-full ${compact ? 'max-w-[30rem]' : 'max-w-3xl'} ${className || ''}`}
    >
      <div
        data-state={isOpen ? 'open' : 'closed'}
        className={`osint-toolbar-field osint-toolbar-search-field flex items-center border transition-colors ${
          isOpen ? 'text-white' : 'text-zinc-300 hover:text-white'
        } ${compact ? 'gap-2 px-3 py-2' : 'gap-3 px-4 py-3'}`}
      >
        <Search
          className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} ${
            isOpen ? 'text-osint-primary' : 'text-zinc-500'
          }`}
        />
        <input
          ref={inputRef}
          data-global-search-input
          type="text"
          value={query}
          onFocus={onOpen}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setSelectedIndex(0);
            onOpen();
            if (!nextQuery.trim() || !activeWorkspaceId) {
              setWorkspaceResults([]);
              setIsLoading(false);
              return;
            }
            setIsLoading(true);
          }}
          onKeyDown={(event) => void handleKeyDown(event)}
          placeholder="Global Search"
          className={`flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        />
        {isLoading ? (
          <Loader2
            className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} animate-spin text-zinc-500`}
          />
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              onClose();
            } else {
              onOpen();
              inputRef.current?.focus();
            }
          }}
          className={`osint-button-chrome osint-meta-label-strong hidden rounded px-2 py-1 ${
            compact ? 'xl:inline-flex' : 'md:inline-flex'
          }`}
          aria-label="Focus omnibox"
        >
          Ctrl K
        </button>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden border border-zinc-800 bg-osint-panel shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-[440px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-10 text-center">
                {query.trim() ? (
                  <p className="osint-body-quiet">
                    No workspace records matching &quot;{query.trim()}&quot;
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center opacity-20">
                      <Command className="mb-2 h-12 w-12" />
                      <p className="osint-eyebrow">Sherlock Omnibox</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="rounded border border-zinc-800/50 p-2 osint-body-quiet">
                        Recents, saved views, artifacts, items, and chat sessions
                      </div>
                      <div className="rounded border border-zinc-800/50 p-2 osint-body-quiet">
                        `Enter` opens, `Shift+Enter` places on board
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {results.map((result, index) => {
                  const Icon = resultIconByKind[result.kind];
                  const isSelected = index === Math.min(selectedIndex, results.length - 1);
                  const secondaryActions = result.actions.filter(
                    (action): action is Exclude<OmniboxActionId, 'OPEN'> => action !== 'OPEN'
                  );
                  const actionMenuOpen = actionMenuState?.resultId === result.id;
                  const dividerStyle = {
                    borderColor: 'color-mix(in oklab, var(--osint-border) 46%, transparent)',
                  } as const;
                  const rowToneClass =
                    index % 2 === 1 ? 'bg-[var(--osint-menu-row-alt-bg)]' : 'bg-transparent';

                  return (
                    <div
                      key={result.id}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`group relative w-full border-b text-left transition-all ${
                        isSelected
                          ? 'bg-[var(--osint-menu-selection-bg-strong)]'
                          : `${rowToneClass} hover:bg-[var(--osint-menu-selection-bg)]`
                      }`}
                      style={dividerStyle}
                    >
                      <button
                        type="button"
                        onClick={() => void handleAction(result, 'OPEN')}
                        className="block w-full pl-5 pr-10 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                              isSelected ? 'text-osint-primary' : 'text-zinc-600'
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-baseline gap-2">
                              <span className="shrink-0 osint-meta-label">
                                {result.subtitle || resultLabelByKind[result.kind]}
                              </span>
                              <div className="min-w-0 line-clamp-1 osint-title-inline">
                                {result.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {result.actions.length > 1 ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleActionMenu(result.id, index, event.currentTarget);
                              }}
                              className={`inline-flex h-4 w-4 items-center justify-center transition-all ${
                                isSelected || actionMenuOpen
                                  ? 'translate-x-0 text-osint-primary opacity-100'
                                  : '-translate-x-2 text-zinc-700 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100'
                              }`}
                              aria-haspopup="menu"
                              aria-expanded={actionMenuOpen}
                              aria-label={`More options for ${result.title}`}
                              title={`More options for ${result.title}`}
                              data-action-menu-trigger="true"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>

                            {actionMenuOpen && typeof document !== 'undefined'
                              ? createPortal(
                                  <CompactMenuPanel
                                    ref={actionMenuRef}
                                    className="fixed z-[140] min-w-[220px]"
                                    style={{
                                      top: actionMenuPosition?.top ?? 0,
                                      left: actionMenuPosition?.left ?? 0,
                                      visibility: actionMenuPosition ? 'visible' : 'hidden',
                                    }}
                                  >
                                    <CompactMenuHeader>
                                      {result.subtitle || resultLabelByKind[result.kind]}
                                    </CompactMenuHeader>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void handleAction(result, 'OPEN');
                                      }}
                                      className={`${COMPACT_MENU_ITEM_CLASS} ${
                                        secondaryActions.length > 0 ? COMPACT_MENU_ITEM_DIVIDER_CLASS : ''
                                      }`}
                                      title={getOmniboxOpenLabel(result)}
                                    >
                                      <ArrowRight className={COMPACT_MENU_ICON_CLASS} />
                                      <div>
                                        <div className="osint-menu-item-title">
                                          {getOmniboxOpenLabel(result)}
                                        </div>
                                      </div>
                                    </button>
                                    {secondaryActions.map((action, actionIndex) => {
                                      const actionMeta = actionMetaById[action];
                                      const ActionIcon = actionMeta.icon;
                                      const isLastAction = actionIndex === secondaryActions.length - 1;

                                      return (
                                        <button
                                          key={`${result.id}:${action}`}
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            void handleAction(result, action);
                                          }}
                                          className={`${COMPACT_MENU_ITEM_CLASS} ${
                                            !isLastAction ? COMPACT_MENU_ITEM_DIVIDER_CLASS : ''
                                          }`}
                                          title={actionMeta.title}
                                        >
                                          <ActionIcon className={COMPACT_MENU_ICON_CLASS} />
                                          <div>
                                            <div className="osint-menu-item-title">{actionMeta.label}</div>
                                            <div className="osint-menu-item-description">
                                              {actionMeta.title}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </CompactMenuPanel>,
                                  document.body
                                )
                              : null}
                          </div>
                        </div>
                      ) : isSelected ? (
                        <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-osint-primary" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-zinc-800 bg-zinc-950/50 p-3 osint-body-quiet">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedResult ? (
                <>
                  <span className="rounded border border-zinc-800 px-2 py-1 osint-meta-label">{`Enter ${getOmniboxOpenLabel(
                    selectedResult
                  )}`}</span>
                  {selectedResult.actions.includes('PLACE_ON_BOARD') ? (
                    <span className="rounded border border-zinc-800 px-2 py-1 osint-meta-label">Shift+Enter Place</span>
                  ) : null}
                  {selectedResult.actions.includes('OPEN_IN_TIMELINE') ? (
                    <span className="rounded border border-zinc-800 px-2 py-1 osint-meta-label">
                      Alt+Enter Timeline
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface GlobalSearchProps {
  className?: string;
  compact?: boolean;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ className, compact = false }) => {
  const { showGlobalSearch, setShowGlobalSearch } = useWorkspaceStore();

  return (
    <GlobalSearchInline
      className={className}
      compact={compact}
      isOpen={showGlobalSearch}
      onOpen={() => setShowGlobalSearch(true)}
      onClose={() => setShowGlobalSearch(false)}
    />
  );
};
