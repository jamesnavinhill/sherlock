import React from 'react';
import { Activity, Clock3, MessageSquare } from 'lucide-react';

import type { TimelineEvent } from '@/types';
import { LibraryRailSections } from '@/components/features/LibraryRail/LibraryRailSections';
import { LibraryRailShell } from '@/components/features/LibraryRail/LibraryRailShell';
import type { LibraryRailSection } from '@/components/features/LibraryRail/libraryRailTypes';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';
import { getLatestTimelineActivity, getTrackCount } from './timelineEvents';
import { getFocusedButtonClass, TRACK_OPTIONS, type DossierSections } from './timelineViewUtils';

interface LabelProfileLike {
  artifactLabel: string;
  artifactLabelPlural: string;
}

interface TimelineLibraryRailProps {
  isOpen: boolean;
  workspaceTitle: string;
  labelProfile: LabelProfileLike;
  dossierSections: DossierSections;
  allTimelineEvents: TimelineEvent[];
  runItems: TimelineEvent[];
  artifactItems: TimelineEvent[];
  signalItems: TimelineEvent[];
  entityItems: TimelineEvent[];
  chatSessionItems: TimelineEvent[];
  focusedTrack?: string;
  focusedRefId?: string;
  onToggleSection: (section: keyof DossierSections) => void;
  onSetTrackFocus: (track: 'ALL' | (typeof TRACK_OPTIONS)[number]['track']) => void;
  onFocusReference: (track: (typeof TRACK_OPTIONS)[number]['track'], refId: string) => void;
}

export const TimelineLibraryRail: React.FC<TimelineLibraryRailProps> = ({
  isOpen,
  workspaceTitle,
  labelProfile,
  dossierSections,
  allTimelineEvents,
  runItems,
  artifactItems,
  signalItems,
  entityItems,
  chatSessionItems,
  focusedTrack,
  focusedRefId,
  onToggleSection,
  onSetTrackFocus,
  onFocusReference,
}) => {
  const latestActivity = getLatestTimelineActivity(allTimelineEvents);

  const buildReferenceEntries = (
    items: TimelineEvent[],
    track: (typeof TRACK_OPTIONS)[number]['track']
  ) =>
    items.map((item) => {
      const refId = item.refId;

      return {
        id: `${track}-${refId || item.id}`,
        title: item.title,
        onClick: refId ? () => onFocusReference(track, refId) : undefined,
        isActive: focusedRefId === refId,
      };
    });

  const sections: LibraryRailSection[] = [
    {
      id: 'events',
      title: 'Events',
      icon: Clock3,
      count: allTimelineEvents.length,
      isOpen: dossierSections.events,
      onToggle: () => onToggleSection('events'),
      content: (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onSetTrackFocus('ALL')}
            className={getFocusedButtonClass(focusedTrack === 'ALL' && !focusedRefId)}
          >
            All Activity
          </button>
          {TRACK_OPTIONS.map((option) => (
            <button
              key={option.track}
              type="button"
              onClick={() => onSetTrackFocus(option.track)}
              className={getFocusedButtonClass(focusedTrack === option.track && !focusedRefId)}
            >
              {option.label} ({getTrackCount(allTimelineEvents, option.track)})
            </button>
          ))}
        </div>
      ),
    },
    {
      id: 'runs',
      title: 'Runs',
      icon: Activity,
      count: runItems.length,
      isOpen: dossierSections.runs,
      onToggle: () => onToggleSection('runs'),
      entries: buildReferenceEntries(runItems, 'RUN'),
      emptyState: <div className="px-3 py-2 osint-body-quiet">No workspace runs available yet.</div>,
    },
    {
      id: 'artifacts',
      title: labelProfile.artifactLabelPlural,
      icon: PANEL_SECTION_ICONS.artifacts,
      count: artifactItems.length,
      isOpen: dossierSections.artifacts,
      onToggle: () => onToggleSection('artifacts'),
      entries: buildReferenceEntries(artifactItems, 'ARTIFACT'),
      emptyState: (
        <div className="px-3 py-2 osint-body-quiet">
          No saved {labelProfile.artifactLabelPlural.toLowerCase()} yet.
        </div>
      ),
    },
    {
      id: 'signals',
      title: 'Signals',
      icon: PANEL_SECTION_ICONS.signals,
      count: signalItems.length,
      isOpen: dossierSections.signals,
      onToggle: () => onToggleSection('signals'),
      entries: buildReferenceEntries(signalItems, 'SIGNAL'),
      emptyState: (
        <div className="px-3 py-2 osint-body-quiet">No saved signals in this workspace yet.</div>
      ),
    },
    {
      id: 'entities',
      title: 'Entities',
      icon: PANEL_SECTION_ICONS.entities,
      count: entityItems.length,
      isOpen: dossierSections.entities,
      onToggle: () => onToggleSection('entities'),
      entries: buildReferenceEntries(entityItems, 'ENTITY'),
      emptyState: (
        <div className="px-3 py-2 osint-body-quiet">
          No entity milestones in this workspace yet.
        </div>
      ),
    },
    {
      id: 'chats',
      title: 'Chats',
      icon: MessageSquare,
      count: chatSessionItems.length,
      isOpen: dossierSections.chats,
      onToggle: () => onToggleSection('chats'),
      entries: buildReferenceEntries(chatSessionItems, 'CHAT'),
      emptyState: (
        <div className="px-3 py-2 osint-body-quiet">No workspace chats available yet.</div>
      ),
    },
  ];

  return (
    <LibraryRailShell
      isOpen={isOpen}
      eyebrow="Library"
      title={workspaceTitle}
      summary={
        latestActivity ? (
          <div className="osint-meta-label text-zinc-500">Latest activity {latestActivity}</div>
        ) : undefined
      }
    >
      <LibraryRailSections sections={sections} />
    </LibraryRailShell>
  );
};
