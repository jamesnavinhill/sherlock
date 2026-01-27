import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const shortcuts = [
        { keys: ['Ctrl', 'N'], description: 'Start New Investigation' },
        { keys: ['Ctrl', 'K'], description: 'Global Search / Quick Jump' },
        { keys: ['Ctrl', 'F'], description: 'Focus Search in View' },
        { keys: ['Ctrl', '/'], description: 'Show this Help Modal' },
        { keys: ['Esc'], description: 'Close Modals / Go Back' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-osint-panel border border-zinc-700 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black">
                    <h3 className="text-white font-mono font-bold uppercase text-sm flex items-center">
                        <Keyboard className="w-4 h-4 mr-2 text-osint-primary" />
                        Command Interface
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Close help"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        {shortcuts.map((s, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <span className="text-zinc-400 text-xs font-mono uppercase group-hover:text-zinc-200 transition-colors">
                                    {s.description}
                                </span>
                                <div className="flex gap-1.5">
                                    {s.keys.map((k, ki) => (
                                        <kbd
                                            key={ki}
                                            className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] font-mono rounded min-w-[24px] text-center shadow-[0_2px_0_0_rgba(0,0,0,0.5)]"
                                        >
                                            {k}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center text-[10px] text-zinc-600 font-mono uppercase">
                            <Command className="w-3 h-3 mr-2" />
                            System Version 2.0.4-LTS
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
