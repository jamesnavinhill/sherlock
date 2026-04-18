import React from 'react';
import { Briefcase, FolderPlus, PanelRight, Pencil, Presentation } from 'lucide-react';

import type { WorkspaceBoard } from '@/types';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { OsintSelect } from '@/components/ui/OsintSelect';
import {
  CHROME_HEADER_CONTROL_HEIGHT_CLASS,
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_PRIMARY_ICON_BUTTON_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeToggleButtonClass,
} from '@/components/ui/chrome';
import { getWorkspaceDisplayTitle } from '@/domain';

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
  <header className={`${CHROME_HEADER_CLASS} z-40 px-6`}>
    <div className="flex h-full min-w-0 items-center gap-3">
      <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:inline-flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(leftPanelOpen)}`}
        >
          <Briefcase className="h-4 w-4" />
        </button>
        <button
          onClick={onCreateBoard}
          className={CHROME_HEADER_PRIMARY_ICON_BUTTON_CLASS}
          title="Create board"
          aria-label="Create board"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
        <div className={`relative z-50 ${CHROME_HEADER_SELECT_WRAP_CLASS}`}>
          <OsintSelect
            ariaLabel="Select workspace"
            value={activeWorkspaceId}
            onChange={onSelectWorkspace}
            chrome="toolbar"
            triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
            menuClassName="z-[60]"
            options={workspaces.map((workspace) => ({
              value: workspace.id,
              label: getWorkspaceDisplayTitle(workspace),
            }))}
          />
        </div>
      </div>

      <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
        <GlobalSearch compact className="mx-auto w-full max-w-[22rem]" />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <div className={`relative z-50 ${CHROME_HEADER_SELECT_WRAP_CLASS}`}>
          <OsintSelect
            ariaLabel="Select board"
            value={activeBoard?.id || ''}
            onChange={onSelectBoard}
            chrome="toolbar"
            triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
            menuClassName="z-[60]"
            options={availableBoards.map((board) => ({
              value: board.id,
              label: board.name,
            }))}
          />
        </div>
        {activeBoard ? (
          <button
            onClick={onTogglePresentationMode}
            className={`inline-flex ${CHROME_HEADER_CONTROL_HEIGHT_CLASS} w-[30px] items-center justify-center p-0 ${getChromeToggleButtonClass(
              !!activeBoard.presentationMode
            )}`}
            title={activeBoard.presentationMode ? 'Presentation mode' : 'Edit board'}
            aria-label={activeBoard.presentationMode ? 'Presentation mode' : 'Edit board'}
          >
            {activeBoard.presentationMode ? (
              <Presentation className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </button>
        ) : null}
        <button
          onClick={onToggleRightPanel}
          className={`hidden lg:inline-flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(rightPanelOpen)}`}
          title="Toggle Inspector Panel"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </header>
);
