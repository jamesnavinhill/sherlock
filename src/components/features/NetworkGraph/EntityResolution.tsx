import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { EntityAliasMap } from '../../../types';
import {
  GitMerge,
  X,
  Check,
  AlertCircle,
  ArrowRight,
  Trash2,
  Split,
  Wand2,
  Layers,
  CheckSquare,
  Square,
} from 'lucide-react';
import { detectEntityClusters } from './entityResolutionUtils';

interface EntityResolutionProps {
  allEntities: string[];
  currentAliases: EntityAliasMap;
  onSaveAliases: (newAliases: EntityAliasMap) => void;
  onClose: () => void;
}

export const EntityResolution: React.FC<EntityResolutionProps> = ({
  allEntities,
  currentAliases,
  onSaveAliases,
  onClose,
}) => {
  // Instead of pairs, we now track Clusters (groups of variants)
  const [selectedCanonicals, setSelectedCanonicals] = useState<Record<number, string>>({}); // Map cluster index to selected canonical
  const [activeTab, setActiveTab] = useState<'CLUSTERS' | 'MANAGE'>('CLUSTERS');
  const [ignoredClusters, setIgnoredClusters] = useState<Set<string>>(new Set());

  // Track which items are EXCLUDED from the merge (User unchecked them)
  // Key format: "clusterIdx::variantString"
  const [excludedVariants, setExcludedVariants] = useState<Set<string>>(new Set());

  // Union-Find implementation to group chains: A~B, B~C => {A,B,C}
  const clusters = useMemo(
    () => detectEntityClusters(allEntities, currentAliases, ignoredClusters),
    [allEntities, currentAliases, ignoredClusters]
  );

  const defaultCanonicals = useMemo(() => {
    const defaults: Record<number, string> = {};
    clusters.forEach((cluster, idx) => {
      defaults[idx] = cluster.reduce((a, b) => (a.length >= b.length ? a : b));
    });
    return defaults;
  }, [clusters]);

  const canonicalSelections = useMemo(
    () => ({
      ...defaultCanonicals,
      ...selectedCanonicals,
    }),
    [defaultCanonicals, selectedCanonicals]
  );

  const toggleVariantExclusion = (clusterIdx: number, variant: string) => {
    const key = `${clusterIdx}::${variant}`;
    setExcludedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMergeCluster = (clusterIdx: number) => {
    const cluster = clusters[clusterIdx];
    const target = canonicalSelections[clusterIdx];

    if (!target || !cluster) return;

    const newAliases = { ...currentAliases };

    cluster.forEach((variant) => {
      // Skip if it's the target OR if user explicitly excluded it
      const isExcluded = excludedVariants.has(`${clusterIdx}::${variant}`);

      if (variant !== target && !isExcluded) {
        // Map variant -> target
        newAliases[variant] = target;

        // Re-map recursively
        Object.keys(newAliases).forEach((key) => {
          if (newAliases[key] === variant) {
            newAliases[key] = target;
          }
        });
      }
    });

    onSaveAliases(newAliases);
  };

  const handleAutoMergeAll = () => {
    const newAliases = { ...currentAliases };

    clusters.forEach((cluster, idx) => {
      const target = canonicalSelections[idx];
      if (!target) return;

      cluster.forEach((variant) => {
        const isExcluded = excludedVariants.has(`${idx}::${variant}`);
        if (variant !== target && !isExcluded) {
          newAliases[variant] = target;
          Object.keys(newAliases).forEach((key) => {
            if (newAliases[key] === variant) {
              newAliases[key] = target;
            }
          });
        }
      });
    });

    onSaveAliases(newAliases);
  };

  const handleIgnoreCluster = (clusterIdx: number) => {
    const cluster = clusters[clusterIdx];
    const key = cluster.sort().join('::');
    setIgnoredClusters((prev) => new Set(prev).add(key));
  };

  const handleUnmerge = (aliasKey: string) => {
    const newAliases = { ...currentAliases };
    delete newAliases[aliasKey];
    onSaveAliases(newAliases);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modalContent = (
    <div
      className="osint-shell-backdrop fixed inset-0 z-[1200] flex items-center justify-center p-4 animate-in fade-in duration-300 md:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="osint-shell-dialog-panel flex h-[90vh] w-[95vw] flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="osint-panel-header flex shrink-0 items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="osint-shell-chip p-2">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="osint-title-section">Entity Clustering</h2>
              <p className="osint-body-quiet mt-1">Multi-node identity consolidation protocol.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === 'CLUSTERS' && clusters.length > 0 && (
              <button
                onClick={handleAutoMergeAll}
                className="osint-button-primary osint-meta-label-strong inline-flex items-center px-4 py-2 animate-pulse"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Merge All Clusters ({clusters.length})
              </button>
            )}
            <button
              onClick={onClose}
              className="osint-button-chrome p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="osint-shell-dialog-footer flex shrink-0">
          <button
            onClick={() => setActiveTab('CLUSTERS')}
            className={`osint-meta-label-strong flex-1 border-r border-zinc-800 px-8 py-4 transition-all md:flex-none ${activeTab === 'CLUSTERS' ? 'osint-button-soft' : 'osint-button-chrome border-0 bg-transparent text-[color:var(--osint-text-muted)] shadow-none hover:text-[color:var(--osint-text-heading)]'}`}
          >
            Detected Clusters ({clusters.length})
          </button>
          <button
            onClick={() => setActiveTab('MANAGE')}
            className={`osint-meta-label-strong flex-1 border-r border-zinc-800 px-8 py-4 transition-all md:flex-none ${activeTab === 'MANAGE' ? 'osint-button-soft' : 'osint-button-chrome border-0 bg-transparent text-[color:var(--osint-text-muted)] shadow-none hover:text-[color:var(--osint-text-heading)]'}`}
          >
            Active Mappings ({Object.keys(currentAliases).length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === 'CLUSTERS' && (
            <div className="space-y-6">
              {clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 min-h-[400px]">
                  <div className="bg-zinc-900/50 p-6 rounded-full border border-zinc-800 mb-6">
                    <Check className="w-16 h-16 opacity-50" />
                  </div>
                  <p className="osint-title-section mb-2 text-zinc-400">Network Harmonized</p>
                  <p className="osint-body-small">No identity clusters detected.</p>
                </div>
              ) : (
                clusters.map((cluster, idx) => (
                  <div
                    key={idx}
                    className="osint-shell-stage-surface p-6 flex flex-col md:flex-row gap-6 relative group hover:border-osint-primary/50 transition-colors"
                  >
                    {/* Left: Cluster List */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-osint-primary" />
                        <h3 className="osint-title-inline">Identity Cluster #{idx + 1}</h3>
                        <span className="osint-body-quiet">({cluster.length} variations)</span>
                      </div>

                      <div className="osint-shell-stage-surface-subtle space-y-1 p-4">
                        <div className="mb-2 flex items-center justify-between px-2">
                          <span className="osint-meta-label">Target Node</span>
                          <span className="osint-meta-label">Include in Merge</span>
                        </div>
                        {cluster.map((variant) => {
                          const isSelected = canonicalSelections[idx] === variant;
                          const isExcluded = excludedVariants.has(`${idx}::${variant}`);
                          const isIncluded = !isExcluded;

                          return (
                            <div
                              key={variant}
                              className={`flex items-start justify-between p-3 rounded transition-colors ${isSelected ? 'bg-osint-primary/10 border border-osint-primary/30' : 'hover:bg-zinc-800 border border-transparent'}`}
                            >
                              {/* Target Selection (Radio) */}
                              <div
                                className="flex items-start flex-1 cursor-pointer pt-0.5"
                                onClick={() =>
                                  setSelectedCanonicals({ ...selectedCanonicals, [idx]: variant })
                                }
                              >
                                <input
                                  type="radio"
                                  name={`cluster-${idx}`}
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by div click
                                  className="form-radio text-osint-primary bg-black border-zinc-600 focus:ring-osint-primary focus:ring-offset-black mt-1"
                                />
                                <span
                                  className={`ml-3 break-words osint-meta-value ${isSelected ? 'text-white font-semibold' : 'text-zinc-400'}`}
                                >
                                  {variant}
                                </span>
                                {isSelected && (
                                  <span className="ml-2 mt-0.5 whitespace-nowrap rounded bg-black px-1 osint-meta-label-strong text-osint-primary">
                                    MASTER
                                  </span>
                                )}
                              </div>

                              {/* Inclusion Toggle (Checkbox) */}
                              <div
                                className="ml-4 border-l border-zinc-800 pl-4 pt-0.5"
                                title={
                                  isSelected
                                    ? 'Target node is always included'
                                    : 'Check to merge this entity'
                                }
                              >
                                <button
                                  onClick={() =>
                                    !isSelected && toggleVariantExclusion(idx, variant)
                                  }
                                  disabled={isSelected}
                                  className={`p-1 rounded transition-colors ${isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
                                >
                                  {isSelected || isIncluded ? (
                                    <CheckSquare
                                      className={`w-5 h-5 ${isSelected ? 'text-osint-primary' : 'text-zinc-400'}`}
                                    />
                                  ) : (
                                    <Square className="w-5 h-5 text-zinc-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full md:w-64 flex flex-col justify-center space-y-3 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                      <div className="mb-1 text-center osint-meta-label md:text-left">
                        Action Required
                      </div>

                      <button
                        onClick={() => handleMergeCluster(idx)}
                        className="osint-button-primary osint-meta-label-strong flex w-full items-center justify-center px-4 py-3"
                      >
                        <GitMerge className="w-4 h-4 mr-2" />
                        Harmonize Group
                      </button>

                      <button
                        onClick={() => handleIgnoreCluster(idx)}
                        className="osint-button-chrome osint-meta-label-strong flex w-full items-center justify-center px-4 py-2"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Ignore Cluster
                      </button>

                      <div className="mt-4 border border-osint-primary/30 bg-osint-primary/10 p-3 osint-body-quiet text-osint-primary">
                        <span className="osint-meta-label-strong text-osint-primary">Note:</span>{' '}
                        Selected nodes will merge into
                        &quot;{canonicalSelections[idx]?.substring(0, 15)}...&quot;. Unchecked nodes
                        remain distinct.
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'MANAGE' && (
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(currentAliases).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 min-h-[400px]">
                  <Split className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="osint-title-inline">No Active Merges</p>
                </div>
              ) : (
                Object.entries(currentAliases).map(([alias, canonical]) => (
                  <div
                    key={alias}
                    className="osint-shell-stage-surface-subtle p-4 flex flex-col md:flex-row items-center justify-between group transition-colors"
                  >
                    <div className="flex flex-1 items-center justify-center md:justify-start w-full md:w-auto mb-4 md:mb-0 space-x-4">
                      <div className="flex-1 text-right md:text-left">
                        <div className="mb-1 osint-meta-label">Alias (Hidden)</div>
                        <div className="break-all osint-meta-value text-zinc-300 line-through decoration-red-500/50 decoration-2">
                          {alias}
                        </div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />

                      <div className="flex-1 text-left">
                        <div className="mb-1 osint-meta-label">Canonical (Shown)</div>
                        <div className="break-all osint-meta-value text-white">{canonical}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnmerge(alias)}
                      className="osint-meta-label-strong osint-danger-inline flex w-full items-center justify-center border border-zinc-800 bg-black px-4 py-2 text-zinc-500 transition-all hover:border-[color:var(--osint-danger-soft-border)] hover:bg-[color:var(--osint-danger-soft-bg)] md:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Unlink
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};
