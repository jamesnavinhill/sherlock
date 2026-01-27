import React, { useState, useEffect } from 'react';
import { EntityAliasMap } from '../../types';
import { GitMerge, X, Check, AlertCircle, ArrowRight, Trash2, Split, Wand2, ArrowLeftRight, ArrowDown, Layers, MousePointer2, CheckSquare, Square } from 'lucide-react';

interface EntityResolutionProps {
  allEntities: string[];
  currentAliases: EntityAliasMap;
  onSaveAliases: (newAliases: EntityAliasMap) => void;
  onClose: () => void;
}

import { getLevenshteinDistance, getCoreName, getTokens } from '../../../utils/entityUtils';

export const EntityResolution: React.FC<EntityResolutionProps> = ({
  allEntities,
  currentAliases,
  onSaveAliases,
  onClose
}) => {
  // Instead of pairs, we now track Clusters (groups of variants)
  const [clusters, setClusters] = useState<string[][]>([]);
  const [selectedCanonicals, setSelectedCanonicals] = useState<Record<number, string>>({}); // Map cluster index to selected canonical
  const [activeTab, setActiveTab] = useState<'CLUSTERS' | 'MANAGE'>('CLUSTERS');
  const [ignoredClusters, setIgnoredClusters] = useState<Set<string>>(new Set());
  const [autoMergeCount, setAutoMergeCount] = useState(0);

  // Track which items are EXCLUDED from the merge (User unchecked them)
  // Key format: "clusterIdx::variantString"
  const [excludedVariants, setExcludedVariants] = useState<Set<string>>(new Set());

  // Union-Find implementation to group chains: A~B, B~C => {A,B,C}
  useEffect(() => {
    // 1. Resolve all entities to their current canonical form
    const resolvedSet = new Set<string>();
    allEntities.forEach(e => {
      const canonical = currentAliases[e] || e;
      resolvedSet.add(canonical);
    });

    const uniqueEntities = Array.from(resolvedSet);
    const parent: Record<string, string> = {};

    // Initialize Union-Find
    uniqueEntities.forEach(e => parent[e] = e);

    const find = (i: string): string => {
      if (parent[i] === i) return i;
      return find(parent[i]);
    };

    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
      }
    };

    // 2. Pairwise comparison to build connections
    for (let i = 0; i < uniqueEntities.length; i++) {
      for (let j = i + 1; j < uniqueEntities.length; j++) {
        const entA = uniqueEntities[i];
        const entB = uniqueEntities[j];

        const coreA = getCoreName(entA);
        const coreB = getCoreName(entB);

        let isMatch = false;

        // STRATEGY 1: Exact Core Match
        if (coreA === coreB && coreA.length > 0) isMatch = true;

        // STRATEGY 2: Core Substring
        if (!isMatch && coreA.length > 3 && coreB.length > 3) {
          if (coreA.includes(coreB) || coreB.includes(coreA)) {
            if (Math.min(coreA.length, coreB.length) > 4) isMatch = true;
          }
        }

        // STRATEGY 3: Levenshtein
        if (!isMatch) {
          const dist = getLevenshteinDistance(coreA, coreB);
          const maxLength = Math.max(coreA.length, coreB.length);
          if (maxLength > 0 && dist / maxLength < 0.2) isMatch = true;
        }

        // STRATEGY 4: Jaccard
        if (!isMatch) {
          const tokensA = getTokens(entA);
          const tokensB = getTokens(entB);
          if (tokensA.size > 0 && tokensB.size > 0) {
            const intersection = new Set([...tokensA].filter(x => tokensB.has(x)));
            const unionSet = new Set([...tokensA, ...tokensB]);
            const jaccard = intersection.size / unionSet.size;
            if (jaccard > 0.6) isMatch = true;
          }
        }

        if (isMatch) {
          union(entA, entB);
        }
      }
    }

    // 3. Group by Root Parent
    const rawClusters: Record<string, string[]> = {};
    uniqueEntities.forEach(e => {
      const root = find(e);
      if (!rawClusters[root]) rawClusters[root] = [];
      rawClusters[root].push(e);
    });

    // 4. Filter for clusters > 1 and not ignored
    const newClusters = Object.values(rawClusters)
      .filter(c => c.length > 1)
      .filter(c => {
        // Generate a simple key for the cluster to check ignore list
        const key = c.sort().join('::');
        return !ignoredClusters.has(key);
      });

    // 5. Default Canonicals (pick the longest string by default as it usually has more info)
    const defaults: Record<number, string> = {};
    newClusters.forEach((cluster, idx) => {
      defaults[idx] = cluster.reduce((a, b) => a.length >= b.length ? a : b);
    });

    setClusters(newClusters);
    setSelectedCanonicals(defaults);
    setAutoMergeCount(newClusters.length);

  }, [allEntities, currentAliases, ignoredClusters]);

  const toggleVariantExclusion = (clusterIdx: number, variant: string) => {
    const key = `${clusterIdx}::${variant}`;
    setExcludedVariants(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleMergeCluster = (clusterIdx: number) => {
    const cluster = clusters[clusterIdx];
    const target = selectedCanonicals[clusterIdx];

    if (!target || !cluster) return;

    const newAliases = { ...currentAliases };

    cluster.forEach(variant => {
      // Skip if it's the target OR if user explicitly excluded it
      const isExcluded = excludedVariants.has(`${clusterIdx}::${variant}`);

      if (variant !== target && !isExcluded) {
        // Map variant -> target
        newAliases[variant] = target;

        // Re-map recursively
        Object.keys(newAliases).forEach(key => {
          if (newAliases[key] === variant) {
            newAliases[key] = target;
          }
        });
      }
    });

    onSaveAliases(newAliases);
  };

  const handleAutoMergeAll = () => {
    let newAliases = { ...currentAliases };

    clusters.forEach((cluster, idx) => {
      const target = selectedCanonicals[idx];
      if (!target) return;

      cluster.forEach(variant => {
        const isExcluded = excludedVariants.has(`${idx}::${variant}`);
        if (variant !== target && !isExcluded) {
          newAliases[variant] = target;
          Object.keys(newAliases).forEach(key => {
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
    setIgnoredClusters(prev => new Set(prev).add(key));
  };

  const handleUnmerge = (aliasKey: string) => {
    const newAliases = { ...currentAliases };
    delete newAliases[aliasKey];
    onSaveAliases(newAliases);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-osint-panel w-[95vw] h-[90vh] border border-zinc-700 shadow-2xl flex flex-col relative overflow-hidden rounded-sm">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-black flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="bg-zinc-900 p-2 border border-zinc-800">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono text-white uppercase tracking-wider">Entity Clustering</h2>
              <p className="text-xs text-zinc-500 font-mono">Multi-node identity consolidation protocol.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === 'CLUSTERS' && autoMergeCount > 0 && (
              <button
                onClick={handleAutoMergeAll}
                className="flex items-center px-4 py-2 bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/40 hover:border-cyan-400 transition-all font-mono text-xs font-bold uppercase tracking-wider animate-pulse"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Merge All Clusters ({autoMergeCount})
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('CLUSTERS')}
            className={`flex-1 md:flex-none px-8 py-4 text-xs font-mono font-bold uppercase tracking-wider border-r border-zinc-800 transition-all ${activeTab === 'CLUSTERS' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            Detected Clusters ({clusters.length})
          </button>
          <button
            onClick={() => setActiveTab('MANAGE')}
            className={`flex-1 md:flex-none px-8 py-4 text-xs font-mono font-bold uppercase tracking-wider border-r border-zinc-800 transition-all ${activeTab === 'MANAGE' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
          >
            Active Mappings ({Object.keys(currentAliases).length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-black/50">

          {activeTab === 'CLUSTERS' && (
            <div className="space-y-6">
              {clusters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 min-h-[400px]">
                  <div className="bg-zinc-900/50 p-6 rounded-full border border-zinc-800 mb-6">
                    <Check className="w-16 h-16 opacity-50" />
                  </div>
                  <p className="font-mono text-xl uppercase tracking-widest text-zinc-400 mb-2">Network Harmonized</p>
                  <p className="text-sm font-mono">No identity clusters detected.</p>
                </div>
              ) : (
                clusters.map((cluster, idx) => (
                  <div key={idx} className="bg-osint-panel border border-zinc-800 p-6 flex flex-col md:flex-row gap-6 relative group hover:border-cyan-900/50 transition-colors">

                    {/* Left: Cluster List */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-cyan-500" />
                        <h3 className="text-sm font-mono font-bold text-white uppercase">
                          Identity Cluster #{idx + 1}
                        </h3>
                        <span className="text-xs text-zinc-500 font-mono">({cluster.length} variations)</span>
                      </div>

                      <div className="space-y-1 bg-zinc-900/50 p-4 border border-zinc-800">
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-mono mb-2 px-2">
                          <span>Target Node</span>
                          <span>Include in Merge</span>
                        </div>
                        {cluster.map((variant) => {
                          const isSelected = selectedCanonicals[idx] === variant;
                          const isExcluded = excludedVariants.has(`${idx}::${variant}`);
                          const isIncluded = !isExcluded;

                          return (
                            <div key={variant} className={`flex items-start justify-between p-3 rounded transition-colors ${isSelected ? 'bg-cyan-900/10 border border-cyan-900/30' : 'hover:bg-zinc-800 border border-transparent'}`}>

                              {/* Target Selection (Radio) */}
                              <div className="flex items-start flex-1 cursor-pointer pt-0.5" onClick={() => setSelectedCanonicals({ ...selectedCanonicals, [idx]: variant })}>
                                <input
                                  type="radio"
                                  name={`cluster-${idx}`}
                                  checked={isSelected}
                                  onChange={() => { }} // Handled by div click
                                  className="form-radio text-cyan-500 bg-black border-zinc-600 focus:ring-cyan-500 focus:ring-offset-black mt-1"
                                />
                                <span className={`ml-3 font-mono text-sm break-words leading-relaxed ${isSelected ? 'text-white font-bold' : 'text-zinc-400'}`}>
                                  {variant}
                                </span>
                                {isSelected && (
                                  <span className="ml-2 text-[10px] text-cyan-500 font-bold uppercase tracking-wider bg-black px-1 rounded whitespace-nowrap mt-0.5">MASTER</span>
                                )}
                              </div>

                              {/* Inclusion Toggle (Checkbox) */}
                              <div className="ml-4 border-l border-zinc-800 pl-4 pt-0.5" title={isSelected ? "Target node is always included" : "Check to merge this entity"}>
                                <button
                                  onClick={() => !isSelected && toggleVariantExclusion(idx, variant)}
                                  disabled={isSelected}
                                  className={`p-1 rounded transition-colors ${isSelected ? 'opacity-30 cursor-not-allowed' : 'hover:text-white'}`}
                                >
                                  {isSelected || isIncluded ? (
                                    <CheckSquare className={`w-5 h-5 ${isSelected ? 'text-cyan-500' : 'text-zinc-400'}`} />
                                  ) : (
                                    <Square className="w-5 h-5 text-zinc-600" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full md:w-64 flex flex-col justify-center space-y-3 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-6">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1 text-center md:text-left">
                        Action Required
                      </div>

                      <button
                        onClick={() => handleMergeCluster(idx)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-zinc-200 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]"
                      >
                        <GitMerge className="w-4 h-4 mr-2" />
                        Harmonize Group
                      </button>

                      <button
                        onClick={() => handleIgnoreCluster(idx)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-mono uppercase transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Ignore Cluster
                      </button>

                      <div className="mt-4 p-3 bg-cyan-900/10 border border-cyan-900/30 text-[10px] text-cyan-400 font-mono leading-tight">
                        <span className="font-bold">NOTE:</span> Selected nodes will merge into "{selectedCanonicals[idx]?.substring(0, 15)}...". Unchecked nodes remain distinct.
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
                  <p className="font-mono text-lg uppercase">No Active Merges</p>
                </div>
              ) : (
                Object.entries(currentAliases).map(([alias, canonical]) => (
                  <div key={alias} className="bg-zinc-900/30 border border-zinc-800 p-4 flex flex-col md:flex-row items-center justify-between group hover:border-zinc-600 transition-colors">
                    <div className="flex flex-1 items-center justify-center md:justify-start w-full md:w-auto mb-4 md:mb-0 space-x-4">
                      <div className="flex-1 text-right md:text-left">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Alias (Hidden)</div>
                        <div className="text-zinc-300 font-mono text-sm break-all line-through decoration-red-500/50 decoration-2">{alias}</div>
                      </div>

                      <ArrowRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />

                      <div className="flex-1 text-left">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Canonical (Shown)</div>
                        <div className="text-white font-mono font-bold text-sm break-all">{canonical}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnmerge(alias)}
                      className="w-full md:w-auto px-4 py-2 bg-black border border-zinc-800 hover:border-red-500 hover:text-red-500 text-zinc-500 transition-all font-mono text-xs uppercase flex items-center justify-center"
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
};