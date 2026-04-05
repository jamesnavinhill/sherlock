import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown,
  Download,
  FileText,
  Plus,
  FileJson,
  Layout,
  Briefcase,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import type { Workspace, Artifact, LabelProfile } from '../../../types';
import {
  exportCaseAsHtml,
  exportCaseAsJson,
  exportReportAsHtml,
  exportReportAsJson,
  exportCaseAsMarkdown,
  exportReportAsMarkdown,
} from '../../../utils/exportUtils';
import { stripLegacyWorkspacePrefix } from '../../../domain';
import { OsintSelect } from '../../ui/OsintSelect';

interface ToolbarProps {
  activeCase: Workspace | null;
  allCases: Workspace[];
  selectedCaseId: string | null;
  report: Artifact | null; // The currently active report
  allCaseReports: Artifact[]; // All reports for the active case
  labelProfile: LabelProfile;
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  onSelectCase: (caseId: string) => void;
  onStartNewCase: () => void;
  onSaveTemplate?: () => void;
  onOpenChat?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeCase,
  allCases,
  selectedCaseId,
  report,
  allCaseReports,
  leftPanelOpen,
  labelProfile,
  onToggleLeftPanel,
  onSelectCase,
  onStartNewCase,
  onSaveTemplate,
  onOpenChat,
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
    <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 osint-header-shadow flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex items-center space-x-2 px-3 py-1.5 border transition-all outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${leftPanelOpen ? 'bg-zinc-800 border-white text-white' : 'bg-black border-zinc-700 text-zinc-400 hover:text-white'}`}
          title="Toggle Dossier Panel (D)"
          aria-label="Toggle Dossier Panel"
        >
          <Briefcase className="w-4 h-4" />
          <span className="text-xs font-mono uppercase font-bold hidden lg:inline">Dossier</span>
          <ChevronRight
            className={`w-3 h-3 transition-transform ${leftPanelOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={onToggleLeftPanel}
          className={`md:hidden p-2 border transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${leftPanelOpen ? 'bg-zinc-800 text-white border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
          title="Toggle Dossier Panel (D)"
          aria-label="Toggle Dossier Panel"
        >
          <Layout className="w-5 h-5 focus:outline-none" />
        </button>
        <div className="hidden md:block min-w-[180px] max-w-[220px]">
          <OsintSelect
            ariaLabel={`Select ${labelProfile.workspaceLabel}`}
            value={selectedCaseId || 'ALL'}
            onChange={onSelectCase}
            triggerClassName="rounded-none py-1.5 pl-3 pr-8 text-xs font-mono truncate"
            options={[
              { value: 'ALL', label: `All ${labelProfile.workspaceLabelPlural}` },
              ...allCases.map((workspace) => ({
                value: workspace.id,
                label: stripLegacyWorkspacePrefix(workspace.title),
              })),
            ]}
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {/* Export Dropdown - show when case or report is available */}
        {(activeCase || report) && (
          <div className="flex items-center space-x-2">
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-colors uppercase font-mono text-[10px] flex items-center outline-none focus-visible:ring-2 focus-visible:ring-osint-primary"
                title={
                  report
                    ? `Open ${labelProfile.artifactLabel.toLowerCase()} context in workspace chat`
                    : `Open ${labelProfile.workspaceLabel.toLowerCase()} in workspace chat`
                }
                aria-label="Open Workspace Chat"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="ml-2 hidden lg:inline">OPEN CHAT</span>
              </button>
            )}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center px-3 py-1.5 bg-black border border-zinc-700 text-zinc-400 font-mono text-xs font-bold uppercase hover:border-zinc-500 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Export</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 shadow-xl z-50 min-w-[220px]">
                  {activeCase && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">{`Full ${labelProfile.workspaceLabel}`}</div>
                      <button
                        onClick={() => {
                          exportCaseAsHtml(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                        title={`Exports a formatted printable dossier of the entire ${labelProfile.workspaceLabel.toLowerCase()}`}
                      >
                        <Download className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.workspaceLabel} as HTML Dossier`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCaseAsMarkdown(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                        title={`Exports a full Markdown package of the ${labelProfile.workspaceLabel.toLowerCase()}`}
                      >
                        <FileText className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.workspaceLabel} as Markdown (.md)`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCaseAsJson(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center border-b border-zinc-800"
                        title={`Exports raw ${labelProfile.workspaceLabel.toLowerCase()} data for backup/integration`}
                      >
                        <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.workspaceLabel} as JSON Data`}</span>
                      </button>
                    </>
                  )}
                  {report && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">{`Current ${labelProfile.artifactLabel}`}</div>
                      <button
                        onClick={() => {
                          exportReportAsHtml(report, activeCase || undefined);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a formatted printable document`}
                      >
                        <Download className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as HTML`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportReportAsMarkdown(report);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a Markdown file`}
                      >
                        <FileText className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as Markdown`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportReportAsJson(report);
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as raw JSON data`}
                      >
                        <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as JSON`}</span>
                      </button>
                      {onSaveTemplate && (
                        <button
                          onClick={() => {
                            onSaveTemplate();
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-mono text-osint-primary hover:bg-zinc-800 hover:text-white flex items-center border-t border-zinc-800"
                          title="Saves this run configuration as a template"
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
        <button
          onClick={onStartNewCase}
          className="osint-button-primary flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase"
        >
          <Plus className="w-4 h-4 mr-1" />{' '}
          <span className="hidden lg:inline">{`New ${labelProfile.workspaceLabel}`}</span>
        </button>
      </div>
    </div>
  );
};
