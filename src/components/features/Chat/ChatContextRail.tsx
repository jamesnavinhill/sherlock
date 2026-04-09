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
import {
  CHROME_NESTED_ITEM_BADGE_CLASS,
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_HEADER_CLASS,
  CHROME_NESTED_ITEM_META_ROW_CLASS,
  CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';

interface LaunchContextSummary {
  label: string;
  title: string;
  body: string;
}

interface ChatContextRailProps {
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
  onToggleSection: (section: keyof ChatContextRailProps['rightPanelSections']) => void;
  onToggleArtifactCard: (artifactKey: string) => void;
  onFetchArtifactSummary: (artifactId: string) => void;
  onFetchFullArtifact: (artifactId: string) => void;
  onFetchRecentSignals: () => void;
}

export const ChatContextRail: React.FC<ChatContextRailProps> = ({
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

  return (
    <aside
      className={`osint-panel-shell ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full xl:w-0 xl:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 overflow-hidden border-l border-zinc-800 bg-black/95 shadow-2xl transition-all duration-300 xl:relative xl:z-0 xl:flex xl:flex-shrink-0 xl:flex-col xl:shadow-none ${rightPanelOpen ? 'xl:w-96' : 'xl:w-0'} backdrop-blur-md`}
    >
      <div className={CHROME_PANEL_HEADER_CLASS}>
        <div className="osint-eyebrow">Context</div>
        <h2 className="mt-1 osint-panel-title">{workspaceTitle || 'Workspace Chat'}</h2>
      </div>
      <div className={`${CHROME_RAIL_BODY_CLASS} bg-black/20`}>
      {launchContextSummary ? (
        <Accordion
          title={launchContextSummary.label}
          icon={FileText}
          isOpen={rightPanelSections.launchContext}
          onToggle={() => onToggleSection('launchContext')}
          className={getRailAccordionClassName(rightPanelSections.launchContext)}
          contentClassName={railSectionScrollClassName}
        >
          <div className="space-y-2 px-2 py-1">
            <div className={CHROME_THIN_NESTED_ITEM_CLASS}>
              <div className="osint-title-inline">{launchContextSummary.title}</div>
              <p className={CHROME_NESTED_ITEM_BODY_CLASS}>{launchContextSummary.body}</p>
            </div>
          </div>
        </Accordion>
      ) : null}

      <Accordion
        title="Recent Artifacts"
        count={Math.min(workspaceReports.length, 4)}
        icon={PANEL_SECTION_ICONS.artifacts}
        isOpen={rightPanelSections.recentArtifacts}
        onToggle={() => onToggleSection('recentArtifacts')}
        className={getRailAccordionClassName(rightPanelSections.recentArtifacts)}
        contentClassName={railSectionScrollClassName}
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
                <div
                  key={artifactKey}
                  className={CHROME_THIN_NESTED_ITEM_CLASS}
                  data-active={isExpanded}
                >
                  <button
                    type="button"
                    onClick={() => onToggleArtifactCard(artifactKey)}
                    className={`w-full text-left ${CHROME_NESTED_ITEM_HEADER_CLASS}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate osint-meta-value text-zinc-200">{artifact.topic}</div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
                    )}
                  </button>
                  {isExpanded ? (
                    <>
                      <p className={CHROME_NESTED_ITEM_BODY_CLASS}>{artifact.summary}</p>
                      <div className={getChromeThinActionRowClassName(2)}>
                        <button
                          onClick={() => artifact.id && onFetchArtifactSummary(artifact.id)}
                          className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                        >
                          Summary
                        </button>
                        <button
                          onClick={() => artifact.id && onFetchFullArtifact(artifact.id)}
                          className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                        >
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
        icon={PANEL_SECTION_ICONS.signals}
        isOpen={rightPanelSections.recentSignals}
        onToggle={() => onToggleSection('recentSignals')}
        className={getRailAccordionClassName(rightPanelSections.recentSignals)}
        contentClassName={railSectionScrollClassName}
      >
        <div className="space-y-2">
          <div className="flex">
            <button
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
                  <div className={CHROME_NESTED_ITEM_HEADER_CLASS}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate osint-meta-value text-zinc-200">
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
      </Accordion>

      {latestAssistantMessage?.attachments?.length ? (
        <Accordion
          title="Latest Retrieval"
          count={latestAssistantMessage.attachments.length}
          icon={FileSearch}
          isOpen={rightPanelSections.latestRetrieval}
          onToggle={() => onToggleSection('latestRetrieval')}
          className={getRailAccordionClassName(rightPanelSections.latestRetrieval)}
          contentClassName={railSectionScrollClassName}
        >
          <div className="space-y-2">
            {latestAssistantMessage.attachments.map((attachment) => (
              <div key={attachment.id} className={CHROME_THIN_NESTED_ITEM_CLASS}>
                <div className="osint-meta-value text-zinc-200">{attachment.title}</div>
                {attachment.snippet ? (
                  <p className={CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS}>{attachment.snippet}</p>
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
        className={getRailAccordionClassName(rightPanelSections.actionLog)}
        contentClassName={railSectionScrollClassName}
      >
        <div className="space-y-2">
          {sessionActions.length === 0 ? (
            <p className="px-2 py-1 osint-body-quiet italic">
              No chat actions recorded yet.
            </p>
          ) : (
            sessionActions.slice(0, 8).map((action) => (
              <div key={action.id} className={CHROME_THIN_NESTED_ITEM_CLASS}>
                <div className="osint-meta-value text-zinc-200">{action.type}</div>
                <div className={CHROME_NESTED_ITEM_SUPPORTING_BODY_CLASS}>
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
};
