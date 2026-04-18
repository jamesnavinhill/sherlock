import { startTransition, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  FileText,
  FolderKanban,
  GitBranch,
  Radar,
  Workflow,
} from 'lucide-react';

import {
  buildFilesPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceBoardDocumentPath,
  buildWorkspaceBoardPath,
  buildWorkspaceChatPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceNetworkPath,
  buildWorkspaceTimelinePath,
} from '@/app/routes';
import { findWorkspaceLandingArtifact } from '@/app/navigation';
import {
  buildTimelineRouteQuery,
  DEFAULT_TIMELINE_ROUTE_QUERY,
  type TimelineRouteQueryState,
} from '@/components/features/Timeline/timelineRouteState';
import { getWorkspaceTimelineSavedViews } from '@/components/features/Timeline/timelineSavedViews';
import {
  buildWorkspaceHomeSnapshot,
  type WorkspaceHomeCounts,
  type WorkspaceHomeRecentActivityItem,
} from '@/services/workspace/home';
import { useWorkspaceHomeReadinessState } from '@/store/selectors/workspaceHomeSelectors';
import {
  CHROME_HEADER_CLASS,
  CHROME_PANEL_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  getChromeMenuButtonClass,
} from '@/components/ui/chrome';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';
import { PageShell } from '@/components/system/layout/PageShell';

interface WorkspaceHomeProps {
  workspaceId: string;
}

const formatTimestamp = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: timestamp > 0 ? 'short' : undefined,
  }).format(timestamp);

const formatRelativeTimestamp = (timestamp: number) => {
  const diffMs = Math.max(Date.now() - timestamp, 0);
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatTimestamp(timestamp);
};

const activityLabel: Record<WorkspaceHomeRecentActivityItem['kind'], string> = {
  ARTIFACT: 'Artifact',
  ITEM: 'Item',
  SIGNAL: 'Signal',
  CHAT: 'Chat',
  RUN: 'Run',
  BOARD: 'Board',
};

const activityAccentClass: Record<WorkspaceHomeRecentActivityItem['kind'], string> = {
  ARTIFACT: 'border-l-cyan-400/70',
  ITEM: 'border-l-emerald-400/70',
  SIGNAL: 'border-l-amber-400/70',
  CHAT: 'border-l-violet-400/70',
  RUN: 'border-l-red-400/70',
  BOARD: 'border-l-osint-primary/70',
};

const buildSavedViewHref = (workspaceId: string, query: TimelineRouteQueryState) => {
  const params = buildTimelineRouteQuery(query).toString();
  const path = buildWorkspaceTimelinePath(workspaceId);
  return params.length > 0 ? `${path}?${params}` : path;
};

const useWorkspaceHomeController = (workspaceId: string) => {
  const readiness = useWorkspaceHomeReadinessState();
  const [savedViews, setSavedViews] = useState<Awaited<
    ReturnType<typeof getWorkspaceTimelineSavedViews>
  >>([]);
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getWorkspaceTimelineSavedViews(workspaceId)
      .then((views) => {
        if (!isMounted) return;
        startTransition(() => {
          setLoadedWorkspaceId(workspaceId);
          setSavedViews(views);
        });
      })
      .catch(() => {
        if (!isMounted) return;
        startTransition(() => {
          setLoadedWorkspaceId(workspaceId);
          setSavedViews([]);
        });
      });

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  const savedViewsPending = loadedWorkspaceId !== workspaceId;

  const workspace = readiness.workspaces.find((entry) => entry.id === workspaceId) || null;
  const primaryArtifact = findWorkspaceLandingArtifact(workspaceId, readiness.artifacts);
  const primaryBoard =
    readiness.workspaceBoards
      .filter((board) => board.workspaceId === workspaceId)
      .sort((left, right) =>
        left.sortOrder === right.sortOrder
          ? left.updatedAt - right.updatedAt
          : left.sortOrder - right.sortOrder
      )[0] || null;
  const recentChatSession =
    readiness.chatSessions
      .filter((session) => session.workspaceId === workspaceId)
      .sort((left, right) => right.updatedAt - left.updatedAt)[0] || null;

  const snapshot = useMemo(() => {
    if (!workspace) return null;

    return buildWorkspaceHomeSnapshot({
      artifacts: readiness.artifacts,
      chatSessions: readiness.chatSessions,
      headlines: readiness.headlines,
      savedViews,
      workspace,
      workspaceBoardDocuments: readiness.workspaceBoardDocuments,
      workspaceBoards: readiness.workspaceBoards,
      workspaceItems: readiness.workspaceItems,
      workspaceRuns: readiness.workspaceRuns,
    });
  }, [
    readiness.artifacts,
    readiness.chatSessions,
    readiness.headlines,
    readiness.workspaceBoardDocuments,
    readiness.workspaceBoards,
    readiness.workspaceItems,
    readiness.workspaceRuns,
    savedViews,
    workspace,
  ]);

  return {
    primaryArtifact,
    primaryBoard,
    recentChatSession,
    savedViews,
    savedViewsPending,
    snapshot,
    workspace,
  };
};

