import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Network } from 'lucide-react';
import type { InvestigationLaunchRequest, InvestigationReport, ManualConnection, ManualNode, Entity, Headline, Source } from '../../../types';
import { useCaseStore } from '../../../store/caseStore';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';

// Components
import { ControlBar } from './ControlBar';
import type { GraphNode, GraphCanvasRef } from './GraphCanvas';
import { GraphCanvas } from './GraphCanvas';
import { NodeInspector } from './NodeInspector';
import { EntityResolution } from './EntityResolution';
import { detectEntityClusters } from './entityResolutionUtils';
import { DossierPanel } from '../OperationView/DossierPanel'; // REUSE
import { cleanEntityName } from '../../../utils/text';

interface NetworkGraphProps {
    onOpenReport: (report: InvestigationReport) => void;
    onInvestigateEntity: (request: InvestigationLaunchRequest) => void;
    onBack?: () => void;
    navStack?: BreadcrumbItem[];
    onNavigate?: (id: string) => void;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({ onOpenReport, onInvestigateEntity, onBack: _onBack, navStack: _navStack, onNavigate: _onNavigate }) => {
    // Refs
    const graphRef = useRef<GraphCanvasRef>(null);

    // Data State
    const {
        archives: reports,
        manualLinks,
        manualNodes,
        hiddenNodeIds: hiddenNodeIdsArray,
        cases,
        entityAliases: aliases,
        headlines,
        flaggedNodeIds: flaggedNodeIdsArray,
        activeCaseId: filterCaseId,
        activeScope: activeScopeId,
        setManualLinks,
        setManualNodes,
        setEntityAliases: setAliases,
        updateReportTitle,
        renameEntityAcrossReports,
        toggleFlag,
        toggleHide,
        setActiveCaseId
    } = useCaseStore();

    const hiddenNodeIds = useMemo(() => new Set(hiddenNodeIdsArray), [hiddenNodeIdsArray]);
    const flaggedNodeIds = useMemo(() => new Set(flaggedNodeIdsArray), [flaggedNodeIdsArray]);

    // Filter State
    const [showSingletons, setShowSingletons] = useState(true);
    const [showHiddenNodes, setShowHiddenNodes] = useState(false);
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // UI/Panel State
    const [showLeftPanel, setShowLeftPanel] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);

    // Inspector Selection
    const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | 'REPORT' | null>(null);
    const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
    const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
    const [selectedReport, setSelectedReport] = useState<InvestigationReport | null>(null);

    // Linking & Add Node Logic
    const [isLinkingMode, setIsLinkingMode] = useState(false);
    const [linkSourceNode, setLinkSourceNode] = useState<GraphNode | null>(null);
    const [showAddNodeUI, setShowAddNodeUI] = useState(false); // We need to keep this UI here or move to canvas? 
    // Wait, the "Add Node UI" (Lines 824-851) was overlaying the canvas.
    // I should probably pass a prop to GraphCanvas to render it, OR render it here overlaying the GraphCanvas container.
    // For simplicity, I'll render the overlay here in `index.tsx` on top of `GraphCanvas`.

    const [newNodeLabel, setNewNodeLabel] = useState('');
    const [newNodeType, setNewNodeType] = useState<'ENTITY' | 'CASE'>('ENTITY');
    const [newNodeSubtype, setNewNodeSubtype] = useState<'PERSON' | 'ORGANIZATION' | 'UNKNOWN'>('PERSON');

    // Modals
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [selectedLeadForAnalysis, setSelectedLeadForAnalysis] = useState<{ text: string, context?: { topic: string, summary: string } } | null>(null);

