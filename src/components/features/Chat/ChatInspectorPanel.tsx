import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileSearch,
  FileText,
  MessageSquare,
  Workflow,
} from 'lucide-react';

import type { AgentAction, Artifact, ChatMessage, Signal } from '@/types';
import { GlobalInspectorPanel } from '@/components/features/Inspector/GlobalInspectorPanel';
import type { GlobalInspectorSection } from '@/components/features/Inspector/globalInspectorTypes';
import {
  CHROME_NESTED_ITEM_BADGE_CLASS,
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_META_ROW_CLASS,
  CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';

interface LaunchContextSummary {
  label: string;
  title: string;
  body: string;
}

interface ChatInspectorPanelProps {
  rightPanelOpen: boolean;
  workspaceTitle?: string;
  rightPanelSections: {
    launchContext: boolean;
    recentArtifacts: boolean;
    recentSignals: boolean;
    latestRetrieval: boolean;
    actionLog: boolean;
  };
  launchContextSummary: LaunchContextSummary | null;
  workspaceReports: Artifact[];
  workspaceSignals: Signal[];
  latestAssistantMessage?: ChatMessage;
  sessionActions: AgentAction[];
  expandedArtifactIds: Record<string, boolean>;
  sectionScrollClassName: string;
  formatDateTime: (value: number) => string;
  onToggleSection: (section: keyof ChatInspectorPanelProps['rightPanelSections']) => void;
  onToggleArtifactCard: (artifactKey: string) => void;
  onFetchArtifactSummary: (artifactId: string) => void;
  onFetchFullArtifact: (artifactId: string) => void;
  onFetchRecentSignals: () => void;
}

export const ChatInspectorPanel: React.FC<ChatInspectorPanelProps> = ({
  rightPanelOpen,
  workspaceTitle,
  rightPanelSections,
  launchContextSummary,
  workspaceReports,
  workspaceSignals,
  latestAssistantMessage,
  sessionActions,
  expandedArtifactIds,
  sectionScrollClassName,
  formatDateTime,
  onToggleSection,
  onToggleArtifactCard,
  onFetchArtifactSummary,
  onFetchFullArtifact,
  onFetchRecentSignals,
}) => {
  const railSectionScrollClassName = sectionScrollClassName || CHROME_RAIL_SECTION_SCROLL_CLASS;
  const sections: GlobalInspectorSection[] = [];

  if (launchContextSummary) {
    sections.push({
      id: 'launchContext',
      title: launchContextSummary.label,
      icon: FileText,
      isOpen: rightPanelSections.launchContext,
      onToggle: () => onToggleSection('launchContext'),
      contentClassName: railSectionScrollClassName,
      content: (
        <div className="space-y-1 px-2 py-1">
          <div className={CHROME_THIN_NESTED_ITEM_CLASS}>
            <div className="osint-body-quiet leading-5 text-zinc-300">{launchContextSummary.title}</div>
            <p className={CHROME_NESTED_ITEM_BODY_CLASS}>{launchContextSummary.body}</p>
          </div>
        </div>
      ),
    });
  }

  sections.push({
    id: 'recentArtifacts',
    title: 'Recent Artifacts',
    count: Math.min(workspaceReports.length, 4),
    icon: PANEL_SECTION_ICONS.artifacts,
    isOpen: rightPanelSections.recentArtifacts,
    onToggle: () => onToggleSection('recentArtifacts'),
    contentClassName: railSectionScrollClassName,
    content: (
      <div className="space-y-1">
        {workspaceReports.slice(0, 4).length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">
            No saved artifacts for this workspace yet.
          </p>
        ) : (
          workspaceReports.slice(0, 4).map((artifact) => {
            const artifactKey = artifact.id || artifact.topic;
            const isExpanded = !!expandedArtifactIds[artifactKey];

            return (
              <div key={artifactKey} className="osint-panel-item">
                <button
                  type="button"
                  onClick={() => onToggleArtifactCard(artifactKey)}
                  className="osint-rail-item-trigger osint-meta-label-strong flex min-h-[34px] w-full items-start justify-between gap-2 px-2.5 py-1.5 text-left text-[11px] text-zinc-300"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate osint-body-quiet leading-5 text-zinc-300">
                      {artifact.topic}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-zinc-500" />
                  )}
                </button>
                {isExpanded ? (
                  <div className="border-t border-zinc-800/70 p-1.5">
                    <p className={CHROME_NESTED_ITEM_BODY_CLASS}>{artifact.summary}</p>
                    <div className={getChromeThinActionRowClassName(2)}>
                      <button
                        type="button"
                        onClick={() => artifact.id && onFetchArtifactSummary(artifact.id)}
                        className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                      >
                        Summary
                      </button>
                      <button
                        type="button"
                        onClick={() => artifact.id && onFetchFullArtifact(artifact.id)}
                        className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                      >
                        Full Text
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    ),
  });

  sections.push({
    id: 'recentSignals',
    title: 'Recent Signals',
    count: Math.min(workspaceSignals.length, 4),
    icon: PANEL_SECTION_ICONS.signals,
    isOpen: rightPanelSections.recentSignals,
    onToggle: () => onToggleSection('recentSignals'),
    contentClassName: railSectionScrollClassName,
    content: (
      <div className="space-y-1">
        <div className="flex">
          <button
            type="button"
            onClick={onFetchRecentSignals}
            className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
          >
            Pin To Chat
          </button>
        </div>
        {workspaceSignals.slice(0, 4).length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">
            No saved signals linked to this workspace.
          </p>
        ) : (
          workspaceSignals.slice(0, 4).map((signal) => (
            <div key={signal.id} className={CHROME_THIN_NESTED_ITEM_CLASS}>
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate osint-body-quiet leading-5 text-zinc-300">
                    {signal.source || signal.type}
                  </div>
                  <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>
                    <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>{signal.type}</span>
                  </div>
                </div>
              </div>
              <p className={CHROME_NESTED_ITEM_BODY_CLASS}>{signal.content}</p>
            </div>
          ))
        )}
      </div>
    ),
  });

  if (latestAssistantMessage?.attachments?.length) {
    sections.push({
      id: 'latestRetrieval',
      title: 'Latest Retrieval',
      count: latestAssistantMessage.attachments.length,
      icon: FileSearch,
      isOpen: rightPanelSections.latestRetrieval,
      onToggle: () => onToggleSection('latestRetrieval'),
      contentClassName: railSectionScrollClassName,
      content: (
        <div className="space-y-1">
          {latestAssistantMessage.attachments.map((attachment) => (
            <div key={attachment.id} className={CHROME_THIN_NESTED_ITEM_CLASS}>
              <div className="osint-body-quiet leading-5 text-zinc-300">{attachment.title}</div>
              {attachment.snippet ? (
                <p className={CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS}>{attachment.snippet}</p>
              ) : null}
            </div>
          ))}
        </div>
      ),
    });
  }

  sections.push({
    id: 'actionLog',
    title: 'Action Log',
    count: Math.min(sessionActions.length, 8),
    icon: Workflow,
    isOpen: rightPanelSections.actionLog,
    onToggle: () => onToggleSection('actionLog'),
    contentClassName: railSectionScrollClassName,
    content: (
      <div className="space-y-1">
        {sessionActions.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">No chat actions recorded yet.</p>
        ) : (
          sessionActions.slice(0, 8).map((action) => (
            <div key={action.id} className={CHROME_THIN_NESTED_ITEM_CLASS}>
              <div className="osint-body-quiet leading-5 text-zinc-300">{action.type}</div>
              <div className={CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS}>
                {formatDateTime(action.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    ),
  });

  return (
    <GlobalInspectorPanel
      isOpen={rightPanelOpen}
      eyebrow="Context"
      title={workspaceTitle || 'Workspace Chat'}
      subtitle="Workspace chat context"
      sections={sections}
      emptyState={{
        icon: MessageSquare,
        title: 'No Chat Context',
        description:
          'Start a workspace chat to inspect launch context, recent artifacts, recent signals, and retrieval history here.',
      }}
    />
  );
};
