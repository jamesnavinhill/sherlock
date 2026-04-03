import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    FileText, Lightbulb, Microscope, Layers, AlertTriangle, Users,
    Globe, Target, Volume2, Loader2, StopCircle, Link2
} from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import type { InvestigationReport, Entity } from '../../../types';
import {
    getArtifactSectionTitle,
    getLabelProfileById,
    getPurposeProfileById,
    getSectionByKinds,
    getSectionItemsByKinds,
    orderArtifactSections,
} from '../../../domain';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EditableTitle } from '../../ui/EditableTitle';
import { EmptyState } from '../../ui/EmptyState';
import { generateAudioBriefing } from '../../../services/gemini';
import { decodeBase64, decodeAudioData } from '../../../utils/audio';
import { Accordion } from '../../ui/Accordion';
import { getEntityToneClass } from '../../../utils/entityPalette';

interface ReportViewerProps {
    report: InvestigationReport | null;
    navStack: BreadcrumbItem[];
    onNavigate: (id: string) => void;
    showPlaceholder: boolean;
    onStartNewCase: () => void;
    onTitleSave: (newTitle: string) => void;
    onDeepDive: (lead: string) => void;
    onBatchDeepDive: (leads: string[]) => void;
    onEntityClick: (entity: Entity) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
    report,
    navStack,
    onNavigate,
    showPlaceholder,
    onStartNewCase,
    onTitleSave,
    onDeepDive,
    onBatchDeepDive,
    onEntityClick
}) => {
    // --- Right Column Accordions State ---
    const [sidebarAccordions, setSidebarAccordions] = useState({
        anomalies: true,
        entities: true,
        resources: true
    });

    const toggleSidebarAccordion = (section: keyof typeof sidebarAccordions) => {
        setSidebarAccordions(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Audio State ---
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    // Cleanup audio on unmount or report change
    useEffect(() => {
        return () => stopAudio();
    }, [report?.id]);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch { /* audio already stopped */ }
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsPlaying(false);
    };

    const handlePlayBriefing = async () => {
        if (isPlaying) { stopAudio(); return; }
        if (!report?.summary) return;

        setIsAudioLoading(true);
        try {
            const base64Audio = await generateAudioBriefing(report.summary);
            const WebkitAudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!WebkitAudioContext) {
                alert('Audio playback is not supported in this browser.');
                return;
            }
            const ctx = new WebkitAudioContext({ sampleRate: 24000 });
            audioContextRef.current = ctx;
            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.onended = () => setIsPlaying(false);
            source.start();
            sourceNodeRef.current = source;
            setIsPlaying(true);
        } catch (e) {
            console.error("Audio playback failed", e);
            alert("Failed to generate audio briefing.");
        } finally {
            setIsAudioLoading(false);
        }
    };

    // --- Markdown Configuration ---
    const markdownComponents: {
        a: (props: ComponentProps<'a'>) => ReactElement;
        p: (props: ComponentProps<'p'>) => ReactElement;
    } = {
        a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-osint-primary bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded hover:bg-osint-primary/10 hover:text-osint-ink hover:border-osint-primary/40 transition-all duration-200 font-medium no-underline inline-flex items-center gap-1 mx-0.5 text-[0.95em]">
                {children}<Link2 className="w-3 h-3 opacity-70" />
            </a>
        ),
        p: (props) => <p className="mb-4 last:mb-0" {...props} />
    };

    const renderSectionBody = (section: NonNullable<InvestigationReport['sections']>[number]) => {
        if (section.kind === 'TIMELINE' && section.items && section.items.length > 0) {
            const items = section.items;
            return (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={`${section.id}-${index}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-osint-primary mt-2" />
                                {index < items.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-2" />}
                            </div>
                            <div className="flex-1 pb-3">
                                <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">{`Step ${index + 1}`}</div>
                                <div className="text-sm text-zinc-300">
                                    <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (section.items && section.items.length > 0) {
            const gridKinds = new Set(['KEY_FINDINGS', 'ANOMALIES', 'IMPLICATIONS', 'LEADS', 'NEXT_STEPS']);
            const itemClass = gridKinds.has(section.kind)
                ? 'bg-zinc-900/70 border border-zinc-800 p-4'
                : 'border-l-2 border-osint-primary/40 pl-3 text-sm text-zinc-300';

            return (
                <div className={gridKinds.has(section.kind) ? 'grid md:grid-cols-2 gap-3' : 'space-y-2'}>
                    {section.items.map((item, index) => (
                        <div key={`${section.id}-${index}`} className={itemClass}>
                            <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
                        </div>
                    ))}
                </div>
            );
        }

        if (section.content) {
            return (
                <div className="text-zinc-300 prose prose-invert max-w-none text-sm">
                    <ReactMarkdown components={markdownComponents}>{section.content}</ReactMarkdown>
                </div>
            );
        }

        return null;
    };

    // --- RENDER ---
    if (showPlaceholder || !report) {
        return (
            <div className="flex-1 flex items-center justify-center bg-black relative">
                <EmptyState
                    icon={FileText}
                    title="No Workspace Selected"
                    description="Select a saved workspace from the toolbar above or start a new run to begin."
                    action={{
                        label: "Start New Run",
                        onClick: onStartNewCase
                    }}
                />
            </div>
        );
    }

    const reportSources = report.sources || [];
    const labelProfile = getLabelProfileById(report.labelProfileId || report.config?.labelProfileId);
    const purposeProfile = getPurposeProfileById(report.purposeId || report.config?.purposeId);
    const orderedSections = orderArtifactSections(report.sections, purposeProfile);
    const primarySummarySection = getSectionByKinds(orderedSections, ['EXECUTIVE_SUMMARY', 'KEY_FINDINGS']);
    const visibleSummary = primarySummarySection?.content || report.summary;
    const visibleLeads = report.leads.length > 0
        ? report.leads
        : getSectionItemsByKinds(orderedSections, ['LEADS', 'NEXT_STEPS']);
    const visibleAnomalies = report.agendas.length > 0
        ? report.agendas
        : getSectionItemsByKinds(orderedSections, ['ANOMALIES', 'KEY_FINDINGS']);
    const hiddenSectionKinds = new Set([
        primarySummarySection?.kind,
        'ANOMALIES',
        'LEADS',
    ].filter(Boolean));
    const supplementalSections = orderedSections.filter(section =>
        !hiddenSectionKinds.has(section.kind)
        && ((section.content && section.content.trim().length > 0) || (section.items && section.items.length > 0))
    );

    return (
        <div className="flex-1 flex overflow-hidden bg-black relative animate-in fade-in duration-500">
            {/* MAIN COLUMN (Title, Exec Summary, Leads) - 3/4 Width */}
            <div className="w-3/4 h-full overflow-y-auto custom-scrollbar border-r border-zinc-800">

                {/* Sticky Header */}
                <div className="sticky top-0 z-20 px-6 py-4 bg-black/90 backdrop-blur-md border-b border-zinc-800 osint-header-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                        <Breadcrumbs items={navStack} onNavigate={onNavigate} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <EditableTitle
                                value={report.topic}
                                onSave={onTitleSave}
                                className="text-2xl font-bold text-white uppercase tracking-tight font-mono truncate"
                                inputClassName="text-2xl font-bold uppercase tracking-tight"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-white">
                                    {labelProfile.artifactLabel}
                                </span>
                                <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
                                    {purposeProfile.name}
                                </span>
                                {report.artifactType && (
                                    <span className="px-2 py-1 border border-zinc-700 text-[10px] font-mono uppercase text-zinc-300">
                                        {report.artifactType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 flex-shrink-0">
                            {report.dateStr && <p className="text-zinc-500 text-[10px] font-mono whitespace-nowrap uppercase">LOG DATE: {report.dateStr}</p>}
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Executive Summary */}
                    <div className="bg-osint-panel/90 backdrop-blur-md p-8 border border-zinc-700 osint-section-shadow relative overflow-hidden group mb-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-white/10"></div>
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2 relative z-10">
                            <h2 className="text-xl font-bold text-white flex items-center font-mono tracking-wide">
                                <FileText className="w-5 h-5 mr-3 text-osint-primary" /> {getArtifactSectionTitle(primarySummarySection?.kind || 'EXECUTIVE_SUMMARY', labelProfile, primarySummarySection?.title).toUpperCase()}
                            </h2>
                            <button
                                onClick={handlePlayBriefing}
                                disabled={isAudioLoading}
                                className={`flex items-center px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all border ${isPlaying ? 'bg-red-900/20 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-white'}`}
                                aria-label={isPlaying ? "Stop audio briefing" : "Play audio briefing"}
                            >
                                {isAudioLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isPlaying ? <StopCircle className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                                {isAudioLoading ? 'Synth...' : isPlaying ? 'Stop' : 'Voice'}
                            </button>
                        </div>
                        <div className="text-zinc-300 leading-relaxed font-sans text-base relative z-10 prose prose-invert max-w-none">
                            <ReactMarkdown components={markdownComponents}>{visibleSummary}</ReactMarkdown>
                        </div>
                    </div>

                    {supplementalSections.length > 0 && (
                        <div className="space-y-4 mb-8">
                            {supplementalSections.map((section) => (
                                <div key={section.id} className="bg-zinc-950/60 border border-zinc-800 p-5">
                                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-white mb-3">
                                        {getArtifactSectionTitle(section.kind, labelProfile, section.title)}
                                    </h3>
                                    {renderSectionBody(section)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Leads */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-4 bg-black/30 p-2">
                            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center">
                                <Target className="w-4 h-4 mr-2 text-osint-primary" /> {labelProfile.followUpLabel}
                            </h2>
                            {visibleLeads.length > 0 && (
                                <button
                                    onClick={() => onBatchDeepDive(visibleLeads)}
                                    className="osint-button-primary flex items-center text-xs font-mono font-bold px-3 py-1.5 uppercase"
                                    aria-label={`Investigate all ${labelProfile.followUpLabel.toLowerCase()}`}
                                >
                                    <Layers className="w-4 h-4 mr-2" /> Full Spectrum
                                </button>
                            )}
                        </div>
                        {visibleLeads.length === 0 ? (
                            <div className="p-4 border border-zinc-800 bg-zinc-900/30 text-[11px] font-mono text-zinc-500 italic">
                                {`No ${labelProfile.followUpLabel.toLowerCase()} were extracted for this artifact.`}
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {visibleLeads.map((lead, idx) => (
                                    <div key={idx} className="bg-osint-surface/80 backdrop-blur-sm border border-zinc-700/60 p-5 hover:border-osint-primary/50 transition-colors relative group flex flex-col justify-between">
                                        <div>
                                            <div className="absolute top-4 right-4 text-zinc-800 font-mono text-4xl font-bold opacity-50 group-hover:text-zinc-700">{String(idx + 1).padStart(2, '0')}</div>
                                            <Lightbulb className="w-6 h-6 text-osint-primary mb-3 opacity-80" />
                                            <div className="text-zinc-300 font-medium text-sm leading-relaxed pr-6 prose prose-invert max-w-none prose-p:my-0 mb-4">
                                                <ReactMarkdown components={markdownComponents}>{lead}</ReactMarkdown>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeepDive(lead)}
                                            className="osint-button-primary mt-2 w-full flex items-center justify-center py-3 text-xs font-mono font-bold uppercase tracking-wider"
                                            aria-label={`Deep dive into lead ${idx + 1}`}
                                        >
                                            <Microscope className="w-3 h-3 mr-2" /> DEEP DIVE
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE COLUMN (Anomalies, Entities, Resources) - 1/4 Width */}
            <div className="w-1/4 h-full overflow-y-auto p-2 bg-zinc-900/10 custom-scrollbar">

                {/* Anomalies */}
                <Accordion
                    title={`${labelProfile.anomalyLabel} (${visibleAnomalies.length})`}
                    icon={AlertTriangle}
                    isOpen={sidebarAccordions.anomalies}
                    onToggle={() => toggleSidebarAccordion('anomalies')}
                    className="mb-2"
                    headerClassName="text-osint-danger"
                >
                    <div className="space-y-2">
                        {visibleAnomalies.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">{`No ${labelProfile.anomalyLabel.toLowerCase()} extracted for this artifact.`}</p>
                        ) : (
                            visibleAnomalies.map((agenda, idx) => (
                                <div key={idx} className="bg-zinc-900/80 p-3 border-l-2 border-osint-danger text-xs text-zinc-300">
                                    <ReactMarkdown components={markdownComponents}>{agenda}</ReactMarkdown>
                                </div>
                            ))
                        )}
                    </div>
                </Accordion>

                {/* Entities List */}
                <Accordion
                    title={`Entities (${(report.entities || []).length})`}
                    icon={Users}
                    isOpen={sidebarAccordions.entities}
                    onToggle={() => toggleSidebarAccordion('entities')}
                    className="mb-2"
                >
                    <div className="space-y-1">
                        {(report.entities || []).length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">No entities detected.</p>
                        ) : (
                            (report.entities || []).map((e, idx) => {
                                const name = typeof e === 'string' ? e : e.name;
                                const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
                                return (
                                    <button key={idx} onClick={() => onEntityClick(typeof e === 'string' ? { name, type: 'UNKNOWN' } : e)} className="w-full text-left p-2 bg-zinc-900/50 hover:bg-zinc-800 border border-transparent hover:border-osint-primary transition-all rounded flex items-center group">
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${getEntityToneClass(type)} entity-tone-dot`}></div>
                                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white truncate">{name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Accordion>

                {/* Resources */}
                <Accordion
                    title={`${labelProfile.signalLabel} (${reportSources.length})`}
                    icon={Globe}
                    isOpen={sidebarAccordions.resources}
                    onToggle={() => toggleSidebarAccordion('resources')}
                    className="mb-2"
                >
                    <div className="space-y-1">
                        {reportSources.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">No sources captured for this report.</p>
                        ) : (
                            reportSources.map((source, idx) => (
                                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="osint-link-list-item block p-2 text-[10px] font-mono truncate border-b border-zinc-900 last:border-0">
                                    <Link2 className="w-3 h-3 inline mr-1" />
                                    {source.title}
                                </a>
                            ))
                        )}
                    </div>
                </Accordion>
            </div>
        </div>
    );
};
