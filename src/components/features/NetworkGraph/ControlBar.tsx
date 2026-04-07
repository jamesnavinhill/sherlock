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

interface ControlBarProps {
  workspaces: Workspace[];
  filterCaseId: string;
  onCaseChange: (caseId: string) => void;
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
    <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex items-center justify-center border p-2 transition ${showLeftPanel ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'}`}
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

      {/* Filter Toggles */}
      <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-700/50 rounded-sm p-0.5 mx-4">
        <button
          onClick={onToggleSingletons}
          className={`p-1.5 ${showSingletons ? 'text-osint-primary' : 'text-zinc-500 hover:text-osint-primary'} transition-colors relative group`}
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
          className={`p-1.5 ${showHiddenNodes ? 'text-osint-primary' : 'text-zinc-500 hover:text-osint-primary'} transition-colors`}
          title={showHiddenNodes ? 'Hide Deleted' : 'Show Deleted'}
        >
          {showHiddenNodes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleFlaggedOnly}
          className={`p-1.5 ${showFlaggedOnly ? 'text-osint-primary' : 'text-zinc-500 hover:text-osint-primary'} transition-colors`}
          title="Show Flagged Only"
        >
          <Star className={`w-3.5 h-3.5 ${showFlaggedOnly ? 'fill-current' : ''}`} />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={() => onZoom('OUT')}
          className="p-1.5 text-zinc-500 hover:text-osint-primary transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom('IN')}
          className="p-1.5 text-zinc-500 hover:text-osint-primary transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleLock}
          className={`p-1.5 ${isLocked ? 'text-osint-primary' : 'text-zinc-500 hover:text-osint-primary'} transition-colors`}
          title={isLocked ? 'Unlock Simulation' : 'Lock Layout (Performance)'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="h-6 w-px bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleLinkingMode}
          className={`p-2 border transition-colors ${isLinkingMode ? 'osint-button-soft' : 'osint-button-chrome'}`}
          title="Manual Link Mode"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onShowAddNode}
          className="osint-button-chrome p-2 transition-colors"
          title="Add Manual Node"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onShowResolution}
          className={`p-2 border transition-colors relative ${
            pendingClusterCount > 0
              ? 'osint-button-chrome-active text-osint-primary'
              : 'osint-button-chrome'
          }`}
          title={
            pendingClusterCount > 0
              ? `Consolidate Entities (${pendingClusterCount} cluster${pendingClusterCount === 1 ? '' : 's'} detected)`
              : 'Consolidate Entities'
          }
        >
          <GitMerge className="w-4 h-4" />
          {pendingClusterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-osint-primary text-black text-[9px] leading-4 font-bold font-mono text-center">
              {pendingClusterCount}
            </span>
          )}
        </button>
        <button
          onClick={onToggleRightPanel}
          className={`p-2 border transition-colors ${
            showRightPanel ? 'osint-button-chrome-active text-osint-primary' : 'osint-button-chrome'
          }`}
          title="Toggle Inspector Panel"
          aria-label="Toggle Inspector Panel"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
