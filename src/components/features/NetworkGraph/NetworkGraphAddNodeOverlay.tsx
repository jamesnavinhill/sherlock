import React, { useState } from 'react';

import type { GraphNodeSubtype } from '@/types';
import { AppIcon, getDefaultGraphNodeIconId, getAppIconLabel, type AppIconId } from '@/lib/appIcons';
import { IconPickerOverlay } from '@/components/ui/IconPickerOverlay';
import { getEntityToneClass } from '@/utils/entityPalette';

interface SubtypeOption {
  value: GraphNodeSubtype;
  label: string;
  className?: string;
}

interface NetworkGraphAddNodeOverlayProps {
  newNodeLabel: string;
  newNodeIconId: AppIconId | null;
  newNodeSubtype: GraphNodeSubtype;
  newNodeType: 'ENTITY' | 'REPORT';
  onClose: () => void;
  onCreateNode: () => void;
  onNodeLabelChange: (value: string) => void;
  onNodeIconChange: (value: AppIconId | null) => void;
  onNodeSubtypeChange: (value: GraphNodeSubtype) => void;
  onNodeTypeChange: (value: 'ENTITY' | 'REPORT') => void;
  show: boolean;
  subtypeOptions: SubtypeOption[];
}

export const NetworkGraphAddNodeOverlay: React.FC<NetworkGraphAddNodeOverlayProps> = ({
  newNodeLabel,
  newNodeIconId,
  newNodeSubtype,
  newNodeType,
  onClose,
  onCreateNode,
  onNodeLabelChange,
  onNodeIconChange,
  onNodeSubtypeChange,
  onNodeTypeChange,
  show,
  subtypeOptions,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!show) return null;

  const resolvedIconId =
    newNodeIconId ||
    getDefaultGraphNodeIconId({
      type: newNodeType,
      subtype: newNodeType === 'ENTITY' ? newNodeSubtype : undefined,
    });

  return (
    <>
      <div className="absolute right-4 top-4 z-50 w-72 border border-zinc-700 bg-black/90 p-4 shadow-xl">
        <h3 className="mb-3 text-xs font-bold text-white">ADD MANUAL NODE</h3>
        <input
          autoFocus
          value={newNodeLabel}
          onChange={(event) => onNodeLabelChange(event.target.value)}
          placeholder="Node Label..."
          className="mb-2 w-full border border-zinc-700 bg-black px-3 py-2 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary placeholder:text-zinc-600"
        />
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => onNodeTypeChange('ENTITY')}
            className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${
              newNodeType === 'ENTITY' ? 'osint-button-chrome-active' : 'osint-button-chrome'
            }`}
          >
            ENTITY
          </button>
          <button
            onClick={() => onNodeTypeChange('REPORT')}
            className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${
              newNodeType === 'REPORT' ? 'osint-button-chrome-active' : 'osint-button-chrome'
            }`}
          >
            REPORT
          </button>
        </div>

        {newNodeType === 'ENTITY' ? (
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {subtypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onNodeSubtypeChange(option.value)}
                className={`min-w-0 whitespace-nowrap px-1.5 py-1.5 text-center text-[9px] leading-none border ${
                  newNodeSubtype === option.value
                    ? `${getEntityToneClass(option.value)} entity-tone-toggle-active`
                    : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'
                } ${option.className || ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setShowIconPicker(true)}
          className="mb-4 flex w-full items-center justify-between border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-left text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-200">
              <AppIcon iconId={resolvedIconId} size={18} strokeWidth={1.9} />
            </span>
            <span className="min-w-0">
              <span className="osint-meta-label-strong block">Icon</span>
              <span className="osint-body-quiet block truncate">
                {newNodeIconId ? getAppIconLabel(newNodeIconId) : 'Using default icon'}
              </span>
            </span>
          </span>
          <span className="osint-meta-label">Choose</span>
        </button>
        <div className="flex justify-between">
          <button onClick={onClose} className="text-xs text-zinc-500 hover:text-white">
            Cancel
          </button>
          <button onClick={onCreateNode} className="osint-button-primary px-3 py-1 text-xs font-bold">
            ADD
          </button>
        </div>
      </div>

      <IconPickerOverlay
        isOpen={showIconPicker}
        title="Manual Node Icon"
        description="Choose an override for this manual node. Leave it on default to follow the built-in node icon mapping."
        selectedIconId={newNodeIconId}
        allowDefault
        defaultLabel="Use Default Node Icon"
        onClose={() => setShowIconPicker(false)}
        onSelect={onNodeIconChange}
      />
    </>
  );
};
