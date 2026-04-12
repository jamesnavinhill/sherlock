import React from 'react';
import { Clock3 } from 'lucide-react';

import type { LabelProfile, TimelineEvent, Workspace } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { MainContentDotGrid } from '@/components/ui/MainContentDotGrid';
import { CHROME_CARD_SURFACE_CLASS } from '@/components/ui/chrome';
import {
  formatEventTime,
  getEventIcon,
  getEventTone,
  getMetadataValue,
  getPrimaryRefId,
} from './timelineViewUtils';

interface TimelineEventGroup {
  label: string;
  events: TimelineEvent[];
}

interface TimelineEventListProps {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  visibleEvents: TimelineEvent[];
  groupedEvents: TimelineEventGroup[];
  labelProfile: LabelProfile;
  effectiveSelectedEventId: string | null;
  artifactTitleById: Map<string, string>;
  signalTitleById: Map<string, string>;
  chatTitleById: Map<string, string>;
  onClearFilters: () => void;
  onSelectEvent: (eventId: string) => void;
  onFocusReference: (track: TimelineEvent['track'], refId?: string) => void;
  onOpenArtifact: (artifactId?: string) => void;
  onOpenWorkspaceChat: (event: TimelineEvent) => void;
}

export const TimelineEventList: React.FC<TimelineEventListProps> = ({
  activeWorkspace,
  workspaces,
  visibleEvents,
  groupedEvents,
  labelProfile,
  effectiveSelectedEventId,
  artifactTitleById,
  signalTitleById,
  chatTitleById,
  onClearFilters,
  onSelectEvent,
  onFocusReference,
}) => (
  <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-r border-zinc-800 bg-black/70">
    <MainContentDotGrid testId="timeline-dot-grid-background" />
    <div
      className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar"
      data-app-scroll-region
    >
      {!activeWorkspace ? (
        <EmptyState
          icon={Clock3}
          title={workspaces.length === 0 ? 'Timeline Unavailable' : 'No Workspace Selected'}
          description={
            workspaces.length === 0
              ? 'Create a workspace first. Timeline becomes useful once Sherlock has saved signals, runs, artifacts, or chat activity.'
              : 'Select a workspace from the header to inspect its chronology.'
          }
        />
      ) : visibleEvents.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No Timeline Events"
          description="This workspace does not match the current search and filter selection yet, including any optional entity or chat chronology tracks."
          action={{
            label: 'Reset Timeline Filters',
            onClick: onClearFilters,
          }}
        />
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => (
            <section key={group.label}>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <div className="osint-eyebrow">{group.label}</div>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <div className="space-y-3">
                {group.events.map((event) => {
                  const EventIcon = getEventIcon(event);
                  const relatedArtifactId =
                    getPrimaryRefId(event, 'ARTIFACT') ||
                    getMetadataValue<string>(event, 'relatedArtifactId') ||
                    getMetadataValue<string>(event, 'linkedArtifactId');
                  const sourceSignalId = getMetadataValue<string>(event, 'sourceSignalId');
                  const previousArtifactId = getMetadataValue<string>(event, 'previousArtifactId');
                  const sessionId =
                    getPrimaryRefId(event, 'CHAT_SESSION') ||
                    getMetadataValue<string>(event, 'sessionId');
                  const isActive = effectiveSelectedEventId === event.id;

                  return (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
                          return;
                        }
                        keyboardEvent.preventDefault();
                        onSelectEvent(event.id);
                      }}
                      role="button"
                      tabIndex={0}
                      data-active={isActive ? 'true' : undefined}
                      className={`${CHROME_CARD_SURFACE_CLASS} group w-full p-4 text-left transition-all duration-200 ${
                        isActive
                          ? 'border-osint-primary bg-[var(--osint-rail-interaction-active-bg)] shadow-[var(--osint-rail-interaction-shadow)]'
                          : 'hover:bg-[var(--osint-rail-interaction-hover-bg)] hover:shadow-[var(--osint-rail-interaction-shadow)]'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="osint-meta-label">
                              {formatEventTime(event.occurredAt)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 border px-2 py-1 osint-meta-label-strong ${getEventTone(event)}`}
                            >
                              <EventIcon className="h-3.5 w-3.5" />
                              {event.track}
                            </span>
                            {event.badges?.map((badge) => (
                              <span
                                key={`${event.id}-${badge}`}
                                className="border border-zinc-700 bg-black px-2 py-1 osint-meta-label text-zinc-500"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                          <div className={`mt-3 osint-title-inline transition-colors ${isActive ? 'text-osint-primary' : 'group-hover:text-osint-primary'}`}>{event.title}</div>
                          {event.summary ? (
                            <p className="mt-2 osint-body-small">{event.summary}</p>
                          ) : null}
                          {relatedArtifactId || sourceSignalId || previousArtifactId || sessionId ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {relatedArtifactId && event.track === 'ENTITY' ? (
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    onFocusReference('ARTIFACT', relatedArtifactId);
                                  }}
                                  className="border border-violet-500/30 bg-violet-500/5 px-2 py-1 osint-meta-label-strong text-violet-200 transition hover:border-violet-400 hover:text-white"
                                >
                                  In {artifactTitleById.get(relatedArtifactId) || labelProfile.artifactLabel}
                                </button>
                              ) : null}
                              {sourceSignalId ? (
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    onFocusReference('SIGNAL', sourceSignalId);
                                  }}
                                  className="border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 osint-meta-label-strong text-cyan-200 transition hover:border-cyan-400 hover:text-white"
                                >
                                  From {signalTitleById.get(sourceSignalId) || 'Signal'}
                                </button>
                              ) : null}
                              {previousArtifactId ? (
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    onFocusReference('ARTIFACT', previousArtifactId);
                                  }}
                                  className="border border-indigo-500/30 bg-indigo-500/5 px-2 py-1 osint-meta-label-strong text-indigo-200 transition hover:border-indigo-400 hover:text-white"
                                >
                                  Previous {artifactTitleById.get(previousArtifactId) || labelProfile.artifactLabel}
                                </button>
                              ) : null}
                              {sessionId && event.track !== 'CHAT' ? (
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    onFocusReference('CHAT', sessionId);
                                  }}
                                  className="border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 osint-meta-label-strong text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                                >
                                  Chat {chatTitleById.get(sessionId) || 'Session'}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  </main>
);