    // Dossier Panel Accordion State
    const [dossierSections, setDossierSections] = useState<Record<string, boolean>>({
        reports: false,
        entities: false,
        headlines: false,
        leads: false,
        sources: false
    });
    const toggleDossierSection = (section: string) => {
        setDossierSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Load Data - Migration logic for store initialization
    useEffect(() => {
        // This is only needed for the first time transitioning from localStorage to store
        // but since caseStore.ts already handles persistence, we might not need this anymore
        // if the store is already populated.
    }, []);

    // Active Case Persistence
    const handleCaseChange = (id: string) => {
        setActiveCaseId(id);
    };

    // Compute Dossier Data
    const dossierData = useMemo(() => {
        if (!filterCaseId) return { reports: [], headlines: [], leads: [], sources: [], entities: [] };

        const activeReports = filterCaseId === 'ALL' ? reports : reports.filter(r => r.caseId === filterCaseId);
        const activeHeadlines = filterCaseId === 'ALL' ? headlines : headlines.filter(h => h.caseId === filterCaseId);

        const allLeads = Array.from(new Set(activeReports.flatMap(r => r.leads || [])));

        const sourceMap = new Map<string, Source>();
        activeReports.flatMap(r => r.sources || []).forEach(s => {
            if (!sourceMap.has(s.url)) sourceMap.set(s.url, s);
        });
        const allSources = Array.from(sourceMap.values());

        const entityMap = new Map<string, Entity>();
        activeReports.flatMap(r => r.entities || []).forEach(e => {
            const name = typeof e === 'string' ? e : e.name;
            const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
            const _clean = cleanEntityName(name);
            // We use raw name for map key to match dossier behavior, but cleaned for dedupe?
            if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
                entityMap.set(name, typeof e === 'string' ? { name, type: 'UNKNOWN' } : e);
            }
        });
        const allEntities = Array.from(entityMap.values());

        return {
            reports: activeReports,
            headlines: activeHeadlines,
            leads: allLeads,
            sources: allSources,
            entities: allEntities
        };
    }, [reports, headlines, filterCaseId]);

    const isEmpty = reports.length === 0 && manualNodes.length === 0;
    const pendingClusterCount = useMemo(
        () => detectEntityClusters(dossierData.entities.map(entity => entity.name), aliases).length,
        [dossierData.entities, aliases]
    );

    // Handlers
    const handleNodeClick = (node: GraphNode | null) => {
        if (!node) {
            // Background click
            setShowRightPanel(false);
            setInspectorMode(null);
            return;
        }

        if (node.type === 'CASE' && node.data) {
            handleOpenReportInspector(node.data);
        } else if (node.type === 'ENTITY') {
            handleOpenEntityInspector(node.label);
        }
    };

    const handleCreateManualLink = (source: GraphNode, target: GraphNode) => {
        const newLink: ManualConnection = {
            source: source.id,
            target: target.id,
            timestamp: Date.now()
        };
        const updatedLinks = [...manualLinks, newLink];
        setManualLinks(updatedLinks);
        setLinkSourceNode(null);
        setIsLinkingMode(false);
    };

    const handleCreateNode = () => {
        if (!newNodeLabel.trim()) return;
        const id = `manual-${Date.now()}`;

        let _mockReport: InvestigationReport | undefined = undefined;
        if (newNodeType === 'CASE') {
            _mockReport = {
                id: id,
                caseId: id,
                topic: newNodeLabel.trim(),
                summary: "Manually created report node.",
                dateStr: new Date().toISOString().split('T')[0],
                status: 'COMPLETED',
                entities: [], leads: [], sources: []
            };
        }

        const newNode: ManualNode = {
            id, label: newNodeLabel.trim(), type: newNodeType,
            timestamp: Date.now(), subtype: newNodeType === 'ENTITY' ? newNodeSubtype : 'UNKNOWN'
        };

        const updatedManualNodes = [...manualNodes, newNode];
        setManualNodes(updatedManualNodes);
        setShowAddNodeUI(false);
        setNewNodeLabel('');
    };

    // Inspector Handlers
    const handleOpenHeadlineInspector = (headline: Headline) => {
        setSelectedHeadline(headline);
        setInspectorMode('HEADLINE');
        setShowRightPanel(true);
    };

    const handleOpenEntityInspector = (entityName: string) => {
        setSelectedEntityName(entityName);
        setInspectorMode('ENTITY');
        setShowRightPanel(true);
    };

    const handleOpenReportInspector = (report: InvestigationReport) => {
        setSelectedReport(report);
        setInspectorMode('REPORT');
        setShowRightPanel(true);
    };

    const handleLeadInvestigate = (lead: string) => {
        const activeCase = cases.find(c => c.id === filterCaseId);
        const context = activeCase ? { topic: activeCase.title, summary: activeCase.description || '' } : undefined;
        setSelectedLeadForAnalysis({ text: lead, context });
    };

