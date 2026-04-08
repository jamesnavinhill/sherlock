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
  CHROME_HEADER_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_PRIMARY_ACTION_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeMenuButtonClass,
  getChromeToggleButtonClass,
} from '../../ui/chrome';
import {
  exportCaseAsHtml,
  exportCaseAsJson,
  exportReportAsHtml,
  exportReportAsJson,
  exportCaseAsMarkdown,
  exportReportAsMarkdown,
} from '../../../utils/exportUtils';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../../domain';
import { OsintSelect } from '../../ui/OsintSelect';
import { GlobalSearch } from '../../ui/GlobalSearch';

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
  onSelectCase: (workspaceId: string) => void;
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
    <div className={`${CHROME_HEADER_CLASS} px-6`}>
      <div className="flex h-full min-w-0 items-center gap-3">
        <div className={CHROME_HEADER_LEADING_GROUP_CLASS}>
          <button
            onClick={onToggleLeftPanel}
            className={`hidden md:flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(leftPanelOpen)}`}
            title="Toggle workspace panel (D)"
            aria-label="Toggle workspace panel"
          >
            <Briefcase className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleLeftPanel}
            className={`md:hidden ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(leftPanelOpen)}`}
            title="Toggle workspace panel (D)"
            aria-label="Toggle workspace panel"
          >
            <Briefcase className="w-5 h-5 focus:outline-none" />
          </button>
          <button
            onClick={onStartNewCase}
            className={CHROME_HEADER_PRIMARY_ACTION_CLASS}
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
          <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
            <OsintSelect
              ariaLabel={`Select ${CANONICAL_NOUNS.workspace}`}
              value={selectedCaseId || 'ALL'}
              onChange={onSelectCase}
              chrome="toolbar"
              triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
              options={[
                { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
                ...allCases.map((workspace) => ({
                  value: workspace.id,
                  label: getWorkspaceDisplayTitle(workspace),
                })),
              ]}
            />
          </div>
        </div>

        <div className="flex min-w-[12rem] flex-[0.95_1_24rem] items-center justify-center">
          <GlobalSearch compact className="mx-auto w-full" />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
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
                    className={getChromeMenuButtonClass(showContextMenu)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="hidden lg:inline">Open</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  {showContextMenu && (
                    <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                      <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">
                        Workspace Actions
                      </div>
                      {onOpenChat && (
                        <button
                          onClick={() => {
                            onOpenChat();
                            setShowContextMenu(false);
                          }}
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={
                            report
                              ? `Open ${labelProfile.artifactLabel.toLowerCase()} context in workspace chat`
                              : `Open ${CANONICAL_NOUNS.workspace.toLowerCase()} in workspace chat`
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
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={`Open ${CANONICAL_NOUNS.workspace.toLowerCase()} board`}
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
                          className="osint-menu-item flex w-full items-center border-t border-zinc-800 px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={`Place this ${CANONICAL_NOUNS.artifact.toLowerCase()} on the board`}
                        >
                          <Shapes className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                          <span>{`Place ${CANONICAL_NOUNS.artifact} on Board`}</span>
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
                  className={getChromeMenuButtonClass(showExportMenu)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Export</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                {showExportMenu && (
                  <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                    {activeCase && (
                      <>
                        <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">{`Full ${CANONICAL_NOUNS.workspace}`}</div>
                        <button
                          onClick={() => {
                            exportCaseAsHtml(activeCase, allCaseReports);
                            setShowExportMenu(false);
                          }}
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={`Exports a formatted printable view of the entire ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
                        >
                          <Download className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                          <span>{`${CANONICAL_NOUNS.workspace} as HTML`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportCaseAsMarkdown(activeCase, allCaseReports);
                            setShowExportMenu(false);
                          }}
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={`Exports a full Markdown package of the ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
                        >
                          <FileText className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                          <span>{`${CANONICAL_NOUNS.workspace} as Markdown (.md)`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportCaseAsJson(activeCase, allCaseReports);
                            setShowExportMenu(false);
                          }}
                          className="osint-menu-item flex w-full items-center border-b border-zinc-800 px-4 py-2.5 text-left osint-body-small text-zinc-300"
                          title={`Exports raw ${CANONICAL_NOUNS.workspace.toLowerCase()} data for backup/integration`}
                        >
                          <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                          <span>{`${CANONICAL_NOUNS.workspace} as JSON Data`}</span>
                        </button>
                      </>
                    )}
                    {report && (
                      <>
                        <div className="border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 osint-menu-section-label">{`Current ${labelProfile.artifactLabel}`}</div>
                        <button
                          onClick={() => {
                            exportReportAsHtml(report, activeCase || undefined);
                            setShowExportMenu(false);
                          }}
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
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
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
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
                          className="osint-menu-item flex w-full items-center px-4 py-2.5 text-left osint-body-small text-zinc-300"
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
                            className="osint-menu-item flex w-full items-center border-t border-zinc-800 px-4 py-2.5 text-left osint-body-small text-osint-primary"
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
                  className={`hidden lg:flex ${getChromeToggleButtonClass(rightPanelOpen)}`}
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
    </div>
  );
};
