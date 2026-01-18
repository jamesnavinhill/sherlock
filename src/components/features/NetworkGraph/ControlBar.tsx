import React from 'react';
import {
    Briefcase, ChevronRight, ChevronDown, Box, Eye, EyeOff, Star,
    ZoomOut, ZoomIn, Link as LinkIcon, PlusCircle, GitMerge
} from 'lucide-react';
import { Case } from '../../../types';

interface ControlBarProps {
    cases: Case[];
    filterCaseId: string;
    onCaseChange: (caseId: string) => void;
    showLeftPanel: boolean;
    onToggleLeftPanel: () => void;
    showSingletons: boolean;
    onToggleSingletons: () => void;
    showHiddenNodes: boolean;
    onToggleHiddenNodes: () => void;
    showFlaggedOnly: boolean;
    onToggleFlaggedOnly: () => void;
    isLinkingMode: boolean;
    onToggleLinkingMode: () => void;
    onZoom: (dir: 'IN' | 'OUT') => void;
    onShowAddNode: () => void;
    onShowResolution: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
    cases,
    filterCaseId,
    onCaseChange,
    showLeftPanel,
    onToggleLeftPanel,
    showSingletons,
    onToggleSingletons,
    showHiddenNodes,
    onToggleHiddenNodes,
    showFlaggedOnly,
    onToggleFlaggedOnly,
    isLinkingMode,
    onToggleLinkingMode,
    onZoom,
    onShowAddNode,
    onShowResolution
}) => {
    return (
        <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg flex-shrink-0">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
                <button
                    onClick={onToggleLeftPanel}
                    className={`hidden md:flex items-center space-x-2 px-3 py-1.5 border transition-all ${showLeftPanel ? 'bg-zinc-800 border-white text-white' : 'bg-black border-zinc-700 text-zinc-400 hover:text-white'}`}
                >
                    <Briefcase className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase font-bold hidden lg:inline">Case Dossier</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${showLeftPanel ? 'rotate-180' : ''}`} />
                </button>
                <div className="relative group hidden md:block">
                    <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    <select
                        value={filterCaseId}
                        onChange={(e) => onCaseChange(e.target.value)}
                        className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-osint-primary min-w-[180px] max-w-[220px] truncate"
                    >
                        <option value="">SELECT CASE</option>
                        {cases.map(c => (
                            <option key={c.id} value={c.id}>CASE: {c.title.replace('Operation: ', '')}</option>
                        ))}
                        <option value="ALL" className="font-bold border-t border-zinc-700">ALL CASES (GLOBAL VIEW)</option>
                    </select>
                </div>
            </div>

            {/* Filter Toggles */}
            <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-700/50 rounded-sm p-0.5 mx-4">
                <button
                    onClick={onToggleSingletons}
                    className={`p-1.5 ${showSingletons ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-500'} transition-colors relative group`}
                    title={showSingletons ? "Hide Singletons" : "Show Singletons"}
                >
                    <Box className="w-3.5 h-3.5" />
                    {!showSingletons && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-full h-px bg-red-500 rotate-45 transform scale-110"></div></div>}
                </button>
                <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                <button
                    onClick={onToggleHiddenNodes}
                    className={`p-1.5 ${showHiddenNodes ? 'text-osint-warn' : 'text-zinc-500 hover:text-white'} transition-colors`}
                    title={showHiddenNodes ? "Hide Deleted" : "Show Deleted"}
                >
                    {showHiddenNodes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                <button
                    onClick={onToggleFlaggedOnly}
                    className={`p-1.5 ${showFlaggedOnly ? 'text-yellow-500' : 'text-zinc-500 hover:text-white'} transition-colors`}
                    title="Show Flagged Only"
                >
                    <Star className={`w-3.5 h-3.5 ${showFlaggedOnly ? 'fill-current' : ''}`} />
                </button>
                <div className="w-px h-3 bg-zinc-800 mx-1"></div>
                <button
                    onClick={() => onZoom('OUT')}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onZoom('IN')}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="h-6 w-px bg-zinc-800 mx-1"></div>
                <button
                    onClick={onToggleLinkingMode}
                    className={`p-2 border transition-colors ${isLinkingMode ? 'bg-osint-primary text-black border-osint-primary' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-white'}`}
                    title="Manual Link Mode"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={onShowAddNode}
                    className="p-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition-colors"
                    title="Add Manual Node"
                >
                    <PlusCircle className="w-4 h-4" />
                </button>
                <button
                    onClick={onShowResolution}
                    className="p-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-white transition-colors"
                    title="Consolidate Entities"
                >
                    <GitMerge className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
