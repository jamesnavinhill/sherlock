import React from 'react';
import { Clock3, MessageSquare, Workflow } from 'lucide-react';

import type {
  AgentAction,
  Artifact,
  ChatLaunchContext,
  ChatSession,
  LabelProfile,
  Signal,
  TimelineEvent,
  Workspace,
  WorkspaceItem,
  WorkspaceRun,
} from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import {
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  CHROME_NESTED_ITEM_BADGE_CLASS,
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_CLASS,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '@/domain';
import { getMetadataValue, type DetailSections } from './timelineViewUtils';

interface TimelineDetailRailProps {
  isOpen: boolean;
  selectedEvent: TimelineEvent | null;
  detailSections: DetailSections;
  detailActions: InspectorActionItem[];
  activeWorkspace: Workspace | null;
  selectedChatSession: ChatSession | null;
  selectedEntityName: string | null;
  selectedArtifact: Artifact | null;
  parentArtifact: Artifact | null;
  relatedSignal: Signal | null;
  selectedRun: WorkspaceRun | null;
  selectedWorkspaceItem: WorkspaceItem | null;
  selectedChatLaunchContext: ChatLaunchContext | null;
  selectedChatAction: AgentAction | null;
  labelProfile: LabelProfile;
  onToggleSummary: () => void;
  onToggleContext: () => void;
}

export const TimelineDetailRail: React.FC<TimelineDetailRailProps> = ({
  isOpen,
  selectedEvent,
  detailSections,
  detailActions,
  activeWorkspace,
  selectedChatSession,
  selectedEntityName,
  selectedArtifact,
  parentArtifact,
  relatedSignal,
  selectedRun,
  selectedWorkspaceItem,
  selectedChatLaunchContext,
  selectedChatAction,
  labelProfile,
  onToggleSummary,
  onToggleContext,
}) => (
  <aside
    className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
      isOpen
        ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0 border-l border-zinc-800'
        : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full border-l border-zinc-800 lg:w-0 lg:border-l-0'
    }`}
  >
    <div className={CHROME_PANEL_HEADER_CLASS}>
      <div className="osint-eyebrow">Details</div>
      <div className="mt-1 osint-panel-title">
        {selectedEvent ? selectedEvent.title : 'No Event Selected'}
      </div>
    </div>
    {selectedEvent && detailActions.length > 0 ? (
      <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
        <InspectorActionRow actions={detailActions} />
      </div>
    ) : null}

    <div className={CHROME_RAIL_BODY_CLASS}>
      {!selectedEvent ? (
        <EmptyState
          icon={MessageSquare}
          title="Select An Event"
          description="Pick a signal, run, artifact, entity milestone, or chat event from the chronology to inspect its context and jump into related workspace views."
          className="px-0 py-10"
          panelClassName="max-w-none px-6 py-8"
        />
      ) : (
        <>
          <Accordion
            title="Summary"
            icon={Clock3}
            isOpen={detailSections.summary}
            onToggle={onToggleSummary}
            className={getRailAccordionClassName(detailSections.summary)}
            contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
          >
            <div className="space-y-3 px-1 py-1 osint-meta-value">
              <div className={CHROME_NESTED_ITEM_CLASS}>
                <div className="osint-meta-label">Type</div>
                <div className="mt-1">{selectedEvent.type}</div>
              </div>
              <div className={CHROME_NESTED_ITEM_CLASS}>
                <div className="osint-meta-label">Occurred</div>
                <div className="mt-1">
                  {selectedEvent.occurredAt > 0
                    ? new Date(selectedEvent.occurredAt).toLocaleString()
                    : 'No canonical timestamp available'}
                </div>
              </div>
              {selectedEvent.summary ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Summary</div>
                  <div className={CHROME_NESTED_ITEM_BODY_CLASS}>{selectedEvent.summary}</div>
                </div>
              ) : null}
            </div>
          </Accordion>

          <Accordion
            title="Context"
            icon={Workflow}
            isOpen={detailSections.context}
            onToggle={onToggleContext}
            className={getRailAccordionClassName(detailSections.context)}
            contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
          >
            <div className="space-y-3 px-1 py-1 osint-meta-value">
              <div className={CHROME_NESTED_ITEM_CLASS}>
                <div className="osint-meta-label">Workspace</div>
                <div className="mt-1">
                  {activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : 'Unknown'}
                </div>
              </div>
              {selectedWorkspaceItem ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Workspace Item</div>
                  <div className="mt-1">{selectedWorkspaceItem.title}</div>
                </div>
              ) : null}
              {selectedChatSession ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Chat Session</div>
                  <div className="mt-1">{selectedChatSession.title || 'Workspace Chat'}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem?.url ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Linked Source</div>
                  <div className="mt-1 break-all">{selectedWorkspaceItem.url}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem?.provenance?.source ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Item Provenance</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.source}</div>
                </div>
              ) : null}
              {selectedEntityName ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Entity</div>
                  <div className="mt-1">{selectedEntityName}</div>
                </div>
              ) : null}
              {selectedArtifact ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">
                    Related {labelProfile.artifactLabel}
                  </div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedArtifact.topic)}</div>
                </div>
              ) : null}
              {parentArtifact ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">
                    Parent {labelProfile.artifactLabel}
                  </div>
                  <div className="mt-1">{sanitizeDisplayTitle(parentArtifact.topic)}</div>
                </div>
              ) : null}
              {relatedSignal ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Origin Signal</div>
                  <div className={CHROME_NESTED_ITEM_BODY_CLASS}>{relatedSignal.content}</div>
                </div>
              ) : null}
              {selectedRun ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Source Run</div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedRun.topic)}</div>
                </div>
              ) : null}
              {selectedChatLaunchContext?.entityName ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Pinned Entity</div>
                  <div className="mt-1">{selectedChatLaunchContext.entityName}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'mentionCount') === 'number' ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Artifact Mentions</div>
                  <div className="mt-1">{getMetadataValue<number>(selectedEvent, 'mentionCount')}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'threshold') === 'number' ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Milestone Threshold</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'threshold')} mentions
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'daysSincePrevious') ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Gap Since Previous</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'daysSincePrevious')}
                  </div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.query === 'string' ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Workspace Query</div>
                  <div className="mt-1">{selectedChatAction.input.query}</div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.topic === 'string' ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Requested Topic</div>
                  <div className="mt-1">{selectedChatAction.input.topic}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'citedSnippetCount') === 'number' ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Citations Used</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'citedSnippetCount')}
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'source') ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Source</div>
                  <div className="mt-1">{getMetadataValue<string>(selectedEvent, 'source')}</div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'launchSource') ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Launch Source</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'launchSource')}
                  </div>
                </div>
              ) : null}
              {selectedEvent.badges?.length ? (
                <div className={CHROME_NESTED_ITEM_CLASS}>
                  <div className="osint-meta-label">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEvent.badges.map((badge) => (
                      <span
                        key={`${selectedEvent.id}-detail-${badge}`}
                        className={CHROME_NESTED_ITEM_BADGE_CLASS}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Accordion>
        </>
      )}
    </div>
  </aside>
);
