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
  CompactMenuHeader,
  CompactMenuPanel,
  COMPACT_MENU_ICON_CLASS,
  COMPACT_MENU_ITEM_CLASS,
  COMPACT_MENU_ITEM_DIVIDER_CLASS,
} from '../../ui/CompactMenu';
import {
  CHROME_HEADER_CLASS,
  CHROME_HEADER_PRIMARY_ICON_BUTTON_CLASS,
  CHROME_HEADER_ICON_BUTTON_SIZE_CLASS,
  CHROME_HEADER_LEADING_GROUP_CLASS,
  CHROME_HEADER_SELECT_TRIGGER_CLASS,
  CHROME_HEADER_SELECT_WRAP_CLASS,
  getChromeHeaderIconButtonClass,
  getChromeToggleButtonClass,
} from '../../ui/chrome';
import {
  exportWorkspaceAsHtml,
  exportWorkspaceAsJson,
  exportArtifactAsHtml,
  exportArtifactAsJson,
  exportWorkspaceAsMarkdown,
  exportArtifactAsMarkdown,
} from '../../../utils/exportUtils';
import { CANONICAL_NOUNS, getWorkspaceDisplayTitle } from '../../../domain';
import { OsintSelect } from '../../ui/OsintSelect';
import { GlobalSearch } from '../../ui/GlobalSearch';

interface ToolbarProps {
  activeWorkspace: Workspace | null;
  allWorkspaces: Workspace[];
  selectedWorkspaceId: string | null;
  artifact: Artifact | null;
  workspaceArtifacts: Artifact[];
  labelProfile: LabelProfile;
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onStartWorkspace: () => void;
  onSaveTemplate?: () => void;
  onOpenChat?: () => void;
  onOpenBoard?: () => void;
  onPlaceArtifactOnBoard?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeWorkspace,
  allWorkspaces,
  selectedWorkspaceId,
  artifact,
  workspaceArtifacts,
  leftPanelOpen,
  labelProfile,
  onToggleLeftPanel,
  rightPanelOpen = false,
  onToggleRightPanel,
  onSelectWorkspace,
  onStartWorkspace,
  onSaveTemplate,
  onOpenChat,
  onOpenBoard,
  onPlaceArtifactOnBoard,
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

