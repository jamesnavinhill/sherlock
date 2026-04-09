import React from 'react';
import {
  Activity,
  Clock3,
  MessageSquare,
} from 'lucide-react';

import type { TimelineEvent } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import {
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import {
  getFocusedButtonClass,
  TRACK_OPTIONS,
  type DossierSections,
} from './timelineViewUtils';
import { getTrackCount } from './timelineEvents';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';

interface LabelProfileLike {
  artifactLabel: string;
  artifactLabelPlural: string;
}

interface TimelineDossierPanelProps {
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
  onSetTrackFocus: (track: 'ALL' | typeof TRACK_OPTIONS[number]['track']) => void;
  onFocusReference: (track: typeof TRACK_OPTIONS[number]['track'], refId: string) => void;
}

export const TimelineDossierPanel: React.FC<TimelineDossierPanelProps> = ({
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
}) => (
  <aside
    className={`osint-panel-shell absolute left-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
      isOpen
        ? 'w-[min(20rem,calc(100vw-1rem))] translate-x-0 border-r border-zinc-800'
        : 'w-[min(20rem,calc(100vw-1rem))] -translate-x-full border-r border-zinc-800 lg:w-0 lg:border-r-0'
    }`}
  >
    <div className={CHROME_PANEL_HEADER_CLASS}>
      <div className="osint-eyebrow">Library</div>
      <div className="mt-1 osint-panel-title">{workspaceTitle}</div>
    </div>

    <div className={CHROME_RAIL_BODY_CLASS}>
      <Accordion
        title="Events"
        icon={Clock3}
        count={allTimelineEvents.length}
        isOpen={dossierSections.events}
        onToggle={() => onToggleSection('events')}
        className={getRailAccordionClassName(dossierSections.events)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          <button
            onClick={() => onSetTrackFocus('ALL')}
            className={getFocusedButtonClass(focusedTrack === 'ALL' && !focusedRefId)}
          >
            All Activity
          </button>
          {TRACK_OPTIONS.map((option) => (
            <button
              key={option.track}
              onClick={() => onSetTrackFocus(option.track)}
              className={getFocusedButtonClass(focusedTrack === option.track && !focusedRefId)}
            >
              {option.label} ({getTrackCount(allTimelineEvents, option.track)})
            </button>
          ))}
        </div>
      </Accordion>

      <Accordion
        title="Runs"
        icon={Activity}
        count={runItems.length}
        isOpen={dossierSections.runs}
        onToggle={() => onToggleSection('runs')}
        className={getRailAccordionClassName(dossierSections.runs)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {runItems.length === 0 ? (
            <div className="px-3 py-2 osint-body-quiet">
              No workspace runs available yet.
            </div>
          ) : (
            runItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('RUN', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate osint-meta-value text-zinc-200">{item.title}</div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title={labelProfile.artifactLabelPlural}
        icon={PANEL_SECTION_ICONS.artifacts}
        count={artifactItems.length}
        isOpen={dossierSections.artifacts}
        onToggle={() => onToggleSection('artifacts')}
        className={getRailAccordionClassName(dossierSections.artifacts)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {artifactItems.length === 0 ? (
            <div className="px-3 py-2 osint-body-quiet">
              No saved {labelProfile.artifactLabelPlural.toLowerCase()} yet.
            </div>
          ) : (
            artifactItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('ARTIFACT', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate osint-meta-value text-zinc-200">{item.title}</div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Signals"
        icon={PANEL_SECTION_ICONS.signals}
        count={signalItems.length}
        isOpen={dossierSections.signals}
        onToggle={() => onToggleSection('signals')}
        className={getRailAccordionClassName(dossierSections.signals)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {signalItems.length === 0 ? (
            <div className="px-3 py-2 osint-body-quiet">
              No saved signals in this workspace yet.
            </div>
          ) : (
            signalItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('SIGNAL', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate osint-meta-value text-zinc-200">{item.title}</div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Entities"
        icon={PANEL_SECTION_ICONS.entities}
        count={entityItems.length}
        isOpen={dossierSections.entities}
        onToggle={() => onToggleSection('entities')}
        className={getRailAccordionClassName(dossierSections.entities)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {entityItems.length === 0 ? (
            <div className="px-3 py-2 osint-body-quiet">
              No entity milestones in this workspace yet.
            </div>
          ) : (
            entityItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('ENTITY', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate osint-meta-value text-zinc-200">{item.title}</div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Chats"
        icon={MessageSquare}
        count={chatSessionItems.length}
        isOpen={dossierSections.chats}
        onToggle={() => onToggleSection('chats')}
        className={getRailAccordionClassName(dossierSections.chats)}
        contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {chatSessionItems.length === 0 ? (
            <div className="px-3 py-2 osint-body-quiet">
              No workspace chats available yet.
            </div>
          ) : (
            chatSessionItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('CHAT', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate osint-meta-value text-zinc-200">{item.title}</div>
              </button>
            ))
          )}
        </div>
      </Accordion>
    </div>
  </aside>
);