    // Update Handlers (Persistence)
    const handleEntitySave = async (oldName: string, newName: string) => {
        await renameEntityAcrossReports(oldName, newName);

        // Update Flagged
        if (flaggedNodeIds.has(oldName)) {
            toggleFlag(oldName);
            toggleFlag(newName);
        }

        setSelectedEntityName(newName);
    };

    const handleReportSave = async (report: InvestigationReport, newTitle: string) => {
        if (report.id) {
            await updateReportTitle(report.id, newTitle);
        }
        setSelectedReport({ ...report, topic: newTitle });
    };

    const handleToggleFlag = (name: string) => {
        toggleFlag(name);
    };

    const handleToggleHide = (name: string) => {
        toggleHide(name);
    };

    return (
        <div className="w-full h-screen bg-black relative flex flex-col overflow-hidden">
            <ControlBar
                cases={cases}
                filterCaseId={filterCaseId}
                onCaseChange={handleCaseChange}
                showLeftPanel={showLeftPanel}
                onToggleLeftPanel={() => setShowLeftPanel(!showLeftPanel)}
                showSingletons={showSingletons}
                onToggleSingletons={() => setShowSingletons(!showSingletons)}
                showHiddenNodes={showHiddenNodes}
                onToggleHiddenNodes={() => setShowHiddenNodes(!showHiddenNodes)}
                showFlaggedOnly={showFlaggedOnly}
                onToggleFlaggedOnly={() => setShowFlaggedOnly(!showFlaggedOnly)}
                isLinkingMode={isLinkingMode}
                onToggleLinkingMode={() => setIsLinkingMode(!isLinkingMode)}
                onZoom={(dir) => dir === 'IN' ? graphRef.current?.zoomIn() : graphRef.current?.zoomOut()}
                onShowAddNode={() => setShowAddNodeUI(true)}
                onShowResolution={() => setShowResolutionModal(true)}
                pendingClusterCount={pendingClusterCount}
                isLocked={isLocked}
                onToggleLock={() => setIsLocked(!isLocked)}
            />

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Dossier Panel (Reused) */}
                <DossierPanel
                    isOpen={showLeftPanel}
                    activeCase={cases.find(c => c.id === filterCaseId) || null}
                    reports={dossierData.reports}
                    entities={dossierData.entities}
                    leads={dossierData.leads}
                    sources={dossierData.sources}
                    headlines={dossierData.headlines}
                    openSections={dossierSections}
                    toggleSection={toggleDossierSection}
                    onNavigate={(id) => {
                        // Dossier click handling: Open Inspector if possible
                        const r = reports.find(x => x.id === id);
                        if (r) handleOpenReportInspector(r);
                    }}
                    onEntityClick={(e) => handleOpenEntityInspector(e.name)}
                    onLeadClick={handleLeadInvestigate}
                    onHeadlineClick={handleOpenHeadlineInspector}
                />

