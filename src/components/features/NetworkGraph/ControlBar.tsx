import React from 'react';
import {
  ZoomOut,
  ZoomIn,
  Link as LinkIcon,
  PlusCircle,
  GitMerge,
  Lock,
  Unlock,
  Briefcase,
  PanelRight,
  Box,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import type { Workspace } from '../../../types';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../../domain';
import { OsintSelect } from '../../ui/OsintSelect';
import {
  CHROME_HEADER_CLASS,
  getChromeMenuButtonClass,
  getChromeSegmentButtonClass,
  getChromeToggleButtonClass,
} from '../../ui/chrome';

interface ControlBarProps {
  workspaces: Workspace[];
  filterCaseId: string;
  onCaseChange: (workspaceId: string) => void;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
  showRightPanel: boolean;
  onToggleRightPanel: () => void;
  showSingletons: boolean;
  onToggleSingletons: () => void;
  showHiddenNodes: boolean;
  onToggleHiddenNodes: () => void;
  showFlaggedOnly: boolean;
  onToggleFlaggedOnly: () => void;
  isLinkingMode: boolean;
  onToggleLinkingMode: () => void;
  onZoom: (dir: 'IN' | 'OUT') => void;
  onShowAddNode: () => void;
  onShowResolution: () => void;
  pendingClusterCount: number;
  isLocked: boolean;
  onToggleLock: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  workspaces,
  filterCaseId,
  onCaseChange,
  showLeftPanel,
  onToggleLeftPanel,
  showRightPanel,
  onToggleRightPanel,
  showSingletons,
  onToggleSingletons,
  showHiddenNodes,
  onToggleHiddenNodes,
  showFlaggedOnly,
  onToggleFlaggedOnly,
  isLinkingMode,
  onToggleLinkingMode,
  onZoom,
  onShowAddNode,
  onShowResolution,
  pendingClusterCount,
  isLocked,
  onToggleLock,
}) => {
  return (
    <div className={`${CHROME_HEADER_CLASS} flex flex-shrink-0 items-center justify-between px-6`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex ${getChromeToggleButtonClass(showLeftPanel)}`}
        >
          <Briefcase className="w-4 h-4" />
        </button>
        <div className="hidden md:block min-w-[180px] max-w-[220px]">
          <OsintSelect
            ariaLabel={`Select ${CANONICAL_NOUNS.workspace}`}
            value={filterCaseId || ''}
            onChange={onCaseChange}
            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
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

      <div className="hidden lg:flex items-center border border-zinc-800 bg-black/70 p-0.5 mx-4">
        <button
          onClick={onToggleSingletons}
          className={`${getChromeSegmentButtonClass(showSingletons)} relative px-2.5 py-2`}
          title={showSingletons ? 'Hide Singletons' : 'Show Singletons'}
        >
          <Box className="w-3.5 h-3.5" />
          {!showSingletons && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-px bg-red-500 rotate-45 transform scale-110"></div>
            </div>
          )}
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleHiddenNodes}
          className={`${getChromeSegmentButtonClass(showHiddenNodes)} px-2.5 py-2`}
          title={showHiddenNodes ? 'Hide Deleted' : 'Show Deleted'}
        >
          {showHiddenNodes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleFlaggedOnly}
          className={`${getChromeSegmentButtonClass(showFlaggedOnly)} px-2.5 py-2`}
          title="Show Flagged Only"
        >
          <Star className={`w-3.5 h-3.5 ${showFlaggedOnly ? 'fill-current' : ''}`} />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={() => onZoom('OUT')}
          className={`${getChromeSegmentButtonClass(false)} px-2.5 py-2`}
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom('IN')}
          className={`${getChromeSegmentButtonClass(false)} px-2.5 py-2`}
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleLock}
          className={`${getChromeSegmentButtonClass(isLocked)} px-2.5 py-2`}
          title={isLocked ? 'Unlock Simulation' : 'Lock Layout (Performance)'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="h-6 w-px bg-zinc-800 mx-1"></div>
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
  );
};
