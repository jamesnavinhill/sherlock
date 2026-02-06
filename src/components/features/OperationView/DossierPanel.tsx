import React from 'react';
import {
    FileText, Users, Lightbulb, Globe, Newspaper, User,
    ChevronRight, Link2
} from 'lucide-react';
import type { Case, Entity, Headline, InvestigationReport, Source } from '../../../types';
import { Accordion } from '../../ui/Accordion';

interface DossierPanelProps {
    isOpen: boolean;
    activeCase: Case | null;
    // Data objects
    reports: InvestigationReport[];
    entities: Entity[];
    leads: string[];
    sources: Source[];
    headlines: Headline[];
    // State
    openSections: Record<string, boolean>;
    toggleSection: (section: string) => void;
    // Actions
    onNavigate: (id: string) => void;
    onEntityClick: (entity: Entity) => void;
    onLeadClick: (lead: string) => void;
    onHeadlineClick: (headline: Headline) => void;
    activeReportId?: string;
}

export const DossierPanel: React.FC<DossierPanelProps> = ({
    isOpen,
    activeCase,
    reports,
    entities,
    leads,
    sources,
    headlines,
    openSections,
    toggleSection,
    onNavigate,
    onEntityClick,
    onLeadClick,
    onHeadlineClick,
    activeReportId
}) => {
    return (
        <div className={`${isOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:-translate-x-0'} fixed inset-y-0 left-0 z-30 w-80 lg:relative lg:z-0 lg:flex-shrink-0 transition-all duration-300 bg-black/95 backdrop-blur-md border-r border-zinc-800 overflow-hidden flex flex-col shadow-2xl lg:shadow-none ${isOpen ? 'lg:w-80' : 'lg:w-0'}`}>
            {activeCase && (
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                    <h2 className="text-base font-bold text-white font-mono leading-tight mb-2">{activeCase.title}</h2>
                    <div className="flex items-center space-x-3 text-xs text-zinc-500 font-mono">
                        <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />{reports.length} Reports</span>
                        <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{entities.length} Entities</span>
                    </div>
                </div>
            )}
            {!activeCase && (
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">
                    <h2 className="text-sm font-mono font-bold text-zinc-500 uppercase tracking-wider">No Case Selected</h2>
                    <p className="text-xs text-zinc-600 mt-1">Select a case from the dropdown above.</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto bg-black/20 p-2 custom-scrollbar">
                {/* Reports */}
                {reports.length > 0 && (
                    <Accordion
                        title="Intelligence Reports"
                        count={reports.length}
                        icon={FileText}
                        isOpen={openSections.reports}
                        onToggle={() => toggleSection('reports')}
                    >
                        <div className="space-y-1">
                            {reports.map(r => (
                                <button key={r.id} onClick={() => onNavigate(r.id)} className={`w-full text-left p-2 hover:bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white truncate flex items-center border-l-2 ${activeReportId === r.id ? 'border-osint-primary bg-zinc-900/50' : 'border-transparent hover:border-osint-primary'}`}>
                                    <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full mr-2"></div> {r.topic}
                                </button>
                            ))}
                        </div>
                    </Accordion>
                )}

                {/* Entities */}
                {entities.length > 0 && (
                    <Accordion
                        title="Identified Entities"
                        count={entities.length}
                        icon={User}
                        isOpen={openSections.entities}
                        onToggle={() => toggleSection('entities')}
                    >
                        <div className="grid grid-cols-2 gap-1">
                            {entities.map((e, idx) => (
                                <button key={idx} onClick={() => onEntityClick(e)} className="text-left p-2 bg-zinc-900/30 hover:bg-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 truncate" title={e.name}>
                                    {e.type === 'PERSON' && <span className="text-blue-500 font-bold mr-1">[P]</span>}
                                    {e.type === 'ORGANIZATION' && <span className="text-purple-500 font-bold mr-1">[O]</span>}
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    </Accordion>
                )}

                {/* Leads */}
                <Accordion
                    title="Open Leads"
                    count={leads.length}
                    icon={Lightbulb}
                    isOpen={openSections.leads}
                    onToggle={() => toggleSection('leads')}
                >
                    <div className="space-y-1">
                        {leads.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">No leads available for this case.</p>
                        ) : (
                            leads.map((lead, idx) => (
                                <div key={idx} className="p-2 bg-zinc-900/20 border border-zinc-800/50 mb-1">
                                    <p className="text-[10px] text-zinc-400 font-mono mb-2 line-clamp-2">{lead}</p>
                                    <button onClick={() => onLeadClick(lead)} className="w-full text-center py-1 bg-zinc-900 border border-zinc-700 hover:bg-osint-primary hover:text-black text-[10px] font-bold uppercase transition-colors">
                                        Investigate
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Accordion>

                {/* Sources */}
                <Accordion
                    title="Verified Sources"
                    count={sources.length}
                    icon={Globe}
                    isOpen={openSections.sources}
                    onToggle={() => toggleSection('sources')}
                >
                    <div className="space-y-1">
                        {sources.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">No case-level sources available yet.</p>
                        ) : (
                            sources.map((s, idx) => (
                                <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="block p-2 hover:bg-zinc-900 text-[10px] font-mono text-blue-400 hover:underline truncate border-b border-zinc-900 last:border-0">
                                    <Link2 className="w-3 h-3 inline mr-1" />
                                    {s.title}
                                </a>
                            ))
                        )}
                    </div>
                </Accordion>

                {/* Headlines */}
                <Accordion
                    title="Headlines"
                    count={headlines.length}
                    icon={Newspaper}
                    isOpen={openSections.headlines}
                    onToggle={() => toggleSection('headlines')}
                >
                    <div className="space-y-1">
                        {headlines.length === 0 ? (
                            <p className="text-[10px] text-zinc-600 font-mono italic px-2 py-1">No headlines linked to this case.</p>
                        ) : (
                            headlines.map((h) => (
                                <button
                                    key={h.id}
                                    onClick={() => onHeadlineClick(h)}
                                    className="w-full text-left p-2 bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 transition-colors group"
                                >
                                    <p className="text-[10px] text-zinc-300 group-hover:text-white font-mono line-clamp-2 leading-relaxed">
                                        {h.content}
                                    </p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-zinc-600 text-[9px] uppercase">{h.source}</span>
                                        <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-osint-primary opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </Accordion>
            </div>
        </div>
    );
};
