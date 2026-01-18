import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    FileText, Lightbulb, Microscope, Layers, AlertTriangle, Users,
    Globe, ChevronDown, ChevronRight, Target, Volume2, Loader2, StopCircle, Link2
} from 'lucide-react';
import { InvestigationReport, BreadcrumbItem, Entity } from '../../../types';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import { EditableTitle } from '../../ui/EditableTitle';
import { EmptyState } from '../../ui/EmptyState';
import { generateAudioBriefing } from '../../../services/gemini';
import { decodeBase64, decodeAudioData } from '../../../utils/audio';
import { Accordion } from '../../ui/Accordion';

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
            try { sourceNodeRef.current.stop(); } catch (e) { }
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
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
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
    const markdownComponents = {
        a: ({ node, ...props }: any) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-osint-primary bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded hover:bg-osint-primary hover:text-black transition-all duration-200 font-medium no-underline inline-flex items-center gap-1 mx-0.5 text-[0.95em]">
                {props.children}<Link2 className="w-3 h-3 opacity-70" />
            </a>
        ),
        p: ({ node, ...props }: any) => <p className="mb-4 last:mb-0" {...props} />
    };

    // --- RENDER ---
    if (showPlaceholder || !report) {
        return (
            <div className="flex-1 flex items-center justify-center bg-black relative">
                <EmptyState
                    icon={FileText}
                    title="No Case Selected"
                    description="Select a case from the toolbar above or start a new investigation to begin."
                    action={{
                        label: "Start New Case",
                        onClick: onStartNewCase
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex-1 flex overflow-hidden bg-black relative">
            {/* MAIN COLUMN (Title, Exec Summary, Leads) - 3/4 Width */}
            <div className="w-3/4 h-full overflow-y-auto p-6 custom-scrollbar border-r border-zinc-800">

                {/* Report Header */}
                <div className="border-b border-zinc-800 pb-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <Breadcrumbs items={navStack} onNavigate={onNavigate} />
                    </div>
                    <EditableTitle
                        value={report.topic}
                        onSave={onTitleSave}
                        className="text-2xl font-bold text-white uppercase tracking-tight font-mono"
                        inputClassName="text-2xl font-bold uppercase tracking-tight"
                    />
                    <div className="flex items-center space-x-4">
                        {report.dateStr && <p className="text-zinc-500 text-sm font-mono">LOG DATE: {report.dateStr}</p>}
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-osint-panel/90 backdrop-blur-md p-8 border border-zinc-700 shadow-2xl relative overflow-hidden group mb-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-white/10"></div>
                    <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2 relative z-10">
                        <h2 className="text-xl font-bold text-white flex items-center font-mono tracking-wide">
                            <FileText className="w-5 h-5 mr-3 text-osint-primary" /> EXECUTIVE_SUMMARY
                        </h2>
                        <button onClick={handlePlayBriefing} disabled={isAudioLoading} className={`flex items-center px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all border ${isPlaying ? 'bg-red-900/20 text-red-400 border-red-900 animate-pulse' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-white'}`}>
                            {isAudioLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : isPlaying ? <StopCircle className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                            {isAudioLoading ? 'Synth...' : isPlaying ? 'Stop' : 'Voice'}
                        </button>
                    </div>
                    <div className="text-zinc-300 leading-relaxed font-sans text-base relative z-10 prose prose-invert max-w-none">
                        <ReactMarkdown components={markdownComponents}>{report.summary}</ReactMarkdown>
                    </div>
                </div>

                {/* Leads */}
                {report.leads.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-700 pb-2 mb-4 bg-black/30 p-2">
                            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest flex items-center">
                                <Target className="w-4 h-4 mr-2 text-osint-primary" /> Investigative Leads
                            </h2>
                            <button onClick={() => onBatchDeepDive(report.leads)} className="flex items-center text-xs font-mono font-bold text-black bg-osint-primary hover:bg-white px-3 py-1.5 uppercase transition-all shadow-[0_0_10px_-3px_var(--osint-primary)]">
                                <Layers className="w-4 h-4 mr-2" /> Full Spectrum
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            {report.leads.map((lead, idx) => (
                                <div key={idx} className="bg-osint-surface/80 backdrop-blur-sm border border-zinc-700/60 p-5 hover:border-osint-primary/50 transition-colors relative group flex flex-col justify-between">
                                    <div>
                                        <div className="absolute top-4 right-4 text-zinc-800 font-mono text-4xl font-bold opacity-50 group-hover:text-zinc-700">{String(idx + 1).padStart(2, '0')}</div>
                                        <Lightbulb className="w-6 h-6 text-osint-primary mb-3 opacity-80" />
                                        <div className="text-zinc-300 font-medium text-sm leading-relaxed pr-6 prose prose-invert max-w-none prose-p:my-0 mb-4">
                                            <ReactMarkdown components={markdownComponents}>{lead}</ReactMarkdown>
                                        </div>
                                    </div>
                                    <button onClick={() => onDeepDive(lead)} className="mt-2 w-full flex items-center justify-center bg-zinc-900 hover:bg-white hover:text-black text-zinc-400 py-3 text-xs font-mono font-bold transition-colors uppercase tracking-wider border border-zinc-700 hover:border-transparent group-hover:border-zinc-500">
                                        <Microscope className="w-3 h-3 mr-2" /> DEEP DIVE
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT SIDE COLUMN (Anomalies, Entities, Resources) - 1/4 Width */}
            <div className="w-1/4 h-full overflow-y-auto p-2 bg-zinc-900/10 custom-scrollbar">

                {/* Anomalies */}
                {report.agendas.length > 0 && (
                    <Accordion
                        title={`Anomalies (${report.agendas.length})`}
                        icon={AlertTriangle}
                        isOpen={sidebarAccordions.anomalies}
                        onToggle={() => toggleSidebarAccordion('anomalies')}
                        className="mb-2"
                        headerClassName="text-osint-danger"
                    >
                        <div className="space-y-2">
                            {report.agendas.map((agenda, idx) => (
                                <div key={idx} className="bg-zinc-900/80 p-3 border-l-2 border-osint-danger text-xs text-zinc-300">
                                    <ReactMarkdown components={markdownComponents}>{agenda}</ReactMarkdown>
                                </div>
                            ))}
                        </div>
                    </Accordion>
                )}

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
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${type === 'PERSON' ? 'bg-blue-500' : type === 'ORGANIZATION' ? 'bg-purple-500' : 'bg-zinc-500'}`}></div>
                                        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white truncate">{name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </Accordion>

                {/* Resources */}
                {report.sources.length > 0 && (
                    <Accordion
                        title={`Sources (${report.sources.length})`}
                        icon={Globe}
                        isOpen={sidebarAccordions.resources}
                        onToggle={() => toggleSidebarAccordion('resources')}
                        className="mb-2"
                    >
                        <div className="space-y-1">
                            {report.sources.map((source, idx) => (
                                <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className="block p-2 hover:bg-zinc-900 text-[10px] font-mono text-blue-400 hover:underline truncate border-b border-zinc-900 last:border-0">
                                    <Link2 className="w-3 h-3 inline mr-1" />
                                    {source.title}
                                </a>
                            ))}
                        </div>
                    </Accordion>
                )}
            </div>
        </div>
    );
};
