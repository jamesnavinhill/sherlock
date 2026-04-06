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
  onStartNewProject: () => void;
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
  onStartNewProject,
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
  <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-4 backdrop-blur-md sm:px-6">
    <div className="flex h-full items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition md:flex ${
            leftPanelOpen
              ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
              : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
          }`}
          title="Toggle Sessions Panel"
        >
          <Briefcase className="h-4 w-4" />
        </button>
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={onToggleNewMenu}
            className="osint-button-primary flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase"
            title="Create a new chat item"
          >
            <Plus className="mr-1 h-4 w-4" />
            <span className="hidden lg:inline">New</span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </button>
          {showNewMenu ? (
            <div className="osint-menu-panel absolute left-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
              <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                Chat
              </div>
              <button
                onClick={() => void onCreateSession()}
                disabled={workspaceDisabled}
                className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                title="Start a fresh chat session in the selected workspace"
              >
                <MessageSquare className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="font-bold">New Session</div>
                  <div className="text-[10px] text-zinc-500">Start a standard workspace chat</div>
                </div>
              </button>
              <button
                onClick={() => void onCreateGuidedSession()}
                disabled={workspaceDisabled}
                className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300 disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent disabled:hover:text-zinc-600"
                title="Open a guided run builder in the selected workspace"
              >
                <PlayCircle className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="font-bold">Guided Run</div>
                  <div className="text-[10px] text-zinc-500">Use the step-by-step run builder</div>
                </div>
              </button>
              <div className="border-y border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                Workspace
              </div>
              <button
                onClick={onStartNewProject}
                className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300"
                title="Create a new workspace"
              >
                <FilePlus2 className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                <div>
                  <div className="font-bold">New Project</div>
                  <div className="text-[10px] text-zinc-500">Create or launch a new workspace</div>
                </div>
              </button>
            </div>
          ) : null}
        </div>
        <div className="hidden w-72 min-w-0 flex-1 md:block lg:max-w-md xl:max-w-xl">
          <OsintSelect
            ariaLabel="Chat workspace"
            value={activeWorkspaceId || ''}
            onChange={(value) => onSelectWorkspace(value || null)}
            placeholder="Select workspace"
            triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
            options={workspaces.map((workspace) => ({
              value: workspace.id,
              label: workspace.title,
            }))}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {activeSessionId ? (
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={onToggleExportMenu}
              className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
              }`}
              title="Export current chat session"
            >
              <Download className="mr-1 h-4 w-4" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="ml-1 h-3 w-3" />
            </button>
            {showExportMenu ? (
              <div className="osint-menu-panel absolute right-0 top-full z-50 mt-1 min-w-[220px] border border-zinc-700 bg-zinc-900">
                <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-500">
                  Current Session
                </div>
                <button
                  onClick={onExportMarkdown}
                  className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-3 text-left text-xs font-mono text-zinc-300"
                  title="Export the current chat session as Markdown"
                >
                  <FileText className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="font-bold">Session Markdown</div>
                    <div className="text-[10px] text-zinc-500">Readable transcript export</div>
                  </div>
                </button>
                <button
                  onClick={onExportJson}
                  className="osint-menu-item flex w-full items-center px-4 py-3 text-left text-xs font-mono text-zinc-300"
                  title="Export the current chat session as JSON"
                >
                  <FileJson className="osint-menu-item-icon mr-3 h-4 w-4 text-zinc-500" />
                  <div>
                    <div className="font-bold">Session JSON</div>
                    <div className="text-[10px] text-zinc-500">Raw session data for backup</div>
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
          className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition xl:flex ${
            rightPanelOpen
              ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
              : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
          }`}
          title="Toggle Context Panel"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
);
