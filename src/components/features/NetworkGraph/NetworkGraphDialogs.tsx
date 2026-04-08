import React from 'react';

import type { EntityAliasMap, GraphNodeSubtype, InvestigationLaunchRequest } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RunSetupModal } from '../Runs/RunSetupModal';
import { EntityResolution } from './EntityResolution';
import { NetworkGraphAddNodeOverlay } from './NetworkGraphAddNodeOverlay';

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

interface NetworkGraphDialogsProps {
  activeScopeId?: string | null;
  aliases: EntityAliasMap;
  allEntityNames: string[];
  newNodeLabel: string;
  newNodeSubtype: GraphNodeSubtype;
  newNodeType: 'ENTITY' | 'REPORT';
  nodePendingDeletion: PendingNodeDeletion | null;
  onCloseAddNode: () => void;
  onCloseLeadModal: () => void;
  onCloseNodeDeletion: () => void;
  onCloseResolution: () => void;
  onConfirmDeleteNode: () => Promise<void>;
  onCreateNode: () => void;
  onInvestigateEntity: (request: InvestigationLaunchRequest) => void;
  onNodeLabelChange: (value: string) => void;
  onNodeSubtypeChange: (value: GraphNodeSubtype) => void;
  onNodeTypeChange: (value: 'ENTITY' | 'REPORT') => void;
  onSaveAliases: (aliases: EntityAliasMap) => void;
  selectedLeadForAnalysis: SelectedLeadForAnalysis | null;
  showAddNodeUI: boolean;
  showResolutionModal: boolean;
  subtypeOptions: SubtypeOption[];
}

export const NetworkGraphDialogs: React.FC<NetworkGraphDialogsProps> = ({
  activeScopeId,
  aliases,
  allEntityNames,
  newNodeLabel,
  newNodeSubtype,
  newNodeType,
  nodePendingDeletion,
  onCloseAddNode,
  onCloseLeadModal,
  onCloseNodeDeletion,
  onCloseResolution,
  onConfirmDeleteNode,
  onCreateNode,
  onInvestigateEntity,
  onNodeLabelChange,
  onNodeSubtypeChange,
  onNodeTypeChange,
  onSaveAliases,
  selectedLeadForAnalysis,
  showAddNodeUI,
  showResolutionModal,
  subtypeOptions,
}) => (
  <>
    <NetworkGraphAddNodeOverlay
      show={showAddNodeUI}
      newNodeLabel={newNodeLabel}
      newNodeSubtype={newNodeSubtype}
      newNodeType={newNodeType}
      subtypeOptions={subtypeOptions}
      onClose={onCloseAddNode}
      onCreateNode={onCreateNode}
      onNodeLabelChange={onNodeLabelChange}
      onNodeSubtypeChange={onNodeSubtypeChange}
      onNodeTypeChange={onNodeTypeChange}
    />

    {selectedLeadForAnalysis ? (
      <RunSetupModal
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
