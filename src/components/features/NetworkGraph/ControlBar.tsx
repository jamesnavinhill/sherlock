import React from 'react';
import { Link as LinkIcon, PlusCircle, GitMerge, Briefcase, PanelRight } from 'lucide-react';
import type { Workspace } from '../../../types';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../../domain';
import { GlobalSearch } from '../../ui/GlobalSearch';
import { OsintSelect } from '../../ui/OsintSelect';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '../../ui/chrome';

interface ControlBarProps {
  workspaces: Workspace[];
  filterWorkspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  isLinkingMode: boolean;
  onToggleLinkingMode: () => void;
  onShowAddNode: () => void;
  onShowResolution: () => void;
  pendingClusterCount: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  workspaces,
  filterWorkspaceId,
  onWorkspaceChange,
  showLeftPanel,
  onToggleLeftPanel,
  showRightPanel,
  onToggleRightPanel,
  isLinkingMode,
  onToggleLinkingMode,
  onShowAddNode,
  onShowResolution,
  pendingClusterCount,
}) => {
  return (
    <div className={`${CHROME_HEADER_CLASS} px-6`}>
      <div className="flex h-full min-w-0 items-center gap-3">
        <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
          <button
            onClick={onToggleLeftPanel}
            className={`hidden md:flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(showLeftPanel)}`}
          >
            <Briefcase className="w-4 h-4" />
          </button>
          <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
            <OsintSelect
              ariaLabel={`Select ${CANONICAL_NOUNS.workspace}`}
              value={filterWorkspaceId || ''}
              onChange={onWorkspaceChange}
              chrome="toolbar"
              triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
              options={[
                { value: '', label: `Select ${CANONICAL_NOUNS.workspace}` },
                ...workspaces.map((workspace) => ({
                  value: workspace.id,
                  label: getWorkspaceDisplayTitle(workspace),
                })),
                { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
              ]}
            />
          </div>
        </div>

        <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
          <GlobalSearch compact className="mx-auto w-full max-w-[24rem]" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleLinkingMode}
              className={getChromeMenuButtonClass(isLinkingMode)}
              title="Manual Link Mode"
            >
              <LinkIcon className="w-4 h-4 lg:mr-1" />
              <span className="hidden lg:inline">Link</span>
            </button>
            <button
              onClick={onShowAddNode}
              className={getChromeMenuButtonClass(false)}
              title="Add Manual Node"
            >
              <PlusCircle className="w-4 h-4 lg:mr-1" />
              <span className="hidden lg:inline">Add</span>
            </button>
            <button
              onClick={onShowResolution}
              className={`${getChromeMenuButtonClass(pendingClusterCount > 0)} relative`}
              title={
                pendingClusterCount > 0
                  ? `Consolidate Entities (${pendingClusterCount} cluster${pendingClusterCount === 1 ? '' : 's'} detected)`
                  : 'Consolidate Entities'
              }
            >
              <GitMerge className="w-4 h-4 lg:mr-1" />
              <span className="hidden lg:inline">Resolve</span>
              {pendingClusterCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-osint-primary text-black text-[9px] leading-4 font-bold font-mono text-center">
                  {pendingClusterCount}
                </span>
              )}
            </button>
            <button
              onClick={onToggleRightPanel}
              className={getChromeToggleButtonClass(showRightPanel)}
              title="Toggle Inspector Panel"
              aria-label="Toggle Inspector Panel"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
