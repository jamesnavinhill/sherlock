import { useEffect, useRef, useState } from 'react';

import type {
  AgentAction,
  ChatMessage,
  ChatSession,
  InvestigationLaunchRequest,
} from '@/types';
import type { GuidedRunDraft } from '@/services/chat/guidedMode';
import {
  getDefaultLeftPanelOpen,
  getDefaultRightPanelOpen,
} from './chatPageUtils';
import { useExclusivePanelSections } from '../shared/useExclusivePanelSections';

export interface RenameSessionDialogState {
  session: ChatSession;
  title: string;
}

export interface AppendArtifactDialogState {
  message: ChatMessage;
  selectedReportId: string;
}

export interface FollowUpDialogState {
  action: AgentAction;
  request: InvestigationLaunchRequest;
  topic: string;
}

interface UseChatViewStateInput {
  activeWorkspaceId: string | null;
}

export const useChatViewState = ({ activeWorkspaceId }: UseChatViewStateInput) => {
  const [draft, setDraft] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(getDefaultLeftPanelOpen);
  const [rightPanelOpen, setRightPanelOpen] = useState(getDefaultRightPanelOpen);
  const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
  const [workingAssistantMessageId, setWorkingAssistantMessageId] = useState<string | null>(null);
  const [manualSetupDraft, setManualSetupDraft] = useState<GuidedRunDraft | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [renameSessionDialog, setRenameSessionDialog] = useState<RenameSessionDialogState | null>(
    null
  );
  const [deleteSessionDialog, setDeleteSessionDialog] = useState<ChatSession | null>(null);
  const [appendArtifactDialog, setAppendArtifactDialog] = useState<AppendArtifactDialogState | null>(
    null
  );
  const [followUpDialog, setFollowUpDialog] = useState<FollowUpDialogState | null>(null);
  const [artifactCardState, setArtifactCardState] = useState<{
    expanded: Record<string, boolean>;
    workspaceId: string | null;
  }>({
    expanded: {},
    workspaceId: null,
  });
  const leftPanelSectionState = useExclusivePanelSections(['sessions', 'workspace'] as const);
  const rightPanelSectionState = useExclusivePanelSections(
    ['launchContext', 'recentArtifacts', 'recentSignals', 'latestRetrieval', 'actionLog'] as const
  );
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamedAnswerRef = useRef('');
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const newMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setLeftPanelOpen(getDefaultLeftPanelOpen());
      setRightPanelOpen(getDefaultRightPanelOpen());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleArtifactCard = (artifactId: string) => {
    setArtifactCardState((current) => {
      const baseExpanded =
        current.workspaceId === activeWorkspaceId ? current.expanded : {};

      return {
        expanded: {
          ...baseExpanded,
          [artifactId]: !baseExpanded[artifactId],
        },
        workspaceId: activeWorkspaceId,
      };
    });
  };

  return {
    abortControllerRef,
    appendArtifactDialog,
    artifactCardState,
    deleteSessionDialog,
    draft,
    exportMenuRef,
    followUpDialog,
    leftPanelOpen,
    leftPanelSections: leftPanelSectionState.state,
    manualSetupDraft,
    newMenuRef,
    renameSessionDialog,
    rightPanelOpen,
    rightPanelSections: rightPanelSectionState.state,
    setAppendArtifactDialog,
    setDeleteSessionDialog,
    setDraft,
    setFollowUpDialog,
    setLeftPanelOpen,
    setManualSetupDraft,
    setRenameSessionDialog,
    setRightPanelOpen,
    setShowExportMenu,
    setShowNewMenu,
    setShowNewProjectModal,
    setWorkingAssistantMessageId,
    setWorkingSessionId,
    showExportMenu,
    showNewMenu,
    showNewProjectModal,
    streamedAnswerRef,
    toggleArtifactCard,
    toggleLeftPanelSection: leftPanelSectionState.toggleSection,
    toggleRightPanelSection: rightPanelSectionState.toggleSection,
    transcriptEndRef,
    workingAssistantMessageId,
    workingSessionId,
  };
};
