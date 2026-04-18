import {
  Activity,
  ExternalLink,
  FileText,
  Fingerprint,
  FolderKanban,
  MessageSquare,
  Radio,
  Save,
} from 'lucide-react';

import type { Artifact, TimelineEvent, TimelineTrack, WorkspaceItem } from '@/types';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';
import { INSPECTOR_ACTION_SHORT_LABELS } from '@/components/ui/inspectorActionLabels';

interface BuildTimelineDetailActionsInput {
  focusReference: (track: TimelineTrack, refId?: string) => void;
  labelArtifactLabel: string;
  onOpenArtifact: (artifactId?: string) => void;
  onOpenItemSource: () => void;
  onOpenWorkspaceItem: () => void;
  onOpenWorkspaceChat: (event?: TimelineEvent | null) => void;
  onPlaceReferenceOnBoard: () => Promise<void>;
  parentArtifactId?: string;
  previousArtifactId?: string;
  relatedSignalId?: string;
  selectedArtifact?: Artifact | null;
  selectedChatSessionId?: string;
  selectedEntityName?: string | null;
  selectedEvent?: TimelineEvent | null;
  selectedRunId?: string;
  selectedWorkspaceItem?: WorkspaceItem | null;
}

export const buildTimelineDetailActions = ({
  focusReference,
  labelArtifactLabel,
  onOpenArtifact,
  onOpenItemSource,
  onOpenWorkspaceItem,
  onOpenWorkspaceChat,
  onPlaceReferenceOnBoard,
  parentArtifactId,
  previousArtifactId,
  relatedSignalId,
  selectedArtifact,
  selectedChatSessionId,
  selectedEntityName,
  selectedEvent,
  selectedRunId,
  selectedWorkspaceItem,
}: BuildTimelineDetailActionsInput): InspectorActionItem[] => {
  if (!selectedEvent) return [];

  const actions: InspectorActionItem[] = [
    {
      id: 'timeline-chat',
      label: selectedChatSessionId ? 'Open Chat Session' : 'Open Workspace Chat',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
      icon: MessageSquare,
      onClick: () => onOpenWorkspaceChat(selectedEvent),
    },
  ];

  if (selectedArtifact?.id || relatedSignalId || selectedEntityName || selectedWorkspaceItem) {
    actions.push({
      id: 'timeline-board-place',
      label: 'Add To Board',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.add,
      icon: Save,
      onClick: () => void onPlaceReferenceOnBoard(),
    });
  }

  if (selectedWorkspaceItem) {
    actions.push({
      id: 'timeline-item-open',
      label: 'Open Item',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.item,
      icon: FolderKanban,
      onClick: onOpenWorkspaceItem,
    });

    if (selectedWorkspaceItem.url) {
      actions.push({
        id: 'timeline-item-source',
        label: 'Open Source URL',
        shortLabel: INSPECTOR_ACTION_SHORT_LABELS.source,
        icon: ExternalLink,
        onClick: onOpenItemSource,
      });
    }
  }

  if (selectedArtifact?.id) {
    actions.push({
      id: 'timeline-report',
      label: `Open ${labelArtifactLabel}`,
      shortLabel: labelArtifactLabel,
      icon: FileText,
      onClick: () => onOpenArtifact(selectedArtifact.id),
    });
  }

  if (selectedRunId) {
    actions.push({
      id: 'timeline-run',
      label: 'Focus Source Run',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.run,
      icon: Activity,
      onClick: () => focusReference('RUN', selectedRunId),
    });
  }

  if (relatedSignalId) {
    actions.push({
      id: 'timeline-signal',
      label: 'Focus Origin Signal',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.signal,
      icon: Radio,
      onClick: () => focusReference('SIGNAL', relatedSignalId),
    });
  }

  if (selectedEntityName && selectedEvent.refKind !== 'ENTITY') {
    actions.push({
      id: 'timeline-entity',
      label: 'Focus Entity Milestones',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.entity,
      icon: Fingerprint,
      onClick: () => focusReference('ENTITY', selectedEntityName),
    });
  }

  if (selectedChatSessionId && selectedEvent.refKind !== 'CHAT_SESSION') {
    actions.push({
      id: 'timeline-chat-focus',
      label: 'Focus Chat Session',
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.session,
      icon: MessageSquare,
      onClick: () => focusReference('CHAT', selectedChatSessionId),
    });
  }

  if (parentArtifactId) {
    actions.push({
      id: 'timeline-parent',
      label: `Focus Parent ${labelArtifactLabel}`,
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.parent,
      icon: FileText,
      onClick: () => focusReference('ARTIFACT', parentArtifactId),
    });
  }

  if (previousArtifactId) {
    actions.push({
      id: 'timeline-previous',
      label: `Focus Previous ${labelArtifactLabel}`,
      shortLabel: INSPECTOR_ACTION_SHORT_LABELS.previous,
      icon: FileText,
      onClick: () => focusReference('ARTIFACT', previousArtifactId),
    });
  }

  return actions.slice(0, 6);
};
