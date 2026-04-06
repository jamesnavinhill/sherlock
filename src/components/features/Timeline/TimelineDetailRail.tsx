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
  WorkspaceRun,
} from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { InspectorActionRow, type InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { sanitizeDisplayTitle } from '@/domain';
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
    <div className="border-b border-zinc-800 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
        Event Details
      </div>
      <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
        {selectedEvent ? selectedEvent.title : 'No event selected'}
      </div>
    </div>
    {selectedEvent && detailActions.length > 0 ? (
      <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
        <InspectorActionRow actions={detailActions} />
      </div>
    ) : null}

    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
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
          >
            <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
              <div>
                <div className="text-[10px] uppercase text-zinc-500">Type</div>
                <div className="mt-1">{selectedEvent.type}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-zinc-500">Occurred</div>
                <div className="mt-1">
                  {selectedEvent.occurredAt > 0
                    ? new Date(selectedEvent.occurredAt).toLocaleString()
                    : 'No canonical timestamp available'}
                </div>
              </div>
              {selectedEvent.summary ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Summary</div>
                  <div className="mt-1 leading-relaxed text-zinc-400">{selectedEvent.summary}</div>
                </div>
              ) : null}
            </div>
          </Accordion>

          <Accordion
            title="Context"
            icon={Workflow}
            isOpen={detailSections.context}
            onToggle={onToggleContext}
          >
            <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
              <div>
                <div className="text-[10px] uppercase text-zinc-500">Workspace</div>
                <div className="mt-1">
                  {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Unknown'}
                </div>
              </div>
              {selectedChatSession ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                  <div className="mt-1">{selectedChatSession.title || 'Workspace Chat'}</div>
                </div>
              ) : null}
              {selectedEntityName ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Entity</div>
                  <div className="mt-1">{selectedEntityName}</div>
                </div>
              ) : null}
              {selectedArtifact ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">
                    Related {labelProfile.artifactLabel}
                  </div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedArtifact.topic)}</div>
                </div>
              ) : null}
              {parentArtifact ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">
                    Parent {labelProfile.artifactLabel}
                  </div>
                  <div className="mt-1">{sanitizeDisplayTitle(parentArtifact.topic)}</div>
                </div>
              ) : null}
              {relatedSignal ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Origin Signal</div>
                  <div className="mt-1">{relatedSignal.content}</div>
                </div>
              ) : null}
              {selectedRun ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source Run</div>
                  <div className="mt-1">{sanitizeDisplayTitle(selectedRun.topic)}</div>
                </div>
              ) : null}
              {selectedChatLaunchContext?.entityName ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Pinned Entity</div>
                  <div className="mt-1">{selectedChatLaunchContext.entityName}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'mentionCount') === 'number' ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Artifact Mentions</div>
                  <div className="mt-1">{getMetadataValue<number>(selectedEvent, 'mentionCount')}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'threshold') === 'number' ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Milestone Threshold</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'threshold')} mentions
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'daysSincePrevious') ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Gap Since Previous</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'daysSincePrevious')}
                  </div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.query === 'string' ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Workspace Query</div>
                  <div className="mt-1">{selectedChatAction.input.query}</div>
                </div>
              ) : null}
              {typeof selectedChatAction?.input?.topic === 'string' ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Requested Topic</div>
                  <div className="mt-1">{selectedChatAction.input.topic}</div>
                </div>
              ) : null}
              {typeof getMetadataValue<number>(selectedEvent, 'citedSnippetCount') === 'number' ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Citations Used</div>
                  <div className="mt-1">
                    {getMetadataValue<number>(selectedEvent, 'citedSnippetCount')}
                  </div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'source') ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Source</div>
                  <div className="mt-1">{getMetadataValue<string>(selectedEvent, 'source')}</div>
                </div>
              ) : null}
              {getMetadataValue<string>(selectedEvent, 'launchSource') ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Launch Source</div>
                  <div className="mt-1">
                    {getMetadataValue<string>(selectedEvent, 'launchSource')}
                  </div>
                </div>
              ) : null}
              {selectedEvent.badges?.length ? (
                <div>
                  <div className="text-[10px] uppercase text-zinc-500">Tags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedEvent.badges.map((badge) => (
                      <span
                        key={`${selectedEvent.id}-detail-${badge}`}
                        className="border border-zinc-700 bg-black px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400"
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
