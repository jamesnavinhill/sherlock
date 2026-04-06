import React from 'react';

import type { GraphNodeSubtype } from '@/types';
import { getEntityToneClass } from '@/utils/entityPalette';

interface SubtypeOption {
  value: GraphNodeSubtype;
  label: string;
  className?: string;
}

interface NetworkGraphAddNodeOverlayProps {
  newNodeLabel: string;
  newNodeSubtype: GraphNodeSubtype;
  newNodeType: 'ENTITY' | 'CASE';
  onClose: () => void;
  onCreateNode: () => void;
  onNodeLabelChange: (value: string) => void;
  onNodeSubtypeChange: (value: GraphNodeSubtype) => void;
  onNodeTypeChange: (value: 'ENTITY' | 'CASE') => void;
  show: boolean;
  subtypeOptions: SubtypeOption[];
}

export const NetworkGraphAddNodeOverlay: React.FC<NetworkGraphAddNodeOverlayProps> = ({
  newNodeLabel,
  newNodeSubtype,
  newNodeType,
  onClose,
  onCreateNode,
  onNodeLabelChange,
  onNodeSubtypeChange,
  onNodeTypeChange,
  show,
  subtypeOptions,
}) =>
  show ? (
    <div className="absolute right-4 top-4 z-50 w-64 border border-zinc-700 bg-black/90 p-4 shadow-xl">
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
          onClick={() => onNodeTypeChange('CASE')}
          className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-colors ${
            newNodeType === 'CASE' ? 'osint-button-chrome-active' : 'osint-button-chrome'
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
      <div className="flex justify-between">
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-white">
          Cancel
        </button>
        <button onClick={onCreateNode} className="osint-button-primary px-3 py-1 text-xs font-bold">
          ADD
        </button>
      </div>
    </div>
  ) : null;
