import React from 'react';
import {
  Briefcase,
  ChevronDown,
  Download,
  FileJson,
  FilePlus2,
  FileText,
  MessageSquare,
  PanelRight,
  PlayCircle,
  Plus,
} from 'lucide-react';

import { OsintSelect } from '@/components/ui/OsintSelect';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ROW_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_PRIMARY_ACTION_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '@/components/ui/chrome';

interface ChatHeaderProps {
  activeSessionId?: string | null;
  activeWorkspaceId?: string | null;
  exportMenuRef: React.RefObject<HTMLDivElement | null>;
  leftPanelOpen: boolean;
  newMenuRef: React.RefObject<HTMLDivElement | null>;
  onCreateGuidedSession: () => Promise<void>;
  onCreateSession: () => Promise<void>;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onSelectWorkspace: (workspaceId: string | null) => void;
  onStartNewWorkspace: () => void;
  onToggleExportMenu: () => void;
  onToggleLeftPanel: () => void;
  onToggleNewMenu: () => void;
  onToggleRightPanel: () => void;
  rightPanelOpen: boolean;
  setShowExportMenu: (value: boolean) => void;
  setShowNewMenu: (value: boolean) => void;
  showExportMenu: boolean;
  showNewMenu: boolean;
  workspaceDisabled: boolean;
  workspaces: Array<{ id: string; title: string }>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeSessionId,
  activeWorkspaceId,
  exportMenuRef,
  leftPanelOpen,
  newMenuRef,
  onCreateGuidedSession,
  onCreateSession,
  onExportJson,
  onExportMarkdown,
  onSelectWorkspace,
  onStartNewWorkspace,
  onToggleExportMenu,
  onToggleLeftPanel,
  onToggleNewMenu,
  onToggleRightPanel,
  rightPanelOpen,
  setShowExportMenu,
  setShowNewMenu,
  showExportMenu,
  showNewMenu,
  workspaceDisabled,
  workspaces,
}) => (
  <header className={`${CHROME_HEADER_CLASS} px-4 sm:px-6`}>
    <div className={`${CHROME_HEADER_ROW_CLASS} gap-4`}>
      <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(leftPanelOpen)}`}
          title="Toggle Sessions Panel"
        >
          <Briefcase className="h-4 w-4" />
        </button>
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={onToggleNewMenu}
            className={`${CHROME_HEADER_PRIMARY_ACTION_CLASS} pr-3`}
            title="Create a new chat item"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">New</span>
            <ChevronDown className="h-3 w-3 opacity-80" />
          </button>
          {showNewMenu ? (
            <div className="osint-menu-panel absolute left-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
              <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">
                Chat
              </div>
              <button
                onClick={() => void onCreateSession()}
                disabled={workspaceDisabled}
                className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left osint-body-small text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                title="Start a fresh chat session in the selected workspace"
              >
                <MessageSquare className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="osint-menu-item-title">New Session</div>
                  <div className="osint-menu-item-description">Start a standard workspace chat</div>
                </div>
              </button>
              <button
                onClick={() => void onCreateGuidedSession()}
                disabled={workspaceDisabled}
                className="osint-menu-item flex w-full items-center px-4 py-3 text-left osint-body-small text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                title="Open a guided run builder in the selected workspace"
              >
                <PlayCircle className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="osint-menu-item-title">Guided Run</div>
                  <div className="osint-menu-item-description">
                    Use the step-by-step run builder
                  </div>
                </div>
              </button>
              <div className="border-y border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">
                Workspace
              </div>
              <button
                onClick={onStartNewWorkspace}
                className="osint-menu-item flex w-full items-center px-4 py-3 text-left osint-body-small text-zinc-300"
                title="Create a new workspace"
              >
                <FilePlus2 className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="osint-menu-item-title">New Workspace</div>
                  <div className="osint-menu-item-description">
                    Create or launch a new workspace
                  </div>
                </div>
              </button>
            </div>
          ) : null}
        </div>
        <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
          <OsintSelect
            ariaLabel="Chat workspace"
            value={activeWorkspaceId || ''}
            onChange={(value) => onSelectWorkspace(value || null)}
            placeholder="Select workspace"
            chrome="toolbar"
            triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
            options={workspaces.map((workspace) => ({
              value: workspace.id,
              label: workspace.title,
            }))}
          />
        </div>
      </div>

      <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
        <GlobalSearch compact className="mx-auto w-full" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {activeSessionId ? (
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={onToggleExportMenu}
              className={getChromeMenuButtonClass(showExportMenu)}
              title="Export current chat session"
            >
              <Download className="mr-1 h-4 w-4" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </button>
            {showExportMenu ? (
              <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
                <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">
                  Current Session
                </div>
                <button
                  onClick={onExportMarkdown}
                  className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left osint-body-small text-zinc-300"
                  title="Export the current chat session as Markdown"
                >
                  <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="osint-menu-item-title">Session Markdown</div>
                    <div className="osint-menu-item-description">Readable transcript export</div>
                  </div>
                </button>
                <button
                  onClick={onExportJson}
                  className="osint-menu-item flex w-full items-center px-4 py-3 text-left osint-body-small text-zinc-300"
                  title="Export the current chat session as JSON"
                >
                  <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="osint-menu-item-title">Session JSON</div>
                    <div className="osint-menu-item-description">
                      Raw session data for backup
                    </div>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          onClick={() => {
            setShowNewMenu(false);
            setShowExportMenu(false);
            onToggleRightPanel();
          }}
          className={`hidden xl:flex ${getChromeToggleButtonClass(rightPanelOpen)}`}
          title="Toggle Context Panel"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
);
