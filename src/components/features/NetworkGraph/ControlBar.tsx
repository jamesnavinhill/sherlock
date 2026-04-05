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
  Box,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import type { Workspace, LabelProfile } from '../../../types';
import { stripLegacyWorkspacePrefix } from '../../../domain';
import { OsintSelect } from '../../ui/OsintSelect';

interface ControlBarProps {
  workspaces: Workspace[];
  labelProfile: LabelProfile;
  filterCaseId: string;
  onCaseChange: (caseId: string) => void;
  showLeftPanel: boolean;
  onToggleLeftPanel: () => void;
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
  labelProfile,
  filterCaseId,
  onCaseChange,
  showLeftPanel,
  onToggleLeftPanel,
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
    <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg flex-shrink-0">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex items-center justify-center p-2 border transition-all ${showLeftPanel ? 'bg-zinc-800 border-white text-white' : 'bg-black border-zinc-700 text-zinc-400 hover:text-white'}`}
        >
          <Briefcase className="w-4 h-4" />
        </button>
        <div className="hidden md:block min-w-[180px] max-w-[220px]">
          <OsintSelect
            ariaLabel={`Select ${labelProfile.workspaceLabel}`}
            value={filterCaseId || ''}
            onChange={onCaseChange}
            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
            options={[
              { value: '', label: `Select ${labelProfile.workspaceLabel}` },
              ...workspaces.map((workspace) => ({
                value: workspace.id,
                label: stripLegacyWorkspacePrefix(workspace.title),
              })),
              { value: 'ALL', label: `All ${labelProfile.workspaceLabelPlural} (Global View)` },
            ]}
          />
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-700/50 rounded-sm p-0.5 mx-4">
        <button
          onClick={onToggleSingletons}
          className={`p-1.5 ${showSingletons ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-500'} transition-colors relative group`}
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
          className={`p-1.5 ${showHiddenNodes ? 'text-osint-warn' : 'text-zinc-500 hover:text-white'} transition-colors`}
          title={showHiddenNodes ? 'Hide Deleted' : 'Show Deleted'}
        >
          {showHiddenNodes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleFlaggedOnly}
          className={`p-1.5 ${showFlaggedOnly ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'} transition-colors`}
          title="Show Flagged Only"
        >
          <Star className={`w-3.5 h-3.5 ${showFlaggedOnly ? 'fill-current' : ''}`} />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={() => onZoom('OUT')}
          className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onZoom('IN')}
          className="p-1.5 text-zinc-500 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleLock}
          className={`p-1.5 ${isLocked ? 'text-osint-primary' : 'text-zinc-500 hover:text-white'} transition-colors`}
          title={isLocked ? 'Unlock Simulation' : 'Lock Layout (Performance)'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        <div className="h-6 w-px bg-zinc-800 mx-1"></div>
        <button
          onClick={onToggleLinkingMode}
          className={`p-2 border transition-colors ${isLinkingMode ? 'osint-button-soft' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-white'}`}
          title="Manual Link Mode"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onShowAddNode}
          className="p-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition-colors"
          title="Add Manual Node"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onShowResolution}
          className={`p-2 border transition-colors relative ${
            pendingClusterCount > 0
              ? 'border-osint-primary text-osint-primary hover:text-white hover:border-white'
              : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-white'
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
      </div>
    </div>
  );
};
