import React from 'react';

import type {
  EntityAliasMap,
  GraphNodeSubtype,
  InvestigationLaunchRequest,
} from '@/types';
import { TaskSetupModal } from '../Runs/TaskSetupModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EntityResolution } from './EntityResolution';
import { getEntityToneClass } from '@/utils/entityPalette';

interface SelectedLeadForAnalysis {
  text: string;
  context?: { topic: string; summary: string };
}

interface SubtypeOption {
  value: GraphNodeSubtype;
  label: string;
  className?: string;
}

interface PendingNodeDeletion {
  label: string;
  isManual?: boolean;
}

interface NetworkGraphOverlaysProps {
  selectedLeadForAnalysis: SelectedLeadForAnalysis | null;
  activeScopeId?: string | null;
  showAddNodeUI: boolean;
  newNodeLabel: string;
  newNodeType: 'ENTITY' | 'CASE';
  newNodeSubtype: GraphNodeSubtype;
  subtypeOptions: SubtypeOption[];
  showResolutionModal: boolean;
  aliases: EntityAliasMap;
  allEntityNames: string[];
  nodePendingDeletion: PendingNodeDeletion | null;
  onInvestigateEntity: (request: InvestigationLaunchRequest) => void;
  onCloseLeadModal: () => void;
  onCloseAddNode: () => void;
  onCreateNode: () => void;
  onNodeLabelChange: (value: string) => void;
  onNodeTypeChange: (value: 'ENTITY' | 'CASE') => void;
  onNodeSubtypeChange: (value: GraphNodeSubtype) => void;
  onCloseResolution: () => void;
  onSaveAliases: (aliases: EntityAliasMap) => void;
  onCloseNodeDeletion: () => void;
  onConfirmDeleteNode: () => Promise<void>;
}

export const NetworkGraphOverlays: React.FC<NetworkGraphOverlaysProps> = ({
  selectedLeadForAnalysis,
  activeScopeId,
  showAddNodeUI,
  newNodeLabel,
  newNodeType,
  newNodeSubtype,
  subtypeOptions,
  showResolutionModal,
  aliases,
  allEntityNames,
  nodePendingDeletion,
  onInvestigateEntity,
  onCloseLeadModal,
  onCloseAddNode,
  onCreateNode,
  onNodeLabelChange,
  onNodeTypeChange,
  onNodeSubtypeChange,
  onCloseResolution,
  onSaveAliases,
  onCloseNodeDeletion,
  onConfirmDeleteNode,
}) => (
  <>
    {showAddNodeUI ? (
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
          <button onClick={onCloseAddNode} className="text-xs text-zinc-500 hover:text-white">
            Cancel
          </button>
          <button onClick={onCreateNode} className="osint-button-primary px-3 py-1 text-xs font-bold">
            ADD
          </button>
        </div>
      </div>
    ) : null}

    {selectedLeadForAnalysis ? (
      <TaskSetupModal
        initialTopic={selectedLeadForAnalysis.text}
        initialContext={selectedLeadForAnalysis.context}
        initialScopeId={activeScopeId || undefined}
        onCancel={onCloseLeadModal}
        onStart={(topic, configOverride, preseededEntities, scope, dateRange) => {
          onInvestigateEntity({
            topic,
            parentContext: selectedLeadForAnalysis.context,
            configOverride,
            preseededEntities,
            scope,
            dateRangeOverride: dateRange,
            launchSource: 'NETWORK_GRAPH',
          });
          onCloseLeadModal();
        }}
      />
    ) : null}

    {showResolutionModal ? (
      <EntityResolution
        allEntities={allEntityNames}
        currentAliases={aliases}
        onSaveAliases={onSaveAliases}
        onClose={onCloseResolution}
      />
    ) : null}

    {nodePendingDeletion ? (
      <ConfirmDialog
        title={nodePendingDeletion.isManual ? 'Delete Manual Node' : 'Remove Graph Node'}
        description={
          nodePendingDeletion.isManual
            ? `Delete "${nodePendingDeletion.label}" and its manual links from the graph?`
            : `Remove "${nodePendingDeletion.label}" from the graph and hide it from this workspace view?`
        }
        confirmLabel={nodePendingDeletion.isManual ? 'Delete Node' : 'Remove Node'}
        tone="danger"
        onClose={onCloseNodeDeletion}
        onConfirm={() => void onConfirmDeleteNode()}
      />
    ) : null}
  </>
);
