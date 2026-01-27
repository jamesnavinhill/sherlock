import React, { useMemo } from 'react';
import { useCaseStore } from '../../store/caseStore';
import {
    Clock, Calendar, FileText, Target, Activity,
    ChevronRight, ExternalLink, Filter, Search,
    GitBranch, ArrowDown, User, Shield
} from 'lucide-react';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { InvestigationReport, Case } from '../../types';

export const TimelineView: React.FC = () => {
    const { archives, cases, setCurrentView, onSelectReport } = useCaseStore() as any; // Using any for store methods not in interface but exist

    const eventTimeline = useMemo(() => {
        const events: any[] = [];

        // Add Reports
        archives.forEach((r: InvestigationReport) => {
            events.push({
                id: r.id,
                type: 'REPORT',
                title: r.topic,
                timestamp: r.dateStr || 'Unknown',
                date: new Date(r.dateStr || 0).getTime(),
                data: r,
                icon: FileText,
                color: 'text-osint-primary'
            });
        });

        // Add Cases
        cases.forEach((c: Case) => {
            events.push({
                id: c.id,
                type: 'CASE',
                title: c.title,
                timestamp: c.dateOpened,
                date: new Date(c.dateOpened).getTime(),
                data: c,
                icon: Target,
                color: 'text-white'
            });
        });

        // Sort by date descending
        return events.sort((a, b) => b.date - a.date);
    }, [archives, cases]);

    return (
        <div className="min-h-screen bg-black w-full relative pb-20">
            <BackgroundMatrixRain />

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg">
                <h1 className="text-xl font-bold text-white font-mono flex items-center tracking-wider uppercase">
                    <Activity className="w-5 h-5 mr-3 text-osint-primary" />
                    INVESTIGATION_TIMELINE
                    <span className="hidden md:inline-block h-6 w-px bg-zinc-800 mx-4"></span>
                    <span className="hidden md:inline-block text-zinc-500 text-xs font-mono tracking-normal lowercase">chronological operations & intelligence logs</span>
                </h1>
            </div>

            <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {eventTimeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-zinc-800 bg-zinc-900/20">
                        <Clock className="w-12 h-12 text-zinc-700 mb-4 opacity-30" />
                        <h3 className="text-zinc-500 font-mono text-xs uppercase font-bold mb-1">Timeline Vacant</h3>
                        <p className="text-zinc-600 font-mono text-[10px]">No intelligence artifacts collected yet.</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />

                        <div className="space-y-12">
                            {eventTimeline.map((event, idx) => (
                                <div key={`${event.id}-${idx}`} className="relative flex items-start group">
                                    {/* Icon / Marker */}
                                    <div className="relative z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-black border border-zinc-700 group-hover:border-osint-primary transition-colors">
                                        <event.icon className={`w-4 h-4 ${event.color}`} />
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 md:ml-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                            <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center mb-1 md:mb-0">
                                                <Calendar className="w-3 h-3 mr-2" />
                                                {event.timestamp}
                                                <span className="mx-2 opacity-30">|</span>
                                                {event.type} LOG
                                            </div>
                                            <button
                                                onClick={() => {
                                                    // This logic should be refined based on store methods
                                                }}
                                                className="text-[10px] font-mono text-zinc-600 hover:text-white transition-colors uppercase flex items-center"
                                            >
                                                Details <ExternalLink className="w-3 h-3 ml-1" />
                                            </button>
                                        </div>

                                        <div className="bg-osint-panel/90 backdrop-blur-sm border border-zinc-800 p-5 group-hover:border-zinc-600 transition-colors shadow-lg relative overflow-hidden">
                                            {/* Accent Bar */}
                                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${event.type === 'CASE' ? 'bg-white' : 'bg-osint-primary'}`} />

                                            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-tight mb-2">
                                                {event.title}
                                            </h3>

                                            {event.type === 'REPORT' && (
                                                <p className="text-zinc-500 text-xs font-mono line-clamp-2 italic leading-relaxed">
                                                    {event.data.summary}
                                                </p>
                                            )}

                                            {event.type === 'CASE' && (
                                                <p className="text-zinc-500 text-xs font-mono leading-relaxed">
                                                    Operation initialized. Target topic identified as "{event.data.description}".
                                                </p>
                                            )}

                                            {/* Tags/Meta */}
                                            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2">
                                                {event.type === 'REPORT' && event.data.entities?.slice(0, 3).map((ent: any, i: number) => (
                                                    <span key={i} className="text-[9px] font-mono bg-zinc-900 text-zinc-500 px-2 py-0.5 border border-zinc-800">
                                                        @{typeof ent === 'string' ? ent : ent.name}
                                                    </span>
                                                ))}
                                                {event.type === 'CASE' && (
                                                    <span className="text-[9px] font-mono bg-zinc-900 text-zinc-300 px-2 py-0.5 border border-zinc-800 flex items-center">
                                                        <Shield className="w-3 h-3 mr-1 text-osint-primary" />
                                                        STATUS: {event.data.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-12 text-center">
                    <div className="inline-flex items-center space-x-2 text-[10px] font-mono text-zinc-600 uppercase border border-zinc-800/50 px-4 py-2 bg-zinc-900/20 backdrop-blur-sm">
                        <Activity className="w-3 h-3 text-osint-primary" />
                        <span>Protocol End of Log</span>
                        <ArrowDown className="w-3 h-3" />
                    </div>
                </div>
            </div>
        </div>
    );
};
