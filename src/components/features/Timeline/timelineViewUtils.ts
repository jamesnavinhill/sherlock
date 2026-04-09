import {
  Activity,
  Clock3,
  FileText,
  Fingerprint,
  FolderKanban,
  MessageSquare,
  Radio,
} from 'lucide-react';

import type { TimelineEvent, TimelineFilters, TimelineTrack } from '@/types';

export type DossierSections = {
  events: boolean;
  runs: boolean;
  artifacts: boolean;
  signals: boolean;
  entities: boolean;
  chats: boolean;
};

export type DetailSections = {
  summary: boolean;
  context: boolean;
};

export const DEFAULT_FILTERS: TimelineFilters = {
  range: 'ALL',
  tracks: ['SIGNAL', 'RUN', 'ARTIFACT', 'ITEM'],
};

export const TRACK_OPTIONS = [
  { track: 'SIGNAL', label: 'Signals', icon: Radio },
  { track: 'RUN', label: 'Runs', icon: Activity },
  { track: 'ARTIFACT', label: 'Artifacts', icon: FileText },
  { track: 'ITEM', label: 'Items', icon: FolderKanban },
  { track: 'ENTITY', label: 'Entities', icon: Fingerprint },
  { track: 'CHAT', label: 'Chats', icon: MessageSquare },
] as const satisfies Array<{ track: TimelineTrack; label: string; icon: typeof Radio }>;

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
      return Radio;
    case 'RUN':
      return Activity;
    case 'ARTIFACT':
      return FileText;
    case 'ITEM':
      return FolderKanban;
    case 'ENTITY':
      return Fingerprint;
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
      return 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary';
    case 'CHAT_ARTIFACT_SAVED':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    case 'ITEM_CREATED':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
    case 'ITEM_PROMOTED':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
    case 'ITEM_UPDATED':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
    case 'ITEM_REUSED':
      return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200';
    case 'CHAT_FOLLOW_UP_LAUNCHED':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    case 'ENTITY_FIRST_SEEN':
      return 'border-violet-500/40 bg-violet-500/10 text-violet-200';
    case 'ENTITY_MENTION_THRESHOLD':
      return 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200';
    case 'ENTITY_REAPPEARED':
      return 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200';
    case 'CHAT_SESSION_STARTED':
    case 'CHAT_SEARCHED_WORKSPACE':
    case 'CHAT_ARTIFACT_NOTED':
      return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';
    default:
      return 'border-zinc-700 bg-zinc-900 text-zinc-300';
  }
};

export const getFocusedButtonClass = (isActive: boolean) =>
  `osint-panel-item w-full px-3 py-2 text-left text-xs font-mono ${
    isActive ? 'border-osint-primary/40 text-osint-primary' : 'text-zinc-300'
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

export const toggleExclusiveSection = <T extends Record<string, boolean>>(
  current: T,
  section: keyof T
): T =>
  Object.fromEntries(
    Object.keys(current).map((key) => [key, key === section ? !current[section] : false])
  ) as T;