  const hasContextActions = Boolean(
    onOpenChat || onOpenBoard || (onPlaceArtifactOnBoard && artifact)
  );

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
            onClick={onStartWorkspace}
            className={CHROME_HEADER_PRIMARY_ICON_BUTTON_CLASS}
            title="Start a new workspace"
            aria-label="Start a new workspace"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className={CHROME_HEADER_SELECT_WRAP_CLASS}>
            <OsintSelect
              ariaLabel={`Select ${CANONICAL_NOUNS.workspace}`}
              menuTitle={CANONICAL_NOUNS.workspace}
              value={selectedWorkspaceId || 'ALL'}
              onChange={onSelectWorkspace}
              chrome="toolbar"
              triggerClassName={CHROME_HEADER_SELECT_TRIGGER_CLASS}
              options={[
                { value: 'ALL', label: `All ${CANONICAL_NOUNS.workspacePlural}` },
                ...allWorkspaces.map((workspace) => ({
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
          {/* Export Dropdown - show when workspace or artifact context is available */}
          {(activeWorkspace || artifact) && (
            <div className="flex items-center space-x-2">
              {hasContextActions && (
                <div className="relative" ref={contextMenuRef}>
                  <button
                    onClick={() => {
                      setShowExportMenu(false);
                      setShowContextMenu((current) => !current);
                    }}
                    className={getChromeHeaderIconButtonClass(showContextMenu, {
                      hasChevron: true,
                    })}
                    title="Open context actions"
                    aria-label="Open context actions"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showContextMenu && (
                    <CompactMenuPanel className="absolute right-0 top-full z-50 mt-1 min-w-[220px]">
                      <CompactMenuHeader>Workspace Actions</CompactMenuHeader>
                      {onOpenChat && (
                        <button
                          onClick={() => {
                            onOpenChat();
                            setShowContextMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={
                            artifact
                              ? `Open ${labelProfile.artifactLabel.toLowerCase()} context in workspace chat`
                              : `Open ${CANONICAL_NOUNS.workspace.toLowerCase()} in workspace chat`
                          }
                        >
                          <MessageSquare className={COMPACT_MENU_ICON_CLASS} />
                          <span>{artifact ? 'Open Context Chat' : 'Open Workspace Chat'}</span>
                        </button>
                      )}
                      {onOpenBoard && (
                        <button
                          onClick={() => {
                            onOpenBoard();
                            setShowContextMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Open ${CANONICAL_NOUNS.workspace.toLowerCase()} board`}
                        >
                          <Layout className={COMPACT_MENU_ICON_CLASS} />
                          <span>Open Board</span>
                        </button>
                      )}
                      {onPlaceArtifactOnBoard && artifact && (
                        <button
                          onClick={() => {
                            onPlaceArtifactOnBoard();
                            setShowContextMenu(false);
                          }}
                          className={`${COMPACT_MENU_ITEM_CLASS} border-t border-[color:var(--osint-shell-border)]`}
                          title={`Place this ${CANONICAL_NOUNS.artifact.toLowerCase()} on the board`}
                        >
                          <Shapes className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`Place ${CANONICAL_NOUNS.artifact} on Board`}</span>
                        </button>
                      )}
                    </CompactMenuPanel>
                  )}
                </div>
              )}
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    setShowExportMenu((current) => !current);
                  }}
                  className={getChromeHeaderIconButtonClass(showExportMenu, {
                    hasChevron: true,
                  })}
                  title="Export workspace or artifact"
                  aria-label="Export workspace or artifact"
                >
                  <Download className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showExportMenu && (
                  <CompactMenuPanel className="absolute right-0 top-full z-50 mt-1 min-w-[220px]">
                    {activeWorkspace && (
                      <>
                        <CompactMenuHeader>{`Full ${CANONICAL_NOUNS.workspace}`}</CompactMenuHeader>
                        <button
                          onClick={() => {
                            exportWorkspaceAsHtml(activeWorkspace, workspaceArtifacts);
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Exports a formatted printable view of the entire ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
                        >
                          <Download className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${CANONICAL_NOUNS.workspace} as HTML`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportWorkspaceAsMarkdown(activeWorkspace, workspaceArtifacts);
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Exports a full Markdown package of the ${CANONICAL_NOUNS.workspace.toLowerCase()}`}
                        >
                          <FileText className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${CANONICAL_NOUNS.workspace} as Markdown (.md)`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportWorkspaceAsJson(activeWorkspace, workspaceArtifacts);
                            setShowExportMenu(false);
                          }}
                          className={`${COMPACT_MENU_ITEM_CLASS} ${COMPACT_MENU_ITEM_DIVIDER_CLASS}`}
                          title={`Exports raw ${CANONICAL_NOUNS.workspace.toLowerCase()} data for backup/integration`}
                        >
                          <FileJson className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${CANONICAL_NOUNS.workspace} as JSON Data`}</span>
                        </button>
                      </>
                    )}
                    {artifact && (
                      <>
                        <CompactMenuHeader separated>{`Current ${labelProfile.artifactLabel}`}</CompactMenuHeader>
                        <button
                          onClick={() => {
                            exportArtifactAsHtml(artifact, activeWorkspace || undefined);
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a formatted printable document`}
                        >
                          <Download className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${labelProfile.artifactLabel} as HTML`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportArtifactAsMarkdown(artifact);
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as a Markdown file`}
                        >
                          <FileText className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${labelProfile.artifactLabel} as Markdown`}</span>
                        </button>
                        <button
                          onClick={() => {
                            exportArtifactAsJson(artifact);
                            setShowExportMenu(false);
                          }}
                          className={COMPACT_MENU_ITEM_CLASS}
                          title={`Exports this ${labelProfile.artifactLabel.toLowerCase()} as raw JSON data`}
                        >
                          <FileJson className={COMPACT_MENU_ICON_CLASS} />
                          <span>{`${labelProfile.artifactLabel} as JSON`}</span>
                        </button>
                        {onSaveTemplate && (
                          <button
                            onClick={() => {
                              onSaveTemplate();
                              setShowExportMenu(false);
                            }}
                            className={`${COMPACT_MENU_ITEM_CLASS} border-t border-[color:var(--osint-shell-border)] text-osint-primary`}
                            title="Saves this run configuration as a template"
                          >
                            <Layout className="osint-menu-item-icon mr-3 h-4 w-4 text-osint-primary" />
                            <span>Save as Protocol Template</span>
                          </button>
                        )}
                      </>
                    )}
                  </CompactMenuPanel>
                )}
              </div>
              {onToggleRightPanel && (
                <button
                  onClick={onToggleRightPanel}
                  className={`hidden lg:flex ${CHROME_HEADER_ICON_BUTTON_SIZE_CLASS} ${getChromeToggleButtonClass(rightPanelOpen)}`}
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
