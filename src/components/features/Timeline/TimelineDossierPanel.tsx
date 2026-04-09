import React from 'react';
import {
  Activity,
  Clock3,
  FileText,
  Fingerprint,
  MessageSquare,
  Radio,
} from 'lucide-react';

import type { TimelineEvent } from '@/types';
import { Accordion } from '@/components/ui/Accordion';
import {
  CHROME_NESTED_ITEM_BADGE_CLASS,
  CHROME_NESTED_ITEM_BODY_CLASS,
  CHROME_NESTED_ITEM_BUTTON_CLASS,
  CHROME_NESTED_ITEM_HEADER_CLASS,
  CHROME_NESTED_ITEM_META_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '@/components/ui/chrome';
import {
  TRACK_OPTIONS,
  type DossierSections,
} from './timelineViewUtils';
import { getTrackCount } from './timelineEvents';

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
}) => {
  const renderReferenceItem = (
    item: TimelineEvent,
    track: 'RUN' | 'ARTIFACT' | 'SIGNAL' | 'ENTITY' | 'CHAT',
    fallbackLabel: string
  ) => (
    <button
      key={item.refId || item.id}
      type="button"
      onClick={() => item.refId && onFocusReference(track, item.refId)}
      className={CHROME_NESTED_ITEM_BUTTON_CLASS}
      data-active={focusedRefId === item.refId}
    >
      <div className={CHROME_NESTED_ITEM_HEADER_CLASS}>
        <div className="min-w-0 flex-1">
          <div className="truncate osint-title-inline text-zinc-200">{item.title}</div>
          <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>
            {(item.badges?.length ? item.badges : [fallbackLabel]).map((badge) => (
              <span key={`${item.id}-${badge}`} className={CHROME_NESTED_ITEM_BADGE_CLASS}>
                {badge}
              </span>
            ))}
          </div>
          {item.summary ? (
            <div className={`${CHROME_NESTED_ITEM_BODY_CLASS} line-clamp-2`}>{item.summary}</div>
          ) : null}
        </div>
      </div>
    </button>
  );

  return (
    <aside
      className={`absolute left-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
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
            type="button"
            onClick={() => onSetTrackFocus('ALL')}
            className={CHROME_NESTED_ITEM_BUTTON_CLASS}
            data-active={focusedTrack === 'ALL' && !focusedRefId}
          >
            <div className={CHROME_NESTED_ITEM_HEADER_CLASS}>
              <div className="min-w-0 flex-1">
                <div className="osint-title-inline text-zinc-200">All Activity</div>
                <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>
                  <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>
                    {allTimelineEvents.length} Events
                  </span>
                </div>
              </div>
            </div>
          </button>
          {TRACK_OPTIONS.map((option) => (
            <button
              key={option.track}
              type="button"
              onClick={() => onSetTrackFocus(option.track)}
              className={CHROME_NESTED_ITEM_BUTTON_CLASS}
              data-active={focusedTrack === option.track && !focusedRefId}
            >
              <div className={CHROME_NESTED_ITEM_HEADER_CLASS}>
                <div className="min-w-0 flex-1">
                  <div className="osint-title-inline text-zinc-200">{option.label}</div>
                  <div className={CHROME_NESTED_ITEM_META_ROW_CLASS}>
                    <span className={CHROME_NESTED_ITEM_BADGE_CLASS}>
                      {getTrackCount(allTimelineEvents, option.track)} items
                    </span>
                  </div>
                </div>
              </div>
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
            runItems.map((item) => renderReferenceItem(item, 'RUN', 'RUN'))
          )}
        </div>
      </Accordion>

      <Accordion
        title={labelProfile.artifactLabelPlural}
        icon={FileText}
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
            artifactItems.map((item) =>
              renderReferenceItem(item, 'ARTIFACT', labelProfile.artifactLabel)
            )
          )}
        </div>
      </Accordion>

      <Accordion
        title="Signals"
        icon={Radio}
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
            signalItems.map((item) => renderReferenceItem(item, 'SIGNAL', 'Signal'))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Entities"
        icon={Fingerprint}
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
            entityItems.map((item) => renderReferenceItem(item, 'ENTITY', 'ENTITY'))
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
            chatSessionItems.map((item) => renderReferenceItem(item, 'CHAT', 'CHAT'))
          )}
        </div>
      </Accordion>
      </div>
    </aside>
  );
};
