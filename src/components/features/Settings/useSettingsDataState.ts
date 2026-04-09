import { useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';

import { clearStoredActiveWorkspaceId } from '@/utils/localStorage';
import {
  buildWorkspaceDataBackup,
  normalizeWorkspaceDataBackup,
} from '@/services/maintenance/workspaceData';
import { useSettingsDataMaintenanceState } from '@/store/selectors/settingsSelectors';

interface FeedbackDialogState {
  description: string;
  title: string;
}

export interface SettingsDataState {
  autoResolve: boolean;
  closeImportDialog: () => void;
  closeFeedbackDialog: () => void;
  closePurgeDialog: () => void;
  confirmClearData: () => Promise<void>;
  confirmImportData: () => Promise<void>;
  dataSections: {
    preferences: boolean;
    workspaceData: boolean;
  };
  feedbackDialog: FeedbackDialogState | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleExportData: () => void;
  handleImportJSON: (event: ChangeEvent<HTMLInputElement>) => void;
  pendingImportData: ReturnType<typeof normalizeWorkspaceDataBackup> | null;
  pendingImportName: string | null;
  quietMode: boolean;
  requestClearData: () => void;
  setAutoResolve: Dispatch<SetStateAction<boolean>>;
  setQuietMode: Dispatch<SetStateAction<boolean>>;
  showPurgeDialog: boolean;
  toggleDataSection: (section: 'preferences' | 'workspaceData') => void;
}

interface UseSettingsDataStateInput {
  initialAutoResolve: boolean;
  initialQuietMode: boolean;
}

export const useSettingsDataState = ({
  initialAutoResolve,
  initialQuietMode,
}: UseSettingsDataStateInput): SettingsDataState => {
  const {
    artifacts,
    workspaces,
    workspaceRuns,
    chatSessions,
    chatMessagesBySessionId,
    chatActionsBySessionId,
    boardAgentSessions,
    boardAgentActionsBySessionId,
    headlines,
    templates,
    manualNodes,
    manualLinks,
    workspaceItems,
    workspaceBoards,
    workspaceBoardDocuments,
    importWorkspaceData,
    clearWorkspaceData,
  } = useSettingsDataMaintenanceState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [autoResolve, setAutoResolve] = useState(initialAutoResolve);
  const [quietMode, setQuietMode] = useState(initialQuietMode);
  const [dataSections, setDataSections] = useState({
    preferences: true,
    workspaceData: true,
  });
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [pendingImportData, setPendingImportData] =
    useState<ReturnType<typeof normalizeWorkspaceDataBackup> | null>(null);
  const [pendingImportName, setPendingImportName] = useState<string | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialogState | null>(null);

  const handleExportData = () => {
    const data = buildWorkspaceDataBackup({
      workspaces,
      artifacts,
      runs: workspaceRuns,
      chatSessions,
      chatMessagesBySessionId,
      chatActionsBySessionId,
      boardAgentSessions,
      boardAgentActionsBySessionId,
      signals: headlines,
      manualNodes,
      manualLinks,
      workspaceItems,
      workspaceBoards,
      workspaceBoardDocuments: Object.values(workspaceBoardDocuments),
      templates,
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sherlock-workspace-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = normalizeWorkspaceDataBackup(JSON.parse(loadEvent.target?.result as string));
        setPendingImportData(data);
        setPendingImportName(file.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to parse JSON file.';
        setFeedbackDialog({
          title: 'Restore Failed',
          description: message,
        });
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const confirmImportData = async () => {
    if (!pendingImportData) return;
    await importWorkspaceData(pendingImportData);
    clearStoredActiveWorkspaceId();
    setPendingImportData(null);
    setPendingImportName(null);
    setFeedbackDialog({
      title: 'Backup Restored',
      description:
        'Workspace data was restored successfully. Provider keys, theme settings, and local app preferences stayed on this device.',
    });
  };

  const requestClearData = () => {
    setShowPurgeDialog(true);
  };

  const confirmClearData = async () => {
    await clearWorkspaceData();
    clearStoredActiveWorkspaceId();
    setShowPurgeDialog(false);
    setFeedbackDialog({
      title: 'Workspace Data Purged',
      description:
        'All saved workspace data was removed. Provider keys, theme settings, and device-local defaults were left untouched.',
    });
  };

  return {
    autoResolve,
    closeImportDialog: () => {
      setPendingImportData(null);
      setPendingImportName(null);
    },
    closeFeedbackDialog: () => setFeedbackDialog(null),
    closePurgeDialog: () => setShowPurgeDialog(false),
    confirmClearData,
    confirmImportData,
    dataSections,
    feedbackDialog,
    fileInputRef,
    handleExportData,
    handleImportJSON,
    pendingImportData,
    pendingImportName,
    quietMode,
    requestClearData,
    setAutoResolve,
    setQuietMode,
    showPurgeDialog,
    toggleDataSection: (section) =>
      setDataSections((current) => ({ ...current, [section]: !current[section] })),
  };
};
