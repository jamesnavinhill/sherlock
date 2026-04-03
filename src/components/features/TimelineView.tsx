import React from 'react';
import { Activity, Clock3, FileText, MessageSquare, Radio, Target } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';

export const TimelineView: React.FC = () => {
    const { cases, archives, chatSessions, headlines, tasks } = useCaseStore();

    const parkedSlices = [
        { label: 'Workspaces', value: cases.length, icon: Target },
        { label: 'Artifacts', value: archives.length, icon: FileText },
        { label: 'Runs', value: tasks.length, icon: Activity },
        { label: 'Chat Sessions', value: chatSessions.length, icon: MessageSquare },
        { label: 'Signals', value: headlines.length, icon: Radio },
    ];

    return (
        <div className="min-h-screen bg-black w-full relative pb-20">
            <BackgroundMatrixRain />

            <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg">
                <h1 className="text-xl font-bold text-white font-mono flex items-center tracking-wider uppercase">
                    <Clock3 className="w-5 h-5 mr-3 text-osint-primary" />
                    Workspace Timeline
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                    Parked For Slice 2
                </span>
            </div>

            <div className="relative z-10 p-6 w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-5xl mx-auto space-y-8">
                    <section className="border border-zinc-800 bg-osint-panel/85 backdrop-blur-sm p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-5 h-5 text-osint-primary" />
                            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-widest">
                                Chronology Surface Parked
                            </h2>
                        </div>
                        <p className="text-sm text-zinc-400 font-mono leading-relaxed max-w-3xl">
                            Timeline is intentionally parked during Slice 1 cleanup so workspace-data lifecycle parity can land first. The next buildout will turn this into a real chronology surface instead of leaving a half-connected legacy log in the shell.
                        </p>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        {parkedSlices.map((slice) => (
                            <div key={slice.label} className="border border-zinc-800 bg-zinc-900/80 p-5 space-y-3">
                                <slice.icon className="w-5 h-5 text-osint-primary" />
                                <div className="text-2xl font-bold text-white font-mono">{slice.value}</div>
                                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                                    {slice.label}
                                </div>
                            </div>
                        ))}
                    </section>

                    <section className="border border-dashed border-zinc-800 bg-zinc-950/70 p-8">
                        <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-widest mb-4">
                            Next Timeline Inputs
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-[11px] font-mono text-zinc-500 leading-relaxed">
                            <p>Artifact chronology and follow-up lineage are already persisted through reports and run metadata.</p>
                            <p>Saved signals, workspace chat actions, and workspace-linked runs are now part of the cleanup/parity maintenance path.</p>
                            <p>Manual graph data remains available for the later timeline slice without shipping placeholder timeline interactions now.</p>
                            <p>The sidebar stays focused on active surfaces until the dedicated chronology rebuild is ready.</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
