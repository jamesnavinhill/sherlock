import React from 'react';
import { Box, Eye, EyeOff, Lock, Star, Unlock, ZoomIn, ZoomOut } from 'lucide-react';

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

const getViewportButtonClass = (active: boolean) =>
  `inline-flex items-center justify-center px-2 py-2 text-[10px] font-mono uppercase transition outline-none focus-visible:text-osint-primary ${
    active ? 'text-osint-primary' : 'text-zinc-500 hover:text-osint-primary'
  }`;

const VIEWPORT_ICON_CLASS_NAME = 'h-3.5 w-3.5';

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
  <div className="pointer-events-none absolute right-4 top-1 z-20">
    <div
      className="pointer-events-auto flex items-center p-0.5"
      style={{
        backgroundColor: 'color-mix(in oklab, var(--osint-dark) 96%, transparent)',
      }}
    >
      <button
        onClick={onToggleSingletons}
        className={`${getViewportButtonClass(showSingletons)} relative`}
        title={showSingletons ? 'Hide Singletons' : 'Show Singletons'}
      >
        <Box className={VIEWPORT_ICON_CLASS_NAME} />
        {!showSingletons ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-px w-full rotate-45 scale-110 bg-red-500" />
          </div>
        ) : null}
      </button>
      <div className="mx-0.5 h-3 w-px bg-[color:color-mix(in_oklab,var(--osint-ink)_12%,transparent)]" />
      <button
        onClick={onToggleHiddenNodes}
        className={getViewportButtonClass(showHiddenNodes)}
        title={showHiddenNodes ? 'Hide Deleted' : 'Show Deleted'}
      >
        {showHiddenNodes ? (
          <Eye className={VIEWPORT_ICON_CLASS_NAME} />
        ) : (
          <EyeOff className={VIEWPORT_ICON_CLASS_NAME} />
        )}
      </button>
      <div className="mx-0.5 h-3 w-px bg-[color:color-mix(in_oklab,var(--osint-ink)_12%,transparent)]" />
      <button
        onClick={onToggleFlaggedOnly}
        className={getViewportButtonClass(showFlaggedOnly)}
        title="Show Flagged Only"
      >
        <Star className={`${VIEWPORT_ICON_CLASS_NAME} ${showFlaggedOnly ? 'fill-current' : ''}`} />
      </button>
      <div className="mx-0.5 h-3 w-px bg-[color:color-mix(in_oklab,var(--osint-ink)_12%,transparent)]" />
      <button
        onClick={() => onZoom('OUT')}
        className={getViewportButtonClass(false)}
        title="Zoom Out"
      >
        <ZoomOut className={VIEWPORT_ICON_CLASS_NAME} />
      </button>
      <button
        onClick={() => onZoom('IN')}
        className={getViewportButtonClass(false)}
        title="Zoom In"
      >
        <ZoomIn className={VIEWPORT_ICON_CLASS_NAME} />
      </button>
      <div className="mx-0.5 h-3 w-px bg-[color:color-mix(in_oklab,var(--osint-ink)_12%,transparent)]" />
      <button
        onClick={onToggleLock}
        className={getViewportButtonClass(isLocked)}
        title={isLocked ? 'Unlock Simulation' : 'Lock Layout (Performance)'}
      >
        {isLocked ? (
          <Lock className={VIEWPORT_ICON_CLASS_NAME} />
        ) : (
          <Unlock className={VIEWPORT_ICON_CLASS_NAME} />
        )}
      </button>
    </div>
  </div>
);
