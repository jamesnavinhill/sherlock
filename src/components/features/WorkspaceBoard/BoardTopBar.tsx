import React from 'react';
import { Briefcase, FolderPlus, PanelRight, Presentation } from 'lucide-react';

import type { WorkspaceBoard } from '@/types';
import { OsintSelect } from '@/components/ui/OsintSelect';
import { sanitizeDisplayTitle } from '@/domain';

interface BoardTopBarProps {
  activeBoard: WorkspaceBoard | null;
  activeWorkspaceId: string;
  availableBoards: Array<{ id: string; name: string }>;
  leftPanelOpen: boolean;
  onCreateBoard: () => void;
  onSelectBoard: (boardId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onToggleLeftPanel: () => void;
  onTogglePresentationMode: () => void;
  onToggleRightPanel: () => void;
  rightPanelOpen: boolean;
  workspaces: Array<{ id: string; title: string }>;
}

export const BoardTopBar: React.FC<BoardTopBarProps> = ({
  activeBoard,
  activeWorkspaceId,
  availableBoards,
  leftPanelOpen,
  onCreateBoard,
  onSelectBoard,
  onSelectWorkspace,
  onToggleLeftPanel,
  onTogglePresentationMode,
  onToggleRightPanel,
  rightPanelOpen,
  workspaces,
}) => (
  <header className="osint-header-shadow sticky top-0 z-40 flex h-20 items-center justify-between border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
    <div className="flex min-w-0 items-center gap-3">
      <button
        onClick={onToggleLeftPanel}
        className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition md:inline-flex ${
          leftPanelOpen
            ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
            : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
        }`}
      >
        <Briefcase className="h-4 w-4" />
      </button>
      <button
        onClick={onCreateBoard}
        className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase"
      >
        <FolderPlus className="h-4 w-4" />
        New Board
      </button>
      <div className="relative z-50 hidden min-w-[220px] max-w-[280px] md:block">
        <OsintSelect
          ariaLabel="Select workspace"
          value={activeWorkspaceId}
          onChange={onSelectWorkspace}
          triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
          menuClassName="z-[60]"
          options={workspaces.map((workspace) => ({
            value: workspace.id,
            label: sanitizeDisplayTitle(workspace.title),
          }))}
        />
      </div>
      <div className="relative z-50 hidden min-w-[220px] max-w-[260px] md:block">
        <OsintSelect
          ariaLabel="Select board"
          value={activeBoard?.id || ''}
          onChange={onSelectBoard}
          triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
          menuClassName="z-[60]"
          options={availableBoards.map((board) => ({
            value: board.id,
            label: board.name,
          }))}
        />
      </div>
    </div>

    <div className="flex items-center gap-2">
      {activeBoard ? (
        <button
          onClick={onTogglePresentationMode}
          className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-mono uppercase transition ${
            activeBoard.presentationMode
              ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
              : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
          }`}
        >
          <Presentation className="h-4 w-4" />
          {activeBoard.presentationMode ? 'Presentation' : 'Edit Mode'}
        </button>
      ) : null}
      <button
        onClick={onToggleRightPanel}
        className={`hidden items-center justify-center border p-2 text-xs font-mono uppercase transition xl:inline-flex ${
          rightPanelOpen
            ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
            : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
        }`}
        title="Toggle Inspector Panel"
      >
        <PanelRight className="h-4 w-4" />
      </button>
    </div>
  </header>
);
