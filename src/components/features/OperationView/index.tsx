import React, { useState, useEffect, useMemo } from 'react';
import { InvestigationReport, InvestigationTask, Case, Entity, Headline, Source, SystemConfig } from '../../../types';
import { BackgroundMatrixRain } from '../../ui/BackgroundMatrixRain';
import { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { MatrixLoader } from '../../ui/MatrixLoader';
import { TaskSetupModal } from '../../ui/TaskSetupModal';
import { AlertOctagon } from 'lucide-react';

// Sub-components
import { Toolbar } from './Toolbar';
import { DossierPanel } from './DossierPanel';
import { ReportViewer } from './ReportViewer';
import { InspectorPanel } from './InspectorPanel';

// --- PROPS ---
interface OperationViewProps {
    task: InvestigationTask | null;
    onBack: () => void;
    onDeepDive: (lead: string, currentReport: InvestigationReport) => void;
    onJumpToParent: (parentTopic: string) => void;
    onBatchDeepDive: (leads: string[], currentReport: InvestigationReport) => void;
    navStack: BreadcrumbItem[];
    onNavigate: (id: string) => void;
    onSelectCase?: (caseId: string) => void;
    onStartNewCase: (topic: string, config: any) => void;
    onInvestigateHeadline?: (topic: string, context?: { topic: string, summary: string }, configOverride?: Partial<SystemConfig>) => void;
}

export const OperationView: React.FC<OperationViewProps> = ({
    task, onBack, onDeepDive, onJumpToParent, onBatchDeepDive, navStack, onNavigate, onSelectCase, onStartNewCase, onInvestigateHeadline
}) => {
    // Panel visibility
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

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

    // Case, Reports & Headlines
    const [activeCase, setActiveCase] = useState<Case | null>(null);
    const [allCaseReports, setAllCaseReports] = useState<InvestigationReport[]>([]);
    const [headlines, setHeadlines] = useState<Headline[]>([]);
    const [saved, setSaved] = useState(false);

    // All available cases for selector
    const [allCases, setAllCases] = useState<Case[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');

    // Pre-Investigation Modal State
    const [leadToAnalyze, setLeadToAnalyze] = useState<{ text: string, context?: { topic: string, summary: string } } | null>(null);
    const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

    const report = task?.report ?? null;
    const status = task?.status ?? null;

    // Load all available cases on mount and sync active case
    useEffect(() => {
        const casesStr = localStorage.getItem('sherlock_cases');
        if (casesStr) {
            const parsedCases = JSON.parse(casesStr);
            setAllCases(parsedCases);

            // Initial sync if no report loaded
            if (!report?.caseId) {
                const storedId = localStorage.getItem('sherlock_active_case_id');
                if (storedId && parsedCases.some((c: any) => c.id === storedId)) {
                    setSelectedCaseId(storedId);
                    const c = parsedCases.find((c: any) => c.id === storedId);
                    if (c) setActiveCase(c);

                    // Load reports for dossier
                    const archivesStr = localStorage.getItem('sherlock_archives');
                    if (archivesStr) {
                        const archives = JSON.parse(archivesStr);
                        setAllCaseReports(archives.filter((r: any) => r.caseId === storedId));
                    }
                }
            }
        }
    }, [report?.caseId]);

    // Sync selectedCaseId with task's report caseId
    useEffect(() => {
        // Check for external updates or mismatches
        const storedId = localStorage.getItem('sherlock_active_case_id') || 'ALL';

        // If we are currently running a task, we ignore external selection context until it's done
        if (status === 'RUNNING' || status === 'QUEUED') return;

        // If the stored case differs from the current active case ID state
        if (storedId !== selectedCaseId) {
            handleCaseSelect(storedId);
        } else if (report?.caseId && report.caseId !== storedId && storedId !== 'ALL') {
            // If we have a report loaded but the stored ID specifically points to another case, switch
            handleCaseSelect(storedId);
        }
    }, [report?.caseId, status, selectedCaseId]);

    // Handle case selection from dropdown
    const handleCaseSelect = (caseId: string) => {
        setSelectedCaseId(caseId);

        if (caseId === 'ALL') {
            localStorage.removeItem('sherlock_active_case_id');
            setActiveCase(null);
            setAllCaseReports([]);
            return;
        }

        localStorage.setItem('sherlock_active_case_id', caseId);

        // Try to find the case object to set active immediately for UI responsiveness
        const casesStr = localStorage.getItem('sherlock_cases');
        if (casesStr) {
            const cases: Case[] = JSON.parse(casesStr);
            const foundCase = cases.find(c => c.id === caseId);
            if (foundCase) setActiveCase(foundCase);
        }

        const archivesStr = localStorage.getItem('sherlock_archives');
        if (archivesStr) {
            const archives: InvestigationReport[] = JSON.parse(archivesStr);
            const caseReports = archives.filter(r => r.caseId === caseId);
            setAllCaseReports(caseReports); // Update local list immediately

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

    useEffect(() => {
        if (status === 'COMPLETED' && report) {
            loadCaseData(report);
        }
    }, [status, report]);

    const loadCaseData = (rpt: InvestigationReport) => {
        try {
            const casesStr = localStorage.getItem('sherlock_cases');
            const headlinesStr = localStorage.getItem('sherlock_headlines');
            const archivesStr = localStorage.getItem('sherlock_archives');

            if (casesStr && rpt.caseId) {
                const cases: Case[] = JSON.parse(casesStr);
                const foundCase = cases.find(c => c.id === rpt.caseId);
                if (foundCase) setActiveCase(foundCase);
            }

            if (archivesStr && rpt.caseId) {
                const archives: InvestigationReport[] = JSON.parse(archivesStr);
                const caseReports = archives.filter(r => r.caseId === rpt.caseId);
                setAllCaseReports(caseReports);

                const savedVersion = archives.find(r => r.id === rpt.id || (r.topic === rpt.topic && r.dateStr === rpt.dateStr));
                setSaved(!!savedVersion);
            }

            if (headlinesStr && rpt.caseId) {
                const allHeadlines: Headline[] = JSON.parse(headlinesStr);
                setHeadlines(allHeadlines.filter(h => h.caseId === rpt.caseId));
            }
        } catch (e) {
            console.error("Failed to load case data", e);
        }
    };

    // --- Case-wide Data Aggregation ---
    const casePanelData = useMemo(() => {
        if (!activeCase || allCaseReports.length === 0) return {
            caseInfo: activeCase,
            reports: [],
            entities: [],
            leads: [],
            sources: []
        };

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
    };

    const handleHeadlineClick = (headline: Headline) => {
        setSelectedHeadline(headline);
        setInspectorMode('HEADLINE');
        setRightPanelOpen(true);
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
        // Update report topic in archives
        const archivesStr = localStorage.getItem('sherlock_archives');
        if (archivesStr) {
            const archives: InvestigationReport[] = JSON.parse(archivesStr);
            const updated = archives.map(r => r.id === report!.id ? { ...r, topic: newTitle } : r);
            localStorage.setItem('sherlock_archives', JSON.stringify(updated));
            // Trigger reload by navigating to same report
            if (onNavigate) onNavigate(report!.id!);
        }
    };

    const handleEntityNameSave = (newName: string) => {
        if (!selectedEntity) return;
        const oldName = selectedEntity.name;

        // Update entities in all archived reports
        const archivesStr = localStorage.getItem('sherlock_archives');
        if (archivesStr) {
            const archives: InvestigationReport[] = JSON.parse(archivesStr);
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
            localStorage.setItem('sherlock_archives', JSON.stringify(updated));
        }

        // Update flagged nodes if entity was flagged
        const flaggedStr = localStorage.getItem('sherlock_flagged_nodes');
        if (flaggedStr) {
            const flagged: string[] = JSON.parse(flaggedStr);
            const updatedFlagged = flagged.map(f => f === oldName ? newName : f);
            localStorage.setItem('sherlock_flagged_nodes', JSON.stringify(updatedFlagged));
        }

        // Update selected entity state
        setSelectedEntity({ ...selectedEntity, name: newName });
    };

    const handleFlagEntity = (entityName: string) => {
        const flagged = JSON.parse(localStorage.getItem('sherlock_flagged_nodes') || '[]');
        const set = new Set(flagged);
        if (set.has(entityName)) set.delete(entityName);
        else set.add(entityName);
        localStorage.setItem('sherlock_flagged_nodes', JSON.stringify(Array.from(set)));
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
                    onStart={(topic, config) => {
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
                    onStart={(topic, config) => {
                        onStartNewCase(topic, config);
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
                onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
                onCaseSelect={handleCaseSelect}
                onStartNewCase={() => setIsNewCaseModalOpen(true)}
            />

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
                    onDeepDive={(lead) => onDeepDive(lead, report!)}
                    onBatchDeepDive={(leads) => onBatchDeepDive(leads, report!)}
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
