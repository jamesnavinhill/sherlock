import React from 'react';
import { Box, Eye, EyeOff, Lock, Star, Unlock, ZoomIn, ZoomOut } from 'lucide-react';

import { getChromeSegmentButtonClass } from '@/components/ui/chrome';

interface GraphViewportControlsProps {
  isLocked: boolean;
  onToggleHiddenNodes: () => void;
  onToggleLock: () => void;
  onToggleSingletons: () => void;
  onToggleFlaggedOnly: () => void;
  onZoom: (dir: 'IN' | 'OUT') => void;
  showFlaggedOnly: boolean;
  showHiddenNodes: boolean;
  showSingletons: boolean;
}

export const GraphViewportControls: React.FC<GraphViewportControlsProps> = ({
  isLocked,
  onToggleHiddenNodes,
  onToggleLock,
  onToggleSingletons,
  onToggleFlaggedOnly,
  onZoom,
  showFlaggedOnly,
  showHiddenNodes,
  showSingletons,
}) => (
  <div className="pointer-events-none absolute right-4 top-4 z-20">
    <div className="pointer-events-auto flex items-center border border-zinc-800 bg-black/85 p-0.5 shadow-2xl backdrop-blur-md">
      <button
        onClick={onToggleSingletons}
        className={`${getChromeSegmentButtonClass(showSingletons)} relative px-2.5 py-2`}
        title={showSingletons ? 'Hide Singletons' : 'Show Singletons'}
      >
        <Box className="h-3.5 w-3.5" />
        {!showSingletons ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-px w-full rotate-45 scale-110 bg-red-500" />
          </div>
        ) : null}
      </button>
      <div className="mx-1 h-3 w-px bg-zinc-800" />
      <button
        onClick={onToggleHiddenNodes}
        className={`${getChromeSegmentButtonClass(showHiddenNodes)} px-2.5 py-2`}
        title={showHiddenNodes ? 'Hide Deleted' : 'Show Deleted'}
      >
        {showHiddenNodes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <div className="mx-1 h-3 w-px bg-zinc-800" />
      <button
        onClick={onToggleFlaggedOnly}
        className={`${getChromeSegmentButtonClass(showFlaggedOnly)} px-2.5 py-2`}
        title="Show Flagged Only"
      >
        <Star className={`h-3.5 w-3.5 ${showFlaggedOnly ? 'fill-current' : ''}`} />
      </button>
      <div className="mx-1 h-3 w-px bg-zinc-800" />
      <button
        onClick={() => onZoom('OUT')}
        className={`${getChromeSegmentButtonClass(false)} px-2.5 py-2`}
        title="Zoom Out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onZoom('IN')}
        className={`${getChromeSegmentButtonClass(false)} px-2.5 py-2`}
        title="Zoom In"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <div className="mx-1 h-3 w-px bg-zinc-800" />
      <button
        onClick={onToggleLock}
        className={`${getChromeSegmentButtonClass(isLocked)} px-2.5 py-2`}
        title={isLocked ? 'Unlock Simulation' : 'Lock Layout (Performance)'}
      >
        {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
      </button>
    </div>
  </div>
);
