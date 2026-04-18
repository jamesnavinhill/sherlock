import {
  Activity,
  Clock3,
  FolderKanban,
  MessageSquare,
} from 'lucide-react';

import type { TimelineEvent, TimelineFilters, TimelineTrack } from '@/types';
import { CHROME_THIN_NESTED_ITEM_BUTTON_CLASS } from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';

export const TIMELINE_DOSSIER_SECTION_KEYS = [
  'events',
  'runs',
  'artifacts',
  'signals',
  'entities',
  'chats',
] as const;

export type DossierSectionKey = (typeof TIMELINE_DOSSIER_SECTION_KEYS)[number];
export type DossierSections = Record<DossierSectionKey, boolean>;

export const TIMELINE_DETAIL_SECTION_KEYS = ['summary', 'context'] as const;

export type DetailSectionKey = (typeof TIMELINE_DETAIL_SECTION_KEYS)[number];
export type DetailSections = Record<DetailSectionKey, boolean>;

export const DEFAULT_FILTERS: TimelineFilters = {
  range: 'ALL',
  tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'],
};

export const TRACK_OPTIONS = [
  { track: 'SIGNAL', label: 'Signals', icon: PANEL_SECTION_ICONS.signals },
  { track: 'RUN', label: 'Runs', icon: Activity },
  { track: 'ARTIFACT', label: 'Artifacts', icon: PANEL_SECTION_ICONS.artifacts },
  { track: 'ITEM', label: 'Items', icon: FolderKanban },
  { track: 'ENTITY', label: 'Entities', icon: PANEL_SECTION_ICONS.entities },
  { track: 'CHAT', label: 'Chats', icon: MessageSquare },
] as const satisfies Array<{
  track: TimelineTrack;
  label: string;
  icon: typeof PANEL_SECTION_ICONS.signals;
}>;

export const LEFT_PANEL_SECTION_SCROLL_CLASS =
  'max-h-[min(20rem,calc(100svh-21rem))] overflow-y-auto overscroll-contain pr-1 custom-scrollbar';

export const formatEventTime = (value: number) =>
  value > 0
    ? new Date(value).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Time N/A';

export const getEventIcon = (event: TimelineEvent) => {
  switch (event.track) {
    case 'SIGNAL':
      return PANEL_SECTION_ICONS.signals;
    case 'RUN':
      return Activity;
    case 'ARTIFACT':
      return PANEL_SECTION_ICONS.artifacts;
    case 'ITEM':
      return FolderKanban;
    case 'ENTITY':
      return PANEL_SECTION_ICONS.entities;
    case 'CHAT':
      return MessageSquare;
    default:
      return Clock3;
  }
};

export const getEventTone = (event: TimelineEvent) => {
  switch (event.type) {
    case 'RUN_FAILED':
      return 'border-osint-danger/40 bg-osint-danger/10 text-osint-danger';
    case 'RUN_COMPLETED':
      return 'osint-pill-graph osint-pill-graph-2 osint-pill-graph-emphasis';
    default:
      switch (event.track) {
        case 'ARTIFACT':
          return 'osint-pill-graph osint-pill-graph-1';
        case 'RUN':
          return 'osint-pill-graph osint-pill-graph-2';
        case 'CHAT':
        case 'ENTITY':
          return 'osint-pill-graph osint-pill-graph-3';
        case 'SIGNAL':
        case 'ITEM':
        default:
          return 'osint-pill-graph osint-pill-graph-4';
      }
  }
};

export const getFocusedButtonClass = (isActive: boolean) =>
  `${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} font-mono ${
    isActive ? '' : 'text-zinc-300'
  }`;

export const toUniqueItems = (events: TimelineEvent[], track: TimelineTrack) => {
  const unique = new Map<string, TimelineEvent>();

  events.forEach((event) => {
    if (event.track !== track || !event.refId) return;
    if (!unique.has(event.refId)) {
      unique.set(event.refId, event);
    }
  });

  return Array.from(unique.values());
};

export const getMetadataValue = <T,>(
  event: TimelineEvent | null,
  key: string
): T | undefined => {
  if (!event?.metadata) return undefined;
  const value = event.metadata[key];
  return value as T | undefined;
};

export const getPrimaryRefId = (
  event: TimelineEvent | null,
  refKind: TimelineEvent['refKind']
) => {
  if (!event || event.refKind !== refKind) return undefined;
  return event.refId;
};

export const buildTimelineSearchPlaceholder = (artifactLabelPlural: string) =>
  `Search ${artifactLabelPlural.toLowerCase()}, items, runs, signals, entities, chats...`;