const buildCountCards = (counts: WorkspaceHomeCounts) => [
  { label: 'Artifacts', value: counts.artifacts },
  { label: 'Items', value: counts.items },
  { label: 'Signals', value: counts.signals },
  { label: 'Chats', value: counts.chats },
  { label: 'Runs', value: counts.runs },
  { label: 'Boards', value: counts.boards },
  { label: 'Snapshots', value: counts.boardsWithSnapshots },
];

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({ workspaceId }) => {
  const {
    primaryArtifact,
    primaryBoard,
    recentChatSession,
    savedViews,
    savedViewsPending,
    snapshot,
    workspace,
  } = useWorkspaceHomeController(workspaceId);

  if (!workspace || !snapshot) {
    return null;
  }

  const quickActions = [
    primaryArtifact?.id
      ? {
          href: buildWorkspaceArtifactPath(workspaceId, primaryArtifact.id),
          icon: FileText,
          label: 'Open Artifact',
          detail: primaryArtifact.topic,
        }
      : null,
    {
      href: recentChatSession?.id
        ? buildWorkspaceChatSessionPath(workspaceId, recentChatSession.id)
        : buildWorkspaceChatPath(workspaceId),
      icon: Bot,
      label: recentChatSession ? 'Resume Chat' : 'Open Chat',
      detail: recentChatSession?.title || 'Continue workspace-grounded analysis',
    },
    {
      href: primaryBoard?.id
        ? buildWorkspaceBoardDocumentPath(workspaceId, primaryBoard.id)
        : buildWorkspaceBoardPath(workspaceId),
      icon: FolderKanban,
      label: 'Open Board',
      detail: primaryBoard?.name || 'Place artifacts, items, and notes',
    },
    {
      href: buildWorkspaceTimelinePath(workspaceId),
      icon: Workflow,
      label: 'Review Timeline',
      detail: `${snapshot.summary.counts.signals} signals and saved chronology views`,
    },
    {
      href: buildWorkspaceNetworkPath(workspaceId),
      icon: GitBranch,
      label: 'Open Network',
      detail: 'Inspect entities, sources, and manual links',
    },
    {
      href: buildFilesPath(),
      icon: Radar,
      label: 'Open Files',
      detail: 'Browse artifacts and canonical workspace items',
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof Bot;
    label: string;
    detail: string;
  }>;

  const countCards = buildCountCards(snapshot.summary.counts);

  return (
    <PageShell
      className="osint-shell-stage h-screen w-full"
      toolbar={
        <header className={`${CHROME_HEADER_CLASS} px-6`}>
          <div className="flex h-full min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 osint-meta-label">Workspace Overview</div>
              <h1 className="truncate osint-title-page">{snapshot.summary.title}</h1>
              <p className="mt-2 max-w-3xl osint-body-muted">
                {workspace.description ||
                  snapshot.summary.launchAngle ||
                  snapshot.summary.launchTopic ||
                  'Summary counts, saved views, and recent activity for this workspace.'}
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <Link
                to={buildWorkspaceChatPath(workspaceId)}
                className={getChromeMenuButtonClass(false)}
              >
                Chat
              </Link>
              <Link
                to={
                  primaryBoard?.id
                    ? buildWorkspaceBoardDocumentPath(workspaceId, primaryBoard.id)
                    : buildWorkspaceBoardPath(workspaceId)
                }
                className={getChromeMenuButtonClass(false)}
              >
                Board
              </Link>
              <Link
                to={buildWorkspaceTimelinePath(workspaceId)}
                className={getChromeMenuButtonClass(false)}
              >
                Timeline
              </Link>
            </div>
          </div>
        </header>
      }
    >
      <main
        className="osint-shell-content-surface relative flex-1 overflow-y-auto p-6"
        data-app-scroll-region
      >
        <MainContentDotGrid testId="workspace-home-dot-grid-background" />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <div className="space-y-6">
            <section className={`overflow-hidden border ${CHROME_PANEL_CLASS}`}>
              <div className={CHROME_PANEL_HEADER_CLASS}>
                <div className="osint-meta-label">
                  Summary
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {countCards.map((card) => (
                  <div
                    key={card.label}
                    className="border border-zinc-900/50 bg-zinc-900/20 px-4 py-3 shadow-sm transition-all duration-200"
                  >
                    <div className="osint-meta-label">
                      {card.label}
                    </div>
                    <div className="mt-2 osint-title-section">{card.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`overflow-hidden border ${CHROME_PANEL_CLASS}`}>
              <div className={CHROME_PANEL_HEADER_CLASS}>
                <div className="osint-meta-label">
                  Quick Actions
                </div>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="group p-4 transition-all duration-200 hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="osint-raised-surface-subtle mt-0.5 rounded-sm p-2 text-osint-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="osint-panel-title transition-colors group-hover:text-osint-primary">{action.label}</div>
                            <div className="mt-1 osint-body-muted">{action.detail}</div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-osint-primary" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className={`overflow-hidden border ${CHROME_PANEL_CLASS}`}>
              <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-center justify-between gap-3`}>
                <div className="osint-meta-label">
                  Recent Activity
                </div>
                <Link
                  to={buildWorkspaceTimelinePath(workspaceId)}
                  className="osint-meta-label transition hover:text-white"
                >
                  Open Timeline
                </Link>
              </div>
              <div className="p-4">
                {snapshot.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {snapshot.recentActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className={`group border-l-2 p-4 transition-all duration-200 hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)] ${activityAccentClass[entry.kind]}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="osint-meta-label">
                              {activityLabel[entry.kind]}
                            </div>
                            <div className="mt-1 truncate osint-panel-title transition-colors group-hover:text-osint-primary">
                              {entry.title}
                            </div>
                            <div className="mt-1 osint-body-muted">{entry.subtitle}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="osint-body-quiet">
                              {formatRelativeTimestamp(entry.timestamp)}
                            </div>
                            <div className="mt-1 osint-body-quiet">
                              {formatTimestamp(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="osint-raised-surface-subtle border-dashed p-6 osint-body-muted">
                    Recent workspace activity will appear here as artifacts, items, signals, runs,
                    chats, and boards are updated.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className={`overflow-hidden border ${CHROME_PANEL_CLASS}`}>
              <div className={CHROME_PANEL_HEADER_CLASS}>
                <div className="osint-meta-label">
                  Workspace Context
                </div>
              </div>
              <div className="space-y-4 p-4 osint-body-small">
                <div>
                  <div className="osint-meta-label">
                    Opened
                  </div>
                  <div className="mt-1 osint-panel-title">{workspace.dateOpened}</div>
                </div>
                {snapshot.summary.launchTopic ? (
                  <div>
                    <div className="osint-meta-label">
                      Launch Topic
                    </div>
                    <div className="mt-1 osint-panel-title">{snapshot.summary.launchTopic}</div>
                  </div>
                ) : null}
                {snapshot.summary.launchAngle ? (
                  <div>
                    <div className="osint-meta-label">
                      Angle
                    </div>
                    <div className="mt-1 osint-panel-title">{snapshot.summary.launchAngle}</div>
                  </div>
                ) : null}
                {snapshot.summary.prioritySourcesSummary ? (
                  <div>
                    <div className="osint-meta-label">
                      Priority Sources
                    </div>
                    <div className="mt-1 osint-panel-title">{snapshot.summary.prioritySourcesSummary}</div>
                  </div>
                ) : null}
                <div>
                  <div className="osint-meta-label">
                    Board State
                  </div>
                  <div className="mt-1 osint-panel-title">
                    {snapshot.summary.boardState.count} boards,{' '}
                    {snapshot.summary.boardState.boardsWithSnapshots} with saved snapshots
                  </div>
                </div>
              </div>
            </section>

            <section className={`overflow-hidden border ${CHROME_PANEL_CLASS}`}>
              <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-center justify-between gap-3`}>
                <div className="osint-meta-label">
                  Saved Views
                </div>
                <Link
                  to={buildWorkspaceTimelinePath(workspaceId)}
                  className="osint-meta-label transition hover:text-white"
                >
                  Timeline
                </Link>
              </div>
              <div className="p-4">
                {savedViewsPending ? (
                  <div className="osint-raised-surface-subtle border-dashed p-6 text-sm text-zinc-500">
                    Loading saved timeline views...
                  </div>
                ) : snapshot.savedViews.length > 0 ? (
                  <div className="space-y-3">
                    {snapshot.savedViews.map((view) => (
                      <Link
                        key={view.id}
                        to={buildSavedViewHref(
                          workspaceId,
                          savedViews.find((entry) => entry.id === view.id)?.query ||
                            DEFAULT_TIMELINE_ROUTE_QUERY
                        )}
                        className="group block p-4 transition-all duration-200 hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                             <div className="truncate osint-panel-title transition-colors group-hover:text-osint-primary">
                                {view.title}
                              </div>
                            <div className="mt-1 osint-body-muted">{view.snippet}</div>
                          </div>
                          <div className="shrink-0 osint-body-quiet">
                            {formatRelativeTimestamp(view.updatedAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="osint-raised-surface-subtle border-dashed p-6 osint-body-muted">
                    Save filtered timeline states to make this workspace home jump directly into
                    recurring chronology views.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </PageShell>
  );
};
