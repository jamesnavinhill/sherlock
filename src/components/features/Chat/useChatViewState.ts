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
  toggleExclusiveSection,
} from './chatPageUtils';

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
  const [leftPanelSections, setLeftPanelSections] = useState({
    sessions: false,
    workspace: false,
  });
  const [rightPanelSections, setRightPanelSections] = useState({
    launchContext: false,
    recentArtifacts: false,
    recentSignals: false,
    latestRetrieval: false,
    actionLog: false,
  });
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

  const toggleLeftPanelSection = (section: keyof typeof leftPanelSections) => {
    setLeftPanelSections((current) => toggleExclusiveSection(current, section));
  };

  const toggleRightPanelSection = (section: keyof typeof rightPanelSections) => {
    setRightPanelSections((current) => toggleExclusiveSection(current, section));
  };

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
    leftPanelSections,
    manualSetupDraft,
    newMenuRef,
    renameSessionDialog,
    rightPanelOpen,
    rightPanelSections,
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
    toggleLeftPanelSection,
    toggleRightPanelSection,
    transcriptEndRef,
    workingAssistantMessageId,
    workingSessionId,
  };
};
