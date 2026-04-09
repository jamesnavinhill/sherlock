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
import { GlobalInspectorPanel } from '@/components/features/Inspector/GlobalInspectorPanel';
import type { GlobalInspectorSection } from '@/components/features/Inspector/globalInspectorTypes';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '@/domain';
import {
  formatEventTime,
  getEventIcon,
  getMetadataValue,
  type DetailSections,
} from './timelineViewUtils';

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
}) => {
  const sections: GlobalInspectorSection[] = selectedEvent
    ? [
        {
          id: 'summary',
          title: 'Summary',
          icon: Clock3,
          isOpen: detailSections.summary,
          onToggle: onToggleSummary,
          content: (
            <div className="space-y-3 px-1 py-1 osint-meta-value">
              <div>
                <div className="osint-meta-label">Track</div>
                <div className="mt-1">{selectedEvent.track}</div>
              </div>
              <div>
                <div className="osint-meta-label">Type</div>
                <div className="mt-1">{selectedEvent.type}</div>
              </div>
              <div>
                <div className="osint-meta-label">Occurred</div>
                <div className="mt-1">
                  {selectedEvent.occurredAt > 0
                    ? new Date(selectedEvent.occurredAt).toLocaleString()
                    : 'No canonical timestamp available'}
                </div>
              </div>
              {selectedEvent.summary ? (
                <div>
                  <div className="osint-meta-label">Summary</div>
                  <div className="mt-1 osint-body-muted">{selectedEvent.summary}</div>
                </div>
              ) : null}
            </div>
          ),
        },
        {
          id: 'context',
          title: 'Event Context',
          icon: Workflow,
          isOpen: detailSections.context,
          onToggle: onToggleContext,
          content: (
            <div className="space-y-3 px-1 py-1 osint-meta-value">
              <div>
                <div className="osint-meta-label">Workspace</div>
                <div className="mt-1">
                  {activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : 'Unknown'}
                </div>
              </div>
              {selectedWorkspaceItem ? (
                <div>
                  <div className="osint-meta-label">Workspace Item</div>
                  <div className="mt-1">{selectedWorkspaceItem.title}</div>
                </div>
              ) : null}
              {selectedChatSession ? (
                <div>
                  <div className="osint-meta-label">Chat Session</div>
                  <div className="mt-1">{selectedChatSession.title || 'Workspace Chat'}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem?.url ? (
                <div>
                  <div className="osint-meta-label">Linked Source</div>
                  <div className="mt-1 break-all">{selectedWorkspaceItem.url}</div>
                </div>
              ) : null}
              {selectedWorkspaceItem?.provenance?.source ? (
                <div>
                  <div className="osint-meta-label">Item Provenance</div>
                  <div className="mt-1">{selectedWorkspaceItem.provenance.source}</div>
                </div>
              ) : null}
              {selectedEntityName ? (
                <div>
                  <div className="osint-meta-label">Entity</div>
                  <div className="mt-1">{selectedEntityName}</div>
                </div>
              ) : null}
              {selectedArtifact ? (
                <div>
                  <div className="osint-meta-label">Related {labelProfile.artifactLabel}</div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedArtifact.topic)}</div>
                </div>
              ) : null}
              {parentArtifact ? (
                <div>
                  <div className="osint-meta-label">Parent {labelProfile.artifactLabel}</div>
                  <div className="mt-1">{sanitizeDisplayTitle(parentArtifact.topic)}</div>
                </div>
              ) : null}
              {relatedSignal ? (
                <div>
                  <div className="osint-meta-label">Origin Signal</div>
                  <div className="mt-1">{relatedSignal.content}</div>
                </div>
              ) : null}
              {selectedRun ? (
                <div>
                  <div className="osint-meta-label">Source Run</div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedRun.topic)}</div>
                </div>
              ) : null}
              {selectedChatLaunchContext?.entityName ? (
                <div>
                  <div className="osint-meta-label">Pinned Entity</div>
                  <div className="mt-1">{selectedChatLaunchContext.entityName}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'mentionCount') === 'number' ? (
                <div>
                  <div className="osint-meta-label">Artifact Mentions</div>
                  <div className="mt-1">{getMetadataValue<number>(selectedEvent, 'mentionCount')}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'threshold') === 'number' ? (
                <div>
                  <div className="osint-meta-label">Milestone Threshold</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'threshold')} mentions
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'daysSincePrevious') ? (
                <div>
                  <div className="osint-meta-label">Gap Since Previous</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'daysSincePrevious')}
                  </div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.query === 'string' ? (
                <div>
                  <div className="osint-meta-label">Workspace Query</div>
                  <div className="mt-1">{selectedChatAction.input.query}</div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.topic === 'string' ? (
                <div>
                  <div className="osint-meta-label">Requested Topic</div>
                  <div className="mt-1">{selectedChatAction.input.topic}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'citedSnippetCount') === 'number' ? (
                <div>
                  <div className="osint-meta-label">Citations Used</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'citedSnippetCount')}
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'source') ? (
                <div>
                  <div className="osint-meta-label">Source</div>
                  <div className="mt-1">{getMetadataValue<string>(selectedEvent, 'source')}</div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'launchSource') ? (
                <div>
                  <div className="osint-meta-label">Launch Source</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'launchSource')}
                  </div>
                </div>
              ) : null}
              {selectedEvent.badges?.length ? (
                <div>
                  <div className="osint-meta-label">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEvent.badges.map((badge) => (
                      <span
                        key={`${selectedEvent.id}-detail-${badge}`}
                        className="border border-zinc-700 bg-black px-2 py-1 osint-meta-label"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ),
        },
      ]
    : [];

  return (
    <GlobalInspectorPanel
      isOpen={isOpen}
      eyebrow="Inspector"
      title={selectedEvent ? selectedEvent.title : 'No Event Selected'}
      subtitle={
        selectedEvent
          ? `${selectedEvent.track} event${
              selectedEvent.occurredAt > 0 ? ` - ${formatEventTime(selectedEvent.occurredAt)}` : ''
            }`
          : 'Timeline context'
      }
      headerIcon={
        selectedEvent ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200">
            {React.createElement(getEventIcon(selectedEvent), { className: 'h-4 w-4' })}
          </div>
        ) : null
      }
      actionItems={selectedEvent ? detailActions : []}
      sections={sections}
      emptyState={{
        icon: MessageSquare,
        title: 'Select An Event',
        description:
          'Pick a signal, run, artifact, entity milestone, or chat event from the chronology to inspect its context and jump into related workspace views.',
      }}
    />
  );
};
