import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileSearch,
  FileText,
  Workflow,
} from 'lucide-react';

import type { AgentAction, Artifact, ChatMessage, Signal } from '@/types';
import { Accordion } from '@/components/ui/Accordion';

interface LaunchContextSummary {
  label: string;
  title: string;
  body: string;
}

interface ChatContextRailProps {
  rightPanelOpen: boolean;
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
  onToggleSection: (section: keyof ChatContextRailProps['rightPanelSections']) => void;
  onToggleArtifactCard: (artifactKey: string) => void;
  onFetchArtifactSummary: (artifactId: string) => void;
  onFetchFullArtifact: (artifactId: string) => void;
  onFetchRecentSignals: () => void;
}

export const ChatContextRail: React.FC<ChatContextRailProps> = ({
  rightPanelOpen,
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
  const getAccordionClassName = (isOpen: boolean) =>
    isOpen ? 'mb-0 flex min-h-0 flex-1 flex-col' : 'mb-0 shrink-0';

  return (
    <aside
      className={`${rightPanelOpen ? 'translate-x-0' : 'translate-x-full xl:w-0 xl:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 overflow-hidden border-l border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 xl:relative xl:z-0 xl:flex xl:flex-shrink-0 xl:flex-col xl:shadow-none ${rightPanelOpen ? 'xl:w-96' : 'xl:w-0'} backdrop-blur-md`}
    >
      <div className="border-b border-zinc-800 bg-zinc-900/30 p-4">
        <h2 className="osint-panel-title text-white">Context</h2>
      </div>
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-black/20 p-2">
      {launchContextSummary ? (
        <Accordion
          title={launchContextSummary.label}
          icon={FileText}
          isOpen={rightPanelSections.launchContext}
          onToggle={() => onToggleSection('launchContext')}
          className={getAccordionClassName(rightPanelSections.launchContext)}
          contentClassName={sectionScrollClassName}
        >
          <div className="space-y-2 px-2 py-1">
            <div className="osint-panel-title text-white">{launchContextSummary.title}</div>
            <p className="osint-body-muted">{launchContextSummary.body}</p>
          </div>
        </Accordion>
      ) : null}

      <Accordion
        title="Recent Artifacts"
        count={Math.min(workspaceReports.length, 4)}
        icon={FileText}
        isOpen={rightPanelSections.recentArtifacts}
        onToggle={() => onToggleSection('recentArtifacts')}
        className={getAccordionClassName(rightPanelSections.recentArtifacts)}
        contentClassName={sectionScrollClassName}
      >
        <div className="space-y-2">
          {workspaceReports.slice(0, 4).length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              No saved artifacts for this workspace yet.
            </p>
          ) : (
            workspaceReports.slice(0, 4).map((artifact) => {
              const artifactKey = artifact.id || artifact.topic;
              const isExpanded = !!expandedArtifactIds[artifactKey];

              return (
                <div key={artifactKey} className="border border-zinc-800 bg-zinc-900/20 p-2">
                  <button
                    type="button"
                    onClick={() => onToggleArtifactCard(artifactKey)}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div className="osint-panel-title text-zinc-200">{artifact.topic}</div>
                    {isExpanded ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {isExpanded ? (
                    <>
                      <p className="mt-1 osint-body-muted">{artifact.summary}</p>
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => artifact.id && onFetchArtifactSummary(artifact.id)}
                          className="inline-flex items-center gap-1 osint-meta-label text-zinc-500 transition hover:text-osint-primary"
                        >
                          <FileText className="h-3 w-3" />
                          Summary
                        </button>
                        <button
                          onClick={() => artifact.id && onFetchFullArtifact(artifact.id)}
                          className="inline-flex items-center gap-1 osint-meta-label text-zinc-500 transition hover:text-osint-primary"
                        >
                          <FileSearch className="h-3 w-3" />
                          Full Text
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </Accordion>

      <Accordion
        title="Recent Signals"
        count={Math.min(workspaceSignals.length, 4)}
        icon={FileSearch}
        isOpen={rightPanelSections.recentSignals}
        onToggle={() => onToggleSection('recentSignals')}
        className={getAccordionClassName(rightPanelSections.recentSignals)}
        contentClassName={sectionScrollClassName}
      >
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={onFetchRecentSignals}
              className="inline-flex items-center gap-1 osint-meta-label text-zinc-500 transition hover:text-osint-primary"
            >
              <FileSearch className="h-3 w-3" />
              Pin To Chat
            </button>
          </div>
          {workspaceSignals.slice(0, 4).length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              No saved signals linked to this workspace.
            </p>
          ) : (
            workspaceSignals.slice(0, 4).map((signal) => (
              <div key={signal.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="osint-panel-title text-zinc-200">{signal.source || signal.type}</div>
                <p className="mt-1 osint-body-muted">{signal.content}</p>
              </div>
            ))
          )}
        </div>
      </Accordion>

      {latestAssistantMessage?.attachments?.length ? (
        <Accordion
          title="Latest Retrieval"
          count={latestAssistantMessage.attachments.length}
          icon={FileSearch}
          isOpen={rightPanelSections.latestRetrieval}
          onToggle={() => onToggleSection('latestRetrieval')}
          className={getAccordionClassName(rightPanelSections.latestRetrieval)}
          contentClassName={sectionScrollClassName}
        >
          <div className="space-y-2">
            {latestAssistantMessage.attachments.map((attachment) => (
              <div key={attachment.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="osint-panel-title text-zinc-200">{attachment.title}</div>
                {attachment.snippet ? (
                  <p className="mt-1 osint-body-muted">{attachment.snippet}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Accordion>
      ) : null}

      <Accordion
        title="Action Log"
        count={Math.min(sessionActions.length, 8)}
        icon={Workflow}
        isOpen={rightPanelSections.actionLog}
        onToggle={() => onToggleSection('actionLog')}
        className={getAccordionClassName(rightPanelSections.actionLog)}
        contentClassName={sectionScrollClassName}
      >
        <div className="space-y-2">
          {sessionActions.length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              No chat actions recorded yet.
            </p>
          ) : (
            sessionActions.slice(0, 8).map((action) => (
              <div key={action.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="osint-meta-label-strong text-zinc-300">{action.type}</div>
                <div className="mt-1 osint-body-quiet">{formatDateTime(action.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </Accordion>
      </div>
    </aside>
  );
};
