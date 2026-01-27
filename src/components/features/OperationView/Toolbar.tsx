import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Download, FileText, Plus, FileJson, Save, Layout } from 'lucide-react';
import type { Case, InvestigationReport } from '../../../types';
import { exportCaseAsHtml, exportCaseAsJson, exportReportAsHtml, exportReportAsJson, exportCaseAsMarkdown, exportReportAsMarkdown } from '../../../utils/exportUtils';

interface ToolbarProps {
    activeCase: Case | null;
    allCases: Case[];
    selectedCaseId: string | null;
    report: InvestigationReport | null; // The currently active report
    allCaseReports: InvestigationReport[]; // All reports for the active case
    leftPanelOpen: boolean;
    onToggleLeftPanel: () => void;
    onSelectCase: (caseId: string) => void;
    onStartNewCase: () => void;
    onSaveTemplate?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    activeCase, allCases, selectedCaseId, report, allCaseReports, leftPanelOpen,
    onToggleLeftPanel, onSelectCase, onStartNewCase, onSaveTemplate
}) => {
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg flex-shrink-0">
            <div className="flex items-center space-x-4 min-w-0 flex-1">

                <button
                    onClick={onToggleLeftPanel}
                    className={`p-2 border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${leftPanelOpen ? 'bg-transparent text-white border-white shadow-[0_0_15px_-5px_rgba(255,255,255,0.3)]' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                    title="Toggle Dossier Panel (D)"
                    aria-label="Toggle Dossier Panel"
                >
                    <Layout className="w-5 h-5 focus:outline-none" />
                </button>
                <div className="relative group hidden md:block">
                    <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    <select
                        value={selectedCaseId || 'ALL'}
                        onChange={(e) => onSelectCase(e.target.value)}
                        className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-osint-primary min-w-[180px] max-w-[220px] truncate"
                    >
                        <option value="ALL">SELECT CASE</option>
                        {allCases.map(c => (
                            <option key={c.id} value={c.id}>CASE: {c.title.replace('Operation: ', '')}</option>
                        ))}
                    </select>
                </div>

            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
                {/* Export Dropdown - show when case or report is available */}
                {(activeCase || report) && (
                    <div className="flex items-center space-x-2">
                        {report && onSaveTemplate && (
                            <button
                                onClick={onSaveTemplate}
                                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors uppercase font-mono text-[10px] flex items-center outline-none focus-visible:ring-2 focus-visible:ring-osint-primary"
                                title="Save current investigation config as reusable protocol template"
                                aria-label="Save as Template"
                            >
                                <Save className="w-4 h-4" />
                                <span className="ml-2 hidden lg:inline">SAVE PROTOCOL</span>
                            </button>
                        )}
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className="flex items-center px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold uppercase hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                <span className="hidden lg:inline">Export</span>
                                <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            {showExportMenu && (
                                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 shadow-xl z-50 min-w-[220px]">
                                    {activeCase && (
                                        <>
                                            <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">Full Case</div>
                                            <button
                                                onClick={() => { exportCaseAsHtml(activeCase, allCaseReports); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                                                title="Exports a formatted printable dossier of the entire case"
                                            >
                                                <Download className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Case as HTML Dossier</span>
                                            </button>
                                            <button
                                                onClick={() => { exportCaseAsMarkdown(activeCase, allCaseReports); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                                                title="Exports a full Markdown report of the case"
                                            >
                                                <FileText className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Case as Markdown (.md)</span>
                                            </button>
                                            <button
                                                onClick={() => { exportCaseAsJson(activeCase, allCaseReports); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center border-b border-zinc-800"
                                                title="Exports raw case data for backup/integration"
                                            >
                                                <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Case as JSON Data</span>
                                            </button>
                                        </>
                                    )}
                                    {report && (
                                        <>
                                            <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">Current Report</div>
                                            <button
                                                onClick={() => { exportReportAsHtml(report, activeCase || undefined); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                                                title="Exports this report as a formatted printable document"
                                            >
                                                <Download className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Report as HTML</span>
                                            </button>
                                            <button
                                                onClick={() => { exportReportAsMarkdown(report); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                                                title="Exports this report as a Markdown file"
                                            >
                                                <FileText className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Report as Markdown</span>
                                            </button>
                                            <button
                                                onClick={() => { exportReportAsJson(report); setShowExportMenu(false); }}
                                                className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                                                title="Exports this report as raw JSON data"
                                            >
                                                <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                                                <span>Report as JSON</span>
                                            </button>
                                            {onSaveTemplate && (
                                                <button
                                                    onClick={() => { onSaveTemplate(); setShowExportMenu(false); }}
                                                    className="w-full text-left px-4 py-2.5 text-xs font-mono text-osint-primary hover:bg-zinc-800 hover:text-white flex items-center border-t border-zinc-800"
                                                    title="Saves this investigation's configuration as a template"
                                                >
                                                    <Layout className="w-4 h-4 mr-3 text-osint-primary" />
                                                    <span>Save as Protocol Template</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <button onClick={onStartNewCase} className="flex items-center px-3 py-1.5 bg-white text-black border border-white font-mono text-xs font-bold uppercase hover:bg-osint-primary hover:border-osint-primary transition-colors shadow-lg shadow-white/10">
                    <Plus className="w-4 h-4 mr-1" /> <span className="hidden lg:inline">New Case</span>
                </button>
            </div>
        </div>
    );
};