                {/* Main Graph Canvas */}
                <div className="flex-1 relative z-0">
                    {isEmpty ? (
                        <div className="absolute inset-0 flex flex-center bg-black/80 flex-col items-center justify-center animate-in fade-in duration-700">
                            <div className="bg-zinc-900/30 p-10 border border-zinc-800/50 flex flex-col items-center max-w-lg text-center backdrop-blur-sm">
                                <Network className="w-20 h-20 text-zinc-800 mb-6 animate-pulse" />
                                <h3 className="text-2xl font-bold text-zinc-500 font-mono mb-3 uppercase tracking-tighter">System Offline</h3>
                                <p className="text-zinc-600 text-sm font-mono mb-10 leading-relaxed uppercase">
                                    Graph engine awaiting connection. No intelligence nodes or link vectors detected in current matrix.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowAddNodeUI(true)}
                                        className="px-6 py-2 border border-zinc-700 text-zinc-400 font-mono text-xs font-bold uppercase hover:bg-zinc-800 hover:text-white transition-all"
                                    >
                                        Add Manual Node
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <GraphCanvas
                            ref={graphRef}
                            reports={reports}
                            manualLinks={manualLinks}
                            manualNodes={manualNodes}
                            cases={cases}
                            aliases={aliases}
                            hiddenNodeIds={hiddenNodeIds}
                            flaggedNodeIds={flaggedNodeIds}
                            filterCaseId={filterCaseId}
                            showSingletons={showSingletons}
                            showHiddenNodes={showHiddenNodes}
                            showFlaggedOnly={showFlaggedOnly}
                            isLinkingMode={isLinkingMode}
                            linkSourceNode={linkSourceNode}
                            isLocked={isLocked}
                            onNodeClick={handleNodeClick}
                            onSetLinkSource={setLinkSourceNode}
                            onCreateManualLink={handleCreateManualLink}
                            onStatsUpdate={() => { }} // Could sync stats state if needed
                        />
                    )}

                    {/* Add Node Overlay */}
                    {showAddNodeUI && (
                        <div className="absolute top-4 right-4 bg-black/90 border border-zinc-700 p-4 shadow-xl z-50 w-64">
                            <h3 className="text-xs font-bold text-white mb-3">ADD MANUAL NODE</h3>
                            <input
                                autoFocus
                                value={newNodeLabel}
                                onChange={e => setNewNodeLabel(e.target.value)}
                                placeholder="Node Label..."
                                className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-2 mb-2"
                            />
                            <div className="flex gap-2 mb-3">
                                <button onClick={() => setNewNodeType('ENTITY')} className={`flex-1 py-1 text-[10px] border ${newNodeType === 'ENTITY' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>ENTITY</button>
                                <button onClick={() => setNewNodeType('CASE')} className={`flex-1 py-1 text-[10px] border ${newNodeType === 'CASE' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-700 text-zinc-500'}`}>REPORT</button>
                            </div>

                            {/* Subtype Selection */}
                            {newNodeType === 'ENTITY' && (
                                <div className="grid grid-cols-3 gap-1 mb-3">
                                    <button onClick={() => setNewNodeSubtype('PERSON')} className={`py-1 text-[9px] border ${newNodeSubtype === 'PERSON' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}>PERSON</button>
                                    <button onClick={() => setNewNodeSubtype('ORGANIZATION')} className={`py-1 text-[9px] border ${newNodeSubtype === 'ORGANIZATION' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}>ORG</button>
                                    <button onClick={() => setNewNodeSubtype('UNKNOWN')} className={`py-1 text-[9px] border ${newNodeSubtype === 'UNKNOWN' ? 'bg-zinc-800 border-zinc-500 text-zinc-400' : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}>UNKNOWN</button>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <button onClick={() => setShowAddNodeUI(false)} className="text-xs text-zinc-500 hover:text-white">Cancel</button>
                                <button onClick={handleCreateNode} className="px-3 py-1 bg-osint-primary text-black text-xs font-bold">ADD</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Inspector */}
                <NodeInspector
                    isOpen={showRightPanel}
                    onClose={() => setShowRightPanel(false)}
                    mode={inspectorMode}
                    selectedEntity={selectedEntityName}
                    selectedHeadline={selectedHeadline}
                    selectedReport={selectedReport}
                    reports={reports}
                    hiddenNodeIds={hiddenNodeIds}
                    flaggedNodeIds={flaggedNodeIds}
                    onEntitySave={handleEntitySave}
                    onReportSave={handleReportSave}
                    onToggleFlag={handleToggleFlag}
                    onToggleHide={handleToggleHide}
                    onInvestigate={handleLeadInvestigate}
                    onOpenReport={onOpenReport}
                />
            </div>

            {/* Modal */}
            {selectedLeadForAnalysis && (
                <TaskSetupModal
                    initialTopic={selectedLeadForAnalysis.text}
                    initialContext={selectedLeadForAnalysis.context}
                    initialScopeId={activeScopeId || undefined}
                    onCancel={() => setSelectedLeadForAnalysis(null)}
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
                        setSelectedLeadForAnalysis(null);
                    }}
                />
            )}
            {showResolutionModal && (
                <EntityResolution
                    allEntities={dossierData.entities?.map(e => e.name) || []}
                    currentAliases={aliases}
                    onSaveAliases={(newAliases) => {
                        void setAliases(newAliases);
                    }}
                    onClose={() => setShowResolutionModal(false)}
                />
            )}
        </div>
    );
};
