import { useState } from 'react';

import type { AppIconId } from '@/lib/appIcons';
import type { GraphNode } from './GraphCanvas';
import type { GraphNodeSubtype } from '@/types';

export const useNetworkGraphUiState = () => {
  const [showSingletons, setShowSingletons] = useState(true);
  const [showHiddenNodes, setShowHiddenNodes] = useState(false);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [linkSourceNode, setLinkSourceNode] = useState<GraphNode | null>(null);
  const [showAddNodeUI, setShowAddNodeUI] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeIconId, setNewNodeIconId] = useState<AppIconId | null>(null);
  const [newNodeType, setNewNodeType] = useState<'ENTITY' | 'REPORT'>('ENTITY');
  const [newNodeSubtype, setNewNodeSubtype] = useState<GraphNodeSubtype>('PERSON');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [nodePendingDeletion, setNodePendingDeletion] = useState<GraphNode | null>(null);
  const [selectedLeadForAnalysis, setSelectedLeadForAnalysis] = useState<{
    text: string;
    context?: { topic: string; summary: string };
  } | null>(null);
  const [dossierSections, setDossierSections] = useState<Record<string, boolean>>({
    artifacts: false,
    findings: false,
    entities: false,
    headlines: false,
    followUps: false,
    sources: false,
  });

  const toggleDossierSection = (section: string) => {
    setDossierSections((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      )
    );
  };

  const subtypeOptions: Array<{ value: GraphNodeSubtype; label: string; className?: string }> = [
    { value: 'PERSON', label: 'PERSON' },
    { value: 'ORGANIZATION', label: 'ORG' },
    { value: 'CONCEPT', label: 'CONCEPT' },
    { value: 'SOURCE', label: 'SOURCE', className: 'col-start-1 sm:col-start-2' },
    { value: 'UNKNOWN', label: 'UNKNOWN' },
  ];

  return {
    dossierSections,
    isLinkingMode,
    isLocked,
    linkSourceNode,
    newNodeLabel,
    newNodeIconId,
    newNodeSubtype,
    newNodeType,
    nodePendingDeletion,
    selectedLeadForAnalysis,
    setIsLinkingMode,
    setIsLocked,
    setLinkSourceNode,
    setNewNodeLabel,
    setNewNodeIconId,
    setNewNodeSubtype,
    setNewNodeType,
    setNodePendingDeletion,
    setSelectedLeadForAnalysis,
    setShowAddNodeUI,
    setShowFlaggedOnly,
    setShowHiddenNodes,
    setShowLeftPanel,
    setShowResolutionModal,
    setShowSingletons,
    showAddNodeUI,
    showFlaggedOnly,
    showHiddenNodes,
    showLeftPanel,
    showResolutionModal,
    showSingletons,
    subtypeOptions,
    toggleDossierSection,
  };
};
