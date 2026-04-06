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
  getFocusedButtonClass,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
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
}) => (
  <aside
    className={`absolute left-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
      isOpen
        ? 'w-[min(20rem,calc(100vw-1rem))] translate-x-0 border-r border-zinc-800'
        : 'w-[min(20rem,calc(100vw-1rem))] -translate-x-full border-r border-zinc-800 lg:w-0 lg:border-r-0'
    }`}
  >
    <div className="border-b border-zinc-800 px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
        Timeline Dossier
      </div>
      <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
        {workspaceTitle}
      </div>
    </div>

    <div className="h-[calc(100%-72px)] overflow-y-auto p-3 custom-scrollbar">
      <Accordion
        title="Events"
        icon={Clock3}
        count={allTimelineEvents.length}
        isOpen={dossierSections.events}
        onToggle={() => onToggleSection('events')}
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
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
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {runItems.length === 0 ? (
            <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
              No workspace runs available yet.
            </div>
          ) : (
            runItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('RUN', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate font-bold text-zinc-200">{item.title}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.badges?.[0] || 'RUN'}
                </div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title={labelProfile.artifactLabelPlural}
        icon={FileText}
        count={artifactItems.length}
        isOpen={dossierSections.artifacts}
        onToggle={() => onToggleSection('artifacts')}
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {artifactItems.length === 0 ? (
            <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
              No saved {labelProfile.artifactLabelPlural.toLowerCase()} yet.
            </div>
          ) : (
            artifactItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('ARTIFACT', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate font-bold text-zinc-200">{item.title}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.badges?.join(' / ') || labelProfile.artifactLabel}
                </div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Signals"
        icon={Radio}
        count={signalItems.length}
        isOpen={dossierSections.signals}
        onToggle={() => onToggleSection('signals')}
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {signalItems.length === 0 ? (
            <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
              No saved signals in this workspace yet.
            </div>
          ) : (
            signalItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('SIGNAL', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate font-bold text-zinc-200">{item.title}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.badges?.join(' / ') || 'Signal'}
                </div>
              </button>
            ))
          )}
        </div>
      </Accordion>

      <Accordion
        title="Entities"
        icon={Fingerprint}
        count={entityItems.length}
        isOpen={dossierSections.entities}
        onToggle={() => onToggleSection('entities')}
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {entityItems.length === 0 ? (
            <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
              No entity milestones in this workspace yet.
            </div>
          ) : (
            entityItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('ENTITY', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate font-bold text-zinc-200">{item.title}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.badges?.join(' / ') || 'ENTITY'}
                </div>
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
        contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
      >
        <div className="space-y-2">
          {chatSessionItems.length === 0 ? (
            <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
              No workspace chats available yet.
            </div>
          ) : (
            chatSessionItems.map((item) => (
              <button
                key={item.refId}
                onClick={() => item.refId && onFocusReference('CHAT', item.refId)}
                className={getFocusedButtonClass(focusedRefId === item.refId)}
              >
                <div className="truncate font-bold text-zinc-200">{item.title}</div>
                <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.badges?.join(' / ') || 'CHAT'}
                </div>
              </button>
            ))
          )}
        </div>
      </Accordion>
    </div>
  </aside>
);
