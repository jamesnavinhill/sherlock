import type { Workspace } from './core';

export interface TimelineSnapshotMetadata {
  generatedAt: string;
  range: TimelineRange;
  tracks: TimelineTrack[];
  search: string;
  focusedTrack?: TimelineTrack | 'ALL';
  focusedRefId?: string;
}

export interface TimelineSnapshot {
  workspace: Workspace;
  events: TimelineEvent[];
  metadata: TimelineSnapshotMetadata;
}

export type TimelineTrack = 'SIGNAL' | 'RUN' | 'ARTIFACT' | 'CHAT' | 'ENTITY' | 'ITEM';

export type TimelineEventType =
  | 'SIGNAL_SAVED'
  | 'RUN_STARTED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'ARTIFACT_CREATED'
  | 'ITEM_CREATED'
  | 'ITEM_PROMOTED'
  | 'ITEM_UPDATED'
  | 'ITEM_REUSED'
  | 'ENTITY_FIRST_SEEN'
  | 'ENTITY_MENTION_THRESHOLD'
  | 'ENTITY_REAPPEARED'
  | 'CHAT_SESSION_STARTED'
  | 'CHAT_SEARCHED_WORKSPACE'
  | 'CHAT_ARTIFACT_SAVED'
  | 'CHAT_ARTIFACT_NOTED'
  | 'CHAT_FOLLOW_UP_LAUNCHED';

export interface TimelineEvent {
  id: string;
  occurredAt: number;
  track: TimelineTrack;
  type: TimelineEventType;
  workspaceId: string;
  title: string;
  summary?: string;
  refId?: string;
  refKind?:
    | 'SIGNAL'
    | 'HEADLINE'
    | 'RUN'
    | 'ARTIFACT'
    | 'WORKSPACE_ITEM'
    | 'CHAT_SESSION'
    | 'CHAT_ACTION'
    | 'ENTITY';
  parentRefId?: string;
  badges?: string[];
  searchText?: string;
  metadata?: Record<string, unknown>;
}

export type TimelineRange = 'ALL' | '7D' | '30D' | '90D';

export interface TimelineFilters {
  range: TimelineRange;
  tracks: TimelineTrack[];
}

export interface TimelineQueryState {
  workspaceId?: string;
  search: string;
  filters: TimelineFilters;
  focusedTrack?: TimelineTrack | 'ALL';
  focusedRefId?: string;
}

export interface TimelineSelectionState {
  selectedEventId: string | null;
}
