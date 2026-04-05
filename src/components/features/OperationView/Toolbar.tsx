import React, { useRef, useState, useEffect } from 'react';
import {
  ChevronDown,
  Download,
  FileText,
  Plus,
  FileJson,
  Layout,
  Briefcase,
  MessageSquare,
  PanelRight,
  Shapes,
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
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onSelectCase: (caseId: string) => void;
  onStartNewCase: () => void;
  onSaveTemplate?: () => void;
  onOpenChat?: () => void;
  onOpenBoard?: () => void;
  onPlaceReportOnBoard?: () => void;
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
  rightPanelOpen = false,
  onToggleRightPanel,
  onSelectCase,
  onStartNewCase,
  onSaveTemplate,
  onOpenChat,
  onOpenBoard,
  onPlaceReportOnBoard,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasContextActions = Boolean(onOpenChat || onOpenBoard || (onPlaceReportOnBoard && report));

  return (
    <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 osint-header-shadow flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-4 min-w-0 flex-1">
        <button
          onClick={onToggleLeftPanel}
          className={`hidden md:flex items-center justify-center border p-2 transition outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${leftPanelOpen ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'}`}
          title="Toggle Dossier Panel (D)"
          aria-label="Toggle Dossier Panel"
        >
          <Briefcase className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleLeftPanel}
          className={`md:hidden border p-2 transition duration-300 outline-none focus-visible:ring-2 focus-visible:ring-osint-primary ${leftPanelOpen ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary' : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'}`}
          title="Toggle Dossier Panel (D)"
          aria-label="Toggle Dossier Panel"
        >
          <Briefcase className="w-5 h-5 focus:outline-none" />
        </button>
        <button
          onClick={onStartNewCase}
          className="osint-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden lg:inline">{`New ${labelProfile.workspaceLabel}`}</span>
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
            {hasContextActions && (
              <div className="relative" ref={contextMenuRef}>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    setShowContextMenu((current) => !current);
                  }}
                  className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                    showContextMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Open</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                {showContextMenu && (
                  <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                    <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">
                      Workspace Actions
                    </div>
                    {onOpenChat && (
                      <button
                        onClick={() => {
                          onOpenChat();
                          setShowContextMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={
                          report
                            ? `Open ${labelProfile.artifactLabel.toLowerCase()} context in workspace chat`
                            : `Open ${labelProfile.workspaceLabel.toLowerCase()} in workspace chat`
                        }
                      >
                        <MessageSquare className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{report ? 'Open Context Chat' : 'Open Workspace Chat'}</span>
                      </button>
                    )}
                    {onOpenBoard && (
                      <button
                        onClick={() => {
                          onOpenBoard();
                          setShowContextMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Open ${labelProfile.workspaceLabel.toLowerCase()} research board`}
                      >
                        <Layout className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>Open Board</span>
                      </button>
                    )}
                    {onPlaceReportOnBoard && report && (
                      <button
                        onClick={() => {
                          onPlaceReportOnBoard();
                          setShowContextMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center border-t border-zinc-800"
                        title={`Place this ${labelProfile.artifactLabel.toLowerCase()} on the research board`}
                      >
                        <Shapes className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`Place ${labelProfile.artifactLabel} on Board`}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    setShowExportMenu((current) => !current);
                  }}
                  className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                    showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
                  }`}
                >
                <Download className="w-4 h-4 mr-1" />
                <span className="hidden lg:inline">Export</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {showExportMenu && (
                <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                  {activeCase && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-mono uppercase border-b border-zinc-800 bg-zinc-900/50">{`Full ${labelProfile.workspaceLabel}`}</div>
                      <button
                        onClick={() => {
                          exportCaseAsHtml(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports a formatted printable dossier of the entire ${labelProfile.workspaceLabel.toLowerCase()}`}
                      >
                        <Download className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.workspaceLabel} as HTML Dossier`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCaseAsMarkdown(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports a full Markdown package of the ${labelProfile.workspaceLabel.toLowerCase()}`}
                      >
                        <FileText className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.workspaceLabel} as Markdown (.md)`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportCaseAsJson(activeCase, allCaseReports);
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800"
                        title={`Exports raw ${labelProfile.workspaceLabel.toLowerCase()} data for backup/integration`}
                      >
                        <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
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
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a formatted printable document`}
                      >
                        <Download className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as HTML`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportReportAsMarkdown(report);
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a Markdown file`}
                      >
                        <FileText className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as Markdown`}</span>
                      </button>
                      <button
                        onClick={() => {
                          exportReportAsJson(report);
                          setShowExportMenu(false);
                        }}
                        className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-zinc-300 flex items-center"
                        title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as raw JSON data`}
                      >
                        <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                        <span>{`${labelProfile.artifactLabel} as JSON`}</span>
                      </button>
                      {onSaveTemplate && (
                        <button
                          onClick={() => {
                            onSaveTemplate();
                            setShowExportMenu(false);
                          }}
                          className="osint-menu-item w-full text-left px-4 py-2.5 text-xs font-mono text-osint-primary flex items-center border-t border-zinc-800"
                          title="Saves this run configuration as a template"
                        >
                          <Layout className="osint-menu-item-icon w-4 h-4 mr-3 text-osint-primary" />
                          <span>Save as Protocol Template</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            {onToggleRightPanel && (
              <button
                onClick={onToggleRightPanel}
                className={`hidden lg:flex items-center justify-center border p-2 text-xs font-mono uppercase transition ${
                  rightPanelOpen
                    ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                    : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
                }`}
                title="Toggle Inspector Panel"
                aria-label="Toggle Inspector Panel"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
