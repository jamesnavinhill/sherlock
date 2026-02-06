import React, { useEffect, useMemo, useState } from 'react';
import type { InvestigationReport, InvestigationTask, Entity, Headline, Source, SystemConfig, CaseTemplate } from '../../../types';
import { useCaseStore } from '../../../store/caseStore';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { MatrixLoader } from '../../ui/MatrixLoader';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import { AlertOctagon, Layout } from 'lucide-react';

// Sub-components
import { Toolbar } from './Toolbar';
import { DossierPanel } from './DossierPanel';
import { ReportViewer } from './ReportViewer';
import { InspectorPanel } from './InspectorPanel';

// --- PROPS ---
interface OperationViewProps {
    task: InvestigationTask | null;
    reportOverride?: InvestigationReport | null;
    onBack: () => void;
    onDeepDive: (lead: string, currentReport: InvestigationReport) => void;
    onBatchDeepDive: (leads: string[], currentReport: InvestigationReport) => void;
    navStack: BreadcrumbItem[];
    onNavigate: (id: string) => void;
    onSelectCase?: (caseId: string) => void;
    onStartNewCase: (topic: string, config: SystemConfig) => void;
    onInvestigateHeadline?: (topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => void;
}

export const OperationView: React.FC<OperationViewProps> = ({
    task, reportOverride = null, onBack, onDeepDive, onBatchDeepDive, navStack, onNavigate, onSelectCase, onStartNewCase, onInvestigateHeadline
}) => {
    // Panel visibility
    const [leftPanelOpen, setLeftPanelOpen] = useState(window.innerWidth > 1024);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

    // Responsive logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) {
                setLeftPanelOpen(false);
            } else {
                setLeftPanelOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Accordion State for Case Dossier
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        caseInfo: false,
        reports: false,
        entities: false,
        leads: false,
        sources: false,
        headlines: false // Default closed
    });

    const toggleDossierSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Selection State for Inspector
    const [inspectorMode, setInspectorMode] = useState<'ENTITY' | 'HEADLINE' | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);

    // Pre-Investigation Modal State
    const [leadToAnalyze, setLeadToAnalyze] = useState<{ text: string, context?: { topic: string, summary: string } } | null>(null);
    const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const {
        cases: allCases,
        archives,
        addTemplate,
        activeCaseId: selectedCaseId,
        setActiveCaseId
    } = useCaseStore();

    const report = task?.report ?? reportOverride;
    const status = task?.status ?? null;
    const effectiveCaseId = selectedCaseId ?? report?.caseId ?? null;

    const activeCase = useMemo(() =>
        allCases.find(c => c.id === effectiveCaseId) || null
        , [allCases, effectiveCaseId]);

    const allCaseReports = useMemo(() =>
        archives.filter(r => r.caseId === effectiveCaseId)
        , [archives, effectiveCaseId]);

    const headlines = useMemo(() => {
        if (!effectiveCaseId) return [];
        return useCaseStore.getState().headlines.filter(h => h.caseId === effectiveCaseId);
    }, [effectiveCaseId]);

    // Removed redundant effects, case switching now handled by store action in Toolbar/index
    // No-op for now to keep structure clean during migration
    useEffect(() => {
        if (selectedCaseId && selectedCaseId !== 'ALL' && !activeCase) {
            // Re-sync if necessary
        }
    }, [selectedCaseId, activeCase]);

    // Handle case selection from dropdown
    const handleCaseSelect = (caseId: string) => {
        setActiveCaseId(caseId);

        if (caseId !== 'ALL' && caseId !== '') {
            const caseReports = archives.filter(r => r.caseId === caseId);
            if (caseReports.length > 0) {
                const rootReport = caseReports.find(r => !r.parentTopic) || caseReports[0];
                if (onSelectCase) {
                    onSelectCase(rootReport.id);
                } else {
                    onNavigate(rootReport.id);
                }
            }
        }
    };

    const handleSaveTemplate = () => {
        if (!report) return;
        setShowSaveTemplateModal(true);
        setTemplateName(`${activeCase?.title.replace('Operation: ', '') || 'Investigation'}: ${report.topic}`);
    };

    const executeSaveTemplate = () => {
        if (!report || !templateName.trim()) return;

        const newTemplate: CaseTemplate = {
            id: `tpl-${Date.now()}`,
            name: templateName.trim(),
            topic: report.topic,
            config: report.config || {},
            createdAt: Date.now()
        };

        addTemplate(newTemplate);
        setShowSaveTemplateModal(false);
        // Maybe add a toast here if available via store
        useCaseStore.getState().addToast("Template saved successfully", "SUCCESS");
    };

    // --- Case-wide Data Aggregation ---
    const casePanelData = useMemo(() => {
        if (!activeCase || allCaseReports.length === 0) {
            return {
                caseInfo: activeCase,
                reports: [],
                entities: [],
                leads: [],
                sources: []
            };
        }

        const entityMap = new Map<string, Entity>();
        allCaseReports.flatMap(r => r.entities || []).forEach(e => {
            const name = typeof e === 'string' ? e : e.name;
            const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
            if (!entityMap.has(name) || (entityMap.get(name)?.type === 'UNKNOWN' && type !== 'UNKNOWN')) {
                entityMap.set(name, typeof e === 'string' ? { name, type: 'UNKNOWN' } : e);
            }
        });
        const allEntities = Array.from(entityMap.values());
        const allLeads = Array.from(new Set(allCaseReports.flatMap(r => r.leads || [])));
        const sourceMap = new Map<string, Source>();
        allCaseReports.flatMap(r => r.sources || []).forEach(s => {
            if (!sourceMap.has(s.url)) {
                sourceMap.set(s.url, s);
            }
        });
        const allSources = Array.from(sourceMap.values());

        return {
            caseInfo: activeCase,
            reports: allCaseReports,
            entities: allEntities,
            leads: allLeads,
            sources: allSources
        };
    }, [activeCase, allCaseReports]);

    const handleEntityClick = (entity: Entity) => {
        setSelectedEntity(entity);
        setInspectorMode('ENTITY');
        setRightPanelOpen(true);
        // Mobile: Close left panel if open to show content/inspector
        if (window.innerWidth <= 1024) {
            setLeftPanelOpen(false);
        }
    };

    const handleHeadlineClick = (headline: Headline) => {
        setSelectedHeadline(headline);
        setInspectorMode('HEADLINE');
        setRightPanelOpen(true);
        // Mobile: Close left panel if open
        if (window.innerWidth <= 1024) {
            setLeftPanelOpen(false);
        }
    };

    const handleLeadClick = (lead: string) => {
        setLeadToAnalyze({
            text: lead,
            context: activeCase ? {
                topic: activeCase.title,
                summary: activeCase.description || `Investigating lead within ${activeCase.title}`
            } : undefined
        });
    };

    const handleHeadlineInvestigate = () => {
        if (!selectedHeadline || !onInvestigateHeadline) return;

        onInvestigateHeadline(
            selectedHeadline.content,
            activeCase ? { topic: activeCase.title, summary: activeCase.description || '' } : undefined
        );
        setRightPanelOpen(false);
    };

    const handleTitleSave = (newTitle: string) => {
        if (!report) return;
        const updated = archives.map(r => r.id === report.id ? { ...r, topic: newTitle } : r);
        useCaseStore.getState().setArchives(updated);
        // Trigger reload by navigating to same report
        if (report.id) onNavigate(report.id);
    };

    const handleEntityNameSave = (newName: string) => {
        if (!selectedEntity) return;
        const oldName = selectedEntity.name;

        // Update entities in all archived reports
        const updated = archives.map(r => ({
            ...r,
            entities: (r.entities || []).map(e => {
                const name = typeof e === 'string' ? e : e.name;
                if (name === oldName) {
                    return typeof e === 'string' ? newName : { ...e, name: newName };
                }
                return e;
            })
        }));
        useCaseStore.getState().setArchives(updated);

        // Update flagged nodes if entity was flagged
        if (useCaseStore.getState().flaggedNodeIds.includes(oldName)) {
            useCaseStore.getState().toggleFlag(oldName);
            useCaseStore.getState().toggleFlag(newName);
        }

        // Update selected entity state
        setSelectedEntity({ ...selectedEntity, name: newName });
    };

    const handleFlagEntity = (entityName: string) => {
        useCaseStore.getState().toggleFlag(entityName);
    };

    const handleInvestigateEntity = (entityName: string) => {
        setRightPanelOpen(false);
        handleLeadClick(entityName);
    };

    // --- RENDER LOADING/ERROR STATES ---
    if (task && (status === 'RUNNING' || status === 'QUEUED')) {
        const statusText = task.parentContext ? `SUB-NETWORK: "${task.topic}"` : `TARGET: "${task.topic}"`;
        return <MatrixLoader statusText={statusText} />;
    }

    if (task && status === 'FAILED') {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-screen">
                <AlertOctagon className="w-16 h-16 text-osint-danger mb-4" />
                <h2 className="text-xl text-white font-bold mb-2">OPERATION FAILED</h2>
                <p className="text-zinc-500 font-mono mb-6">{task.error || "Signal interrupted during data acquisition."}</p>
                <button onClick={onBack} className="mt-4 text-white border border-white hover:bg-white hover:text-black px-4 py-2 font-mono uppercase transition-colors">Return to Base</button>
            </div>
        );
    }

    const showPlaceholder = !report || (selectedCaseId === 'ALL' && status !== 'RUNNING');

    return (
        <div className="w-full h-screen bg-black relative flex flex-col overflow-hidden">
            <BackgroundMatrixRain />

            {/* Pre-Investigation Modal */}
            {leadToAnalyze && report && (
                <TaskSetupModal
                    initialTopic={leadToAnalyze.text}
                    initialContext={leadToAnalyze.context}
                    onCancel={() => setLeadToAnalyze(null)}
                    onStart={(topic, _config) => {
                        onDeepDive(topic, report);
                        setLeadToAnalyze(null);
                    }}
                />
            )}

            {/* Start New Case Modal */}
            {isNewCaseModalOpen && (
                <TaskSetupModal
                    initialTopic=""
                    onCancel={() => setIsNewCaseModalOpen(false)}
                    onStart={(topic, configOverride) => {
                        onStartNewCase(topic, configOverride);
                        setIsNewCaseModalOpen(false);
                    }}
                />
            )}

            {/* Toolbar */}
            <Toolbar
                activeCase={activeCase}
                allCases={allCases}
                selectedCaseId={selectedCaseId}
                report={report}
                allCaseReports={allCaseReports}
                leftPanelOpen={leftPanelOpen}
                onToggleLeftPanel={() => {
                    setLeftPanelOpen(!leftPanelOpen);
                    if (window.innerWidth <= 1024) setRightPanelOpen(false);
                }}
                onSelectCase={handleCaseSelect}
                onStartNewCase={() => setIsNewCaseModalOpen(true)}
                onSaveTemplate={handleSaveTemplate}
            />

            {/* Save Template Modal */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-osint-primary"></div>
                        <div className="p-6">
                            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-widest mb-4 flex items-center">
                                <Layout className="w-4 h-4 mr-2 text-osint-primary" />
                                Save as Protocol Template
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-zinc-500 font-mono uppercase">Protocol Name</label>
                                    <input
                                        type="text"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="e.g., Financial Audit Protocol"
                                        className="w-full bg-black border border-zinc-800 p-3 text-xs font-mono text-white focus:border-osint-primary outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div className="p-3 bg-zinc-800/50 border border-zinc-800">
                                    <div className="text-[9px] text-zinc-500 font-mono uppercase mb-1">Investigation Target</div>
                                    <div className="text-xs text-zinc-300 font-mono truncate">&quot;{report?.topic}&quot;</div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowSaveTemplateModal(false)}
                                        className="flex-1 py-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors uppercase border border-zinc-800 hover:border-zinc-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={executeSaveTemplate}
                                        className="flex-1 py-2 text-xs font-mono bg-osint-primary text-black font-bold hover:bg-white transition-all uppercase"
                                    >
                                        Save Protocol
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Backdrop for Panels */}
            {(leftPanelOpen || rightPanelOpen) && (
                <div
                    className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
                    onClick={() => {
                        setLeftPanelOpen(false);
                        setRightPanelOpen(false);
                    }}
                />
            )}

            {/* 3-PANEL LAYOUT */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left Panel: Dossier */}
                <DossierPanel
                    isOpen={leftPanelOpen}
                    activeCase={activeCase}
                    reports={casePanelData.reports}
                    entities={casePanelData.entities}
                    leads={casePanelData.leads}
                    sources={casePanelData.sources}
                    headlines={headlines}
                    openSections={openSections}
                    toggleSection={toggleDossierSection}
                    onNavigate={onNavigate}
                    onEntityClick={handleEntityClick}
                    onLeadClick={handleLeadClick}
                    onHeadlineClick={handleHeadlineClick}
                    activeReportId={report?.id}
                />

                {/* Center: Report Viewer */}
                <ReportViewer
                    report={report}
                    navStack={navStack}
                    onNavigate={onNavigate}
                    showPlaceholder={showPlaceholder}
                    onStartNewCase={() => setIsNewCaseModalOpen(true)}
                    onTitleSave={handleTitleSave}
                onDeepDive={(lead) => {
                    if (report) {
                        onDeepDive(lead, report);
                    }
                }}
                onBatchDeepDive={(leads) => {
                    if (report) {
                        onBatchDeepDive(leads, report);
                    }
                }}
                    onEntityClick={handleEntityClick}
                />

                {/* Right Panel: Inspector */}
                <InspectorPanel
                    isOpen={rightPanelOpen}
                    onClose={() => setRightPanelOpen(false)}
                    mode={inspectorMode}
                    entity={selectedEntity}
                    headline={selectedHeadline}
                    reports={allCaseReports}
                    onEntitySave={handleEntityNameSave}
                    onFlagEntity={handleFlagEntity}
                    onInvestigateEntity={handleInvestigateEntity}
                    onInvestigateHeadline={handleHeadlineInvestigate}
                    onNavigate={onNavigate}
                />
            </div>
        </div>
    );
};
