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
  formatDateTime,
  onToggleSection,
  onToggleArtifactCard,
  onFetchArtifactSummary,
  onFetchFullArtifact,
  onFetchRecentSignals,
}) => (
  <aside
    className={`${rightPanelOpen ? 'translate-x-0' : 'translate-x-full xl:w-0 xl:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 overflow-hidden border-l border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 xl:relative xl:z-0 xl:flex xl:flex-shrink-0 xl:flex-col xl:shadow-none ${rightPanelOpen ? 'xl:w-96' : 'xl:w-0'} backdrop-blur-md`}
  >
    <div className="border-b border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="text-base font-bold text-white">Context</h2>
    </div>
    <div className="flex-1 overflow-y-auto bg-black/20 p-2 custom-scrollbar">
      {launchContextSummary ? (
        <Accordion
          title={launchContextSummary.label}
          icon={FileText}
          isOpen={rightPanelSections.launchContext}
          onToggle={() => onToggleSection('launchContext')}
        >
          <div className="space-y-2 px-2 py-1 text-xs text-zinc-400">
            <div className="text-sm text-white">{launchContextSummary.title}</div>
            <p className="leading-5">{launchContextSummary.body}</p>
          </div>
        </Accordion>
      ) : null}

      <Accordion
        title="Recent Artifacts"
        count={Math.min(workspaceReports.length, 4)}
        icon={FileText}
        isOpen={rightPanelSections.recentArtifacts}
        onToggle={() => onToggleSection('recentArtifacts')}
      >
        <div className="space-y-2">
          {workspaceReports.slice(0, 4).length === 0 ? (
            <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
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
                    <div className="text-sm text-zinc-200">{artifact.topic}</div>
                    {isExpanded ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {isExpanded ? (
                    <>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{artifact.summary}</p>
                      <div className="mt-2 flex gap-3">
                        <button
                          onClick={() => artifact.id && onFetchArtifactSummary(artifact.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
                        >
                          <FileText className="h-3 w-3" />
                          Summary
                        </button>
                        <button
                          onClick={() => artifact.id && onFetchFullArtifact(artifact.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
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
      >
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              onClick={onFetchRecentSignals}
              className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-500 transition hover:text-osint-primary"
            >
              <FileSearch className="h-3 w-3" />
              Pin To Chat
            </button>
          </div>
          {workspaceSignals.slice(0, 4).length === 0 ? (
            <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
              No saved signals linked to this workspace.
            </p>
          ) : (
            workspaceSignals.slice(0, 4).map((signal) => (
              <div key={signal.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="text-sm text-zinc-200">{signal.source || signal.type}</div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{signal.content}</p>
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
        >
          <div className="space-y-2">
            {latestAssistantMessage.attachments.map((attachment) => (
              <div key={attachment.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="text-sm text-zinc-200">{attachment.title}</div>
                {attachment.snippet ? (
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{attachment.snippet}</p>
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
      >
        <div className="space-y-2">
          {sessionActions.length === 0 ? (
            <p className="px-2 py-1 text-[10px] font-mono italic text-zinc-600">
              No chat actions recorded yet.
            </p>
          ) : (
            sessionActions.slice(0, 8).map((action) => (
              <div key={action.id} className="border border-zinc-800 bg-zinc-900/20 p-2">
                <div className="text-[10px] font-mono uppercase text-zinc-400">{action.type}</div>
                <div className="mt-1 text-[10px] text-zinc-600">
                  {formatDateTime(action.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </Accordion>
    </div>
  </aside>
);
