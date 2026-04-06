import { Activity, FileText, Fingerprint, MessageSquare, Radio, Save, Workflow } from 'lucide-react';

import type { Artifact, TimelineEvent, TimelineTrack } from '@/types';
import type { InspectorActionItem } from '@/components/ui/InspectorActionRow';

interface BuildTimelineDetailActionsInput {
  focusReference: (track: TimelineTrack, refId?: string) => void;
  labelArtifactLabel: string;
  onOpenArtifact: (artifactId?: string) => void;
  onOpenWorkspaceBoard: () => Promise<void>;
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
}

export const buildTimelineDetailActions = ({
  focusReference,
  labelArtifactLabel,
  onOpenArtifact,
  onOpenWorkspaceBoard,
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
}: BuildTimelineDetailActionsInput): InspectorActionItem[] => {
  if (!selectedEvent) return [];

  const actions: InspectorActionItem[] = [
    {
      id: 'timeline-chat',
      label: selectedChatSessionId ? 'Open Chat Session' : 'Open Workspace Chat',
      icon: MessageSquare,
      onClick: () => onOpenWorkspaceChat(selectedEvent),
    },
    {
      id: 'timeline-board-open',
      label: 'Open Board',
      icon: Workflow,
      onClick: () => void onOpenWorkspaceBoard(),
    },
  ];

  if (selectedArtifact?.id || relatedSignalId || selectedEntityName) {
    actions.push({
      id: 'timeline-board-place',
      label: 'Place On Board',
      icon: Save,
      onClick: () => void onPlaceReferenceOnBoard(),
    });
  }

  if (selectedArtifact?.id) {
    actions.push({
      id: 'timeline-report',
      label: `Open ${labelArtifactLabel}`,
      icon: FileText,
      onClick: () => onOpenArtifact(selectedArtifact.id),
    });
  }

  if (selectedRunId) {
    actions.push({
      id: 'timeline-run',
      label: 'Focus Source Run',
      icon: Activity,
      onClick: () => focusReference('RUN', selectedRunId),
    });
  }

  if (relatedSignalId) {
    actions.push({
      id: 'timeline-signal',
      label: 'Focus Origin Signal',
      icon: Radio,
      onClick: () => focusReference('SIGNAL', relatedSignalId),
    });
  }

  if (selectedEntityName && selectedEvent.refKind !== 'ENTITY') {
    actions.push({
      id: 'timeline-entity',
      label: 'Focus Entity Milestones',
      icon: Fingerprint,
      onClick: () => focusReference('ENTITY', selectedEntityName),
    });
  }

  if (selectedChatSessionId && selectedEvent.refKind !== 'CHAT_SESSION') {
    actions.push({
      id: 'timeline-chat-focus',
      label: 'Focus Chat Session',
      icon: MessageSquare,
      onClick: () => focusReference('CHAT', selectedChatSessionId),
    });
  }

  if (parentArtifactId) {
    actions.push({
      id: 'timeline-parent',
      label: `Focus Parent ${labelArtifactLabel}`,
      icon: FileText,
      onClick: () => focusReference('ARTIFACT', parentArtifactId),
    });
  }

  if (previousArtifactId) {
    actions.push({
      id: 'timeline-previous',
      label: `Focus Previous ${labelArtifactLabel}`,
      icon: FileText,
      onClick: () => focusReference('ARTIFACT', previousArtifactId),
    });
  }

  return actions.slice(0, 6);
};
