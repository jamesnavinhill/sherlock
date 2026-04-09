import React, { useState } from 'react';
import {
  User,
  Building2,
  Network,
  X,
  Star,
  Search,
  FileText,
  Newspaper,
  Globe,
  ExternalLink,
  Lightbulb,
  FolderOpen,
  EyeOff,
  Microscope,
  Link2,
  MessageSquare,
  Shapes,
  Trash2,
} from 'lucide-react';
import type { Entity, Headline, Artifact } from '../../../types';
import { EditableTitle } from '../../ui/EditableTitle';
import { Accordion } from '../../ui/Accordion';
import { InspectorActionRow, type InspectorActionItem } from '../../ui/InspectorActionRow';
import {
  CHROME_COMPACT_ACTION_BUTTON_CLASS,
  CHROME_COMPACT_NESTED_ITEM_BUTTON_CLASS,
  CHROME_COMPACT_NESTED_ITEM_CLASS,
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_NESTED_ITEM_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '../../ui/chrome';
import { cleanEntityName } from '../../../utils/text';
import { getEntityToneClass } from '../../../utils/entityPalette';
import { getArtifactFollowUps, getFollowUpText, getLabelProfileById } from '../../../domain';
import type { GraphNode } from './GraphCanvas';

type InvestigationContext = { topic: string; summary: string };

interface NodeInspectorProps {
  isOpen: boolean;
  onClose: () => void;

  // Mode & Data
  mode: 'ENTITY' | 'HEADLINE' | 'REPORT' | null;
  selectedNode: GraphNode | null;
  selectedEntity: string | null;
  selectedHeadline: Headline | null;
  selectedReport: Artifact | null;

  // Context
  reports: Artifact[];
  hiddenNodeIds: Set<string>;
  flaggedNodeIds: Set<string>;

  // Actions
  onEntitySave: (oldName: string, newName: string) => void;
  onReportSave: (report: Artifact, newTitle: string) => void;
  onToggleFlag: () => void;
  onToggleHide: () => void;
  onDeleteNode: () => void;
  onInvestigate: (topic: string, context?: InvestigationContext) => void; // Trigger modal or immediate
  onOpenReport: (report: Artifact) => void;
  onOpenEntityChat: (entityName: string) => void;
  onOpenReportChat: (report: Artifact) => void;
  onOpenHeadlineChat: (headline: Headline) => void;
  onPlaceEntityOnBoard: (entityName: string) => void;
  onPlaceReportOnBoard: (report: Artifact) => void;
  onPlaceHeadlineOnBoard: (headline: Headline) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  isOpen,
  onClose,
  mode,
  selectedNode,
  selectedEntity,
  selectedHeadline,
  selectedReport,
  reports,
  hiddenNodeIds,
  flaggedNodeIds,
  onEntitySave,
  onReportSave,
  onToggleFlag,
  onToggleHide,
  onDeleteNode,
  onInvestigate,
  onOpenReport,
  onOpenEntityChat,
  onOpenReportChat,
  onOpenHeadlineChat,
  onPlaceEntityOnBoard,
  onPlaceReportOnBoard,
  onPlaceHeadlineOnBoard,
}) => {
  // Accordion Control
  const [inspectorAccordions, setInspectorAccordions] = useState<Record<string, boolean>>({
    mentions: false,
    connections: false,
    reportEntities: false,
    reportLeads: false,
    reportSources: false,
  });

  const toggleAccordion = (section: string) => {
    setInspectorAccordions((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      ) as typeof prev
    );
  };

  // --- Helpers ---
  const getEntityDetails = (entityName: string): Entity | null => {
    const cleanName = cleanEntityName(entityName);
    for (const r of reports) {
      for (const e of r.entities) {
        const eName = typeof e === 'string' ? e : e.name;
        if (cleanEntityName(eName) === cleanName && typeof e !== 'string') {
          return e;
        }
      }
    }
    return null;
  };

  const reportTextIncludes = (report: Artifact, cleanName: string) => {
    const sectionText = (report.sections || [])
      .flatMap((section) => [section.title, section.content || '', ...(section.items || [])])
      .join(' ');

    return [report.summary, report.rawText, sectionText]
      .filter(Boolean)
      .some((value) => cleanEntityName(value).includes(cleanName));
  };

  const getNodeType = (entityName: string) => {
    const entity = getEntityDetails(entityName);
    if (entity) return entity.type;

    const cleanName = cleanEntityName(entityName);
    const sourceMatch = reports.some((report) =>
      (report.sources || []).some(
        (source) =>
          cleanEntityName(source.title) === cleanName ||
          cleanEntityName(source.url || '').includes(cleanName)
      )
    );

    return sourceMatch ? 'SOURCE' : 'UNKNOWN';
  };

  const getEntityMentions = (entityName: string) => {
    const cleanName = cleanEntityName(entityName);
    return reports.filter(
      (r) =>
        (r.entities || []).some((e) => {
          const name = typeof e === 'string' ? e : e.name;
          return cleanEntityName(name) === cleanName;
        }) ||
        (r.sources || []).some(
          (source) =>
            cleanEntityName(source.title) === cleanName ||
            cleanEntityName(source.url || '').includes(cleanName)
        ) ||
        reportTextIncludes(r, cleanName)
    );
  };

  const getEntityConnections = (entityName: string) => {
    const cleanName = cleanEntityName(entityName);
    const connectedEntities = new Map<string, { entity: Entity; count: number }>();
    const mentionIds = new Set(getEntityMentions(entityName).map((report) => report.id));

    reports.forEach((r) => {
      const hasEntity = !!r.id && mentionIds.has(r.id);

      if (hasEntity) {
        (r.entities || []).forEach((e) => {
          const name = typeof e === 'string' ? e : e.name;
          if (cleanEntityName(name) !== cleanName) {
            const existing = connectedEntities.get(name) || {
              entity: typeof e === 'string' ? { name, type: 'UNKNOWN' } : e,
              count: 0,
            };
            existing.count++;
            connectedEntities.set(name, existing);
          }
        });
      }
    });

    return Array.from(connectedEntities.values()).sort((a, b) => b.count - a.count);
  };
  const selectedEntityToneClass = selectedEntity
    ? getEntityToneClass(getNodeType(selectedEntity))
    : getEntityToneClass('UNKNOWN');
  const selectedReportLabelProfile = getLabelProfileById(
    selectedReport?.labelProfileId || selectedReport?.config?.labelProfileId
  );
  const selectedReportFollowUps = selectedReport
    ? (() => {
        const canonicalFollowUps = getArtifactFollowUps(selectedReport);
        if (canonicalFollowUps.length > 0) {
          return canonicalFollowUps.map(getFollowUpText);
        }
        return selectedReport.leads || [];
      })()
    : [];

  const selectedNodeType = selectedEntity ? getNodeType(selectedEntity) : 'UNKNOWN';
  const isSelectedNodeFlagged =
    !!selectedNode &&
    (flaggedNodeIds.has(selectedNode.id) || flaggedNodeIds.has(selectedNode.label));
  const isSelectedNodeHidden =
    !!selectedNode && (hiddenNodeIds.has(selectedNode.id) || hiddenNodeIds.has(selectedNode.label));
  const selectedNodeDeleteLabel = selectedNode?.isManual ? 'Delete node' : 'Remove from network';
  const reportActions: InspectorActionItem[] = selectedReport
    ? [
        {
          id: 'report-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: () => onOpenReportChat(selectedReport),
        },
        {
          id: 'report-open',
          label: 'Open',
          icon: FolderOpen,
          onClick: () => onOpenReport(selectedReport),
        },
        {
          id: 'report-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: () => onPlaceReportOnBoard(selectedReport),
        },
        {
          id: 'report-search',
          label: 'Google',
          icon: Search,
          href: `https://www.google.com/search?q=${encodeURIComponent(selectedReport.topic)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          id: 'report-flag',
          label: isSelectedNodeFlagged ? 'Unstar node' : 'Star node',
          icon: Star,
          iconOnly: true,
          onClick: onToggleFlag,
          iconClassName: isSelectedNodeFlagged ? 'fill-current' : undefined,
          className: isSelectedNodeFlagged
            ? 'border-yellow-700 bg-yellow-900/20 text-yellow-500 hover:border-yellow-600 hover:text-yellow-400'
            : undefined,
        },
        {
          id: 'report-hide',
          label: isSelectedNodeHidden ? 'Unhide node' : 'Hide node',
          icon: EyeOff,
          iconOnly: true,
          onClick: onToggleHide,
          className: isSelectedNodeHidden
            ? 'border-zinc-500 bg-zinc-900/50 text-white hover:border-white hover:text-white'
            : undefined,
        },
        {
          id: 'report-delete',
          label: selectedNodeDeleteLabel,
          icon: Trash2,
          iconOnly: true,
          onClick: onDeleteNode,
          className:
            'osint-danger-inline hover:border-[color:var(--osint-danger-soft-border)] hover:bg-[color:var(--osint-danger-soft-bg)]',
        },
      ]
    : [];
  const headlineActions: InspectorActionItem[] = selectedHeadline
    ? [
        {
          id: 'headline-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: () => {
            onOpenHeadlineChat(selectedHeadline);
            onClose();
          },
        },
        {
          id: 'headline-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: () => {
            onPlaceHeadlineOnBoard(selectedHeadline);
            onClose();
          },
        },
        {
          id: 'headline-investigate',
          label: 'Run',
          icon: Microscope,
          onClick: () => {
            onInvestigate(selectedHeadline.content);
            onClose();
          },
        },
      ]
    : [];
  const entityActions: InspectorActionItem[] = selectedEntity
    ? [
        {
          id: 'entity-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: () => onOpenEntityChat(selectedEntity),
        },
        {
          id: 'entity-investigate',
          label: 'Run',
          icon: Microscope,
          onClick: () => onInvestigate(selectedEntity),
        },
        {
          id: 'entity-search',
          label: 'Google',
          icon: Search,
          href: `https://www.google.com/search?q=${encodeURIComponent(selectedEntity)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          id: 'entity-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: () => onPlaceEntityOnBoard(selectedEntity),
        },
        {
          id: 'entity-flag',
          label: isSelectedNodeFlagged ? 'Unstar node' : 'Star node',
          icon: Star,
          iconOnly: true,
          onClick: onToggleFlag,
          iconClassName: isSelectedNodeFlagged ? 'fill-current' : undefined,
          className: isSelectedNodeFlagged
            ? 'border-yellow-700 bg-yellow-900/20 text-yellow-500 hover:border-yellow-600 hover:text-yellow-400'
            : undefined,
        },
        {
          id: 'entity-hide',
          label: isSelectedNodeHidden ? 'Unhide node' : 'Hide node',
          icon: EyeOff,
          iconOnly: true,
          onClick: onToggleHide,
          className: isSelectedNodeHidden
            ? 'border-zinc-500 bg-zinc-900/50 text-white hover:border-white hover:text-white'
            : undefined,
        },
        {
          id: 'entity-delete',
          label: selectedNodeDeleteLabel,
          icon: Trash2,
          iconOnly: true,
          onClick: onDeleteNode,
          className:
            'osint-danger-inline hover:border-[color:var(--osint-danger-soft-border)] hover:bg-[color:var(--osint-danger-soft-bg)]',
        },
      ]
    : [];
  return (
    <div
      className={`osint-panel-shell ${isOpen ? 'w-96' : 'w-0'} transition-all duration-300 bg-black/95 backdrop-blur-md border-l border-zinc-800 flex-shrink-0 overflow-hidden flex flex-col shadow-2xl z-20`}
    >
      {!mode && (
        <div className="flex h-full flex-col">
          <div className="flex flex-shrink-0 items-start border-b border-zinc-800 bg-zinc-900/30 p-4">
            <div className="min-w-0">
              <div className="osint-meta-label mb-1">Inspector</div>
              <h3 className="osint-panel-title">No Item Selected</h3>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-6">
            <div className="osint-raised-surface max-w-xs p-5 text-center">
              <div className="osint-meta-label mb-3">Inspector Ready</div>
              <p className="osint-body-small">
                Select a node, report, or saved signal to inspect details here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADLINE MODE --- */}
      {mode === 'HEADLINE' && selectedHeadline && (
        <div className="flex flex-col h-full">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex justify-between items-start flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="osint-eyebrow">Inspector</div>
                <h3
                  className="mt-1 osint-panel-title truncate"
                  title={selectedHeadline.source}
                >
                  {selectedHeadline.source}
                </h3>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="osint-meta-label">{selectedHeadline.type} Signal</span>
                  <span className="osint-meta-label-strong border border-green-900 bg-green-900/20 px-1.5 py-0.5 text-green-500">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
            <InspectorActionRow actions={headlineActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="osint-raised-surface p-4 relative group">
              <h4 className="osint-meta-label mb-2">Captured Content</h4>
              <p className="osint-body-small">
                &quot;{selectedHeadline.content}&quot;
              </p>
              <div className="osint-body-quiet mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span>TS: {selectedHeadline.timestamp}</span>
              </div>
            </div>
            {selectedHeadline.url && (
              <a
                href={selectedHeadline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="osint-raised-surface flex items-center justify-between p-4 hover:border-osint-primary hover:bg-zinc-900 transition-all group"
              >
                <div className="flex items-center overflow-hidden">
                  <Globe className="w-4 h-4 text-zinc-500 mr-3 group-hover:text-osint-primary" />
                  <span className="osint-meta-value truncate group-hover:text-white">
                    {selectedHeadline.url}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
              </a>
            )}
          </div>

        </div>
      )}

      {/* --- REPORT MODE --- */}
      {mode === 'REPORT' && selectedReport && (
        <div className="flex flex-col h-full">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex justify-between items-start flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="osint-eyebrow">Inspector</div>
                <EditableTitle
                  value={selectedReport.topic}
                  onSave={(newTitle) => onReportSave(selectedReport, newTitle)}
                  className="mt-1 osint-panel-title leading-tight"
                  inputClassName="mt-1 osint-panel-title leading-tight"
                />
                <div className="mt-2 osint-meta-label">Artifact</div>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
            <InspectorActionRow actions={reportActions} />
          </div>

          <div className={`${CHROME_RAIL_BODY_CLASS} p-2`}>
            <div className={CHROME_NESTED_ITEM_CLASS}>
              <h4 className="osint-meta-label mb-2">Executive Summary</h4>
              <p className="osint-body-small line-clamp-6">
                {selectedReport.summary.substring(0, 300)}...
              </p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <Accordion
                title="Entities"
                count={selectedReport.entities.length}
                icon={User}
                isOpen={inspectorAccordions.reportEntities}
                onToggle={() => toggleAccordion('reportEntities')}
                className={getRailAccordionClassName(inspectorAccordions.reportEntities)}
                contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-1">
                  {selectedReport.entities.length === 0 && (
                    <p className="osint-body-quiet px-2 py-1">No entities found.</p>
                  )}
                  {selectedReport.entities.map((e, idx) => {
                    const normalizedEntity =
                      typeof e === 'string' ? { name: e, type: 'UNKNOWN' as const } : e;
                    return (
                      <button
                        key={idx}
                        disabled
                        className={`${CHROME_COMPACT_NESTED_ITEM_BUTTON_CLASS} flex cursor-default items-center gap-2`}
                        title={normalizedEntity.name}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getEntityToneClass(normalizedEntity.type)} entity-tone-dot`}
                        />
                        <span className="truncate osint-meta-value">{normalizedEntity.name}</span>
                      </button>
                    );
                  })}
                </div>
              </Accordion>

              <Accordion
                title={selectedReportLabelProfile.followUpLabel}
                count={selectedReportFollowUps.length}
                icon={Lightbulb}
                isOpen={inspectorAccordions.reportLeads}
                onToggle={() => toggleAccordion('reportLeads')}
                className={getRailAccordionClassName(inspectorAccordions.reportLeads)}
                contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-1">
                  {selectedReportFollowUps.length === 0 && (
                    <p className="osint-body-quiet px-2 py-1">{`No ${selectedReportLabelProfile.followUpLabel.toLowerCase()} found.`}</p>
                  )}
                  {selectedReportFollowUps.map((followUp, idx) => (
                    <div key={idx} className={`${CHROME_COMPACT_NESTED_ITEM_CLASS} space-y-2`}>
                      <p className="osint-meta-value leading-snug text-zinc-300">{followUp}</p>
                      <div className="flex">
                        <button
                          onClick={() => {
                            onInvestigate(followUp);
                            onClose();
                          }}
                          className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                        >
                          Investigate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Accordion>

              <Accordion
                title="Sources"
                count={selectedReport.sources?.length || 0}
                icon={Globe}
                isOpen={inspectorAccordions.reportSources}
                onToggle={() => toggleAccordion('reportSources')}
                className={getRailAccordionClassName(inspectorAccordions.reportSources)}
                contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-1">
                  {(!selectedReport.sources || selectedReport.sources.length === 0) && (
                    <p className="osint-body-quiet px-2 py-1">No sources found.</p>
                  )}
                  {selectedReport.sources?.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${CHROME_COMPACT_NESTED_ITEM_BUTTON_CLASS} block truncate`}
                      title={s.title || s.url}
                    >
                      <Link2 className="mr-1 inline h-3 w-3" />
                      <span className="osint-body-quiet text-zinc-400">
                        {s.title || s.url}
                      </span>
                    </a>
                  ))}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      )}

      {/* --- ENTITY MODE --- */}
      {mode === 'ENTITY' && selectedEntity && (
        <div className="flex flex-col h-full">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex justify-between items-start flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div
                className={`p-2 border flex-shrink-0 ${selectedEntityToneClass} entity-tone-icon-panel`}
              >
                {selectedNodeType === 'PERSON' ? (
                  <User className="w-5 h-5" />
                ) : selectedNodeType === 'ORGANIZATION' ? (
                  <Building2 className="w-5 h-5" />
                ) : selectedNodeType === 'SOURCE' ? (
                  <Globe className="w-5 h-5" />
                ) : (
                  <Network className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="osint-eyebrow">Inspector</div>
                <EditableTitle
                  value={selectedEntity}
                  onSave={(newName) => onEntitySave(selectedEntity, newName)}
                  className="mt-1 osint-panel-title leading-tight"
                  inputClassName="mt-1 osint-panel-title leading-tight"
                />
                <div className="mt-2 osint-meta-label">
                  {selectedNodeType === 'SOURCE'
                    ? 'Source Node'
                    : selectedNodeType === 'UNKNOWN'
                      ? 'Knowledge Node'
                      : `${selectedNodeType} Entity`}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
            <InspectorActionRow actions={entityActions} />
          </div>

          <div className={`${CHROME_RAIL_BODY_CLASS} p-2`}>
            {(() => {
              const details = getEntityDetails(selectedEntity);
              return (
                <>
                  {(details?.role || details?.sentiment) && (
                    <div className="osint-raised-surface p-4 space-y-3">
                      {details.role && (
                        <div>
                          <div className="osint-meta-label mb-1">Role</div>
                          <div className="osint-body-small">{details.role}</div>
                        </div>
                      )}
                      {details.sentiment && (
                        <div>
                          <div className="osint-meta-label mb-1">Sentiment</div>
                          <span
                            className={`osint-meta-label inline-flex border px-2 py-1 ${details.sentiment === 'NEGATIVE' ? 'border-osint-danger/40 osint-danger-text bg-osint-danger/10' : details.sentiment === 'POSITIVE' ? 'border-green-500 text-green-500' : 'border-zinc-600 text-zinc-400'}`}
                          >
                            {details.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <Accordion
                title="Report Mentions"
                icon={FileText}
                isOpen={inspectorAccordions.mentions}
                onToggle={() => toggleAccordion('mentions')}
                className={getRailAccordionClassName(inspectorAccordions.mentions)}
                contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-1">
                  {getEntityMentions(selectedEntity).length > 0 ? (
                    getEntityMentions(selectedEntity).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => onOpenReport(r)}
                        className={`${CHROME_COMPACT_NESTED_ITEM_BUTTON_CLASS} group flex items-center gap-2`}
                      >
                        <FileText className="osint-menu-item-icon h-3 w-3 text-zinc-600 group-hover:text-osint-primary" />
                        <span className="truncate osint-meta-value">{r.topic}</span>
                      </button>
                    ))
                  ) : (
                    <p className="osint-body-quiet p-2">No direct mentions found.</p>
                  )}
                </div>
              </Accordion>

              <Accordion
                title="Network Connections"
                icon={Network}
                isOpen={inspectorAccordions.connections}
                onToggle={() => toggleAccordion('connections')}
                className={getRailAccordionClassName(inspectorAccordions.connections)}
                contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
              >
                <div className="space-y-1">
                  {getEntityConnections(selectedEntity).length > 0 ? (
                    getEntityConnections(selectedEntity).map((conn, idx) => (
                      <div
                        key={idx}
                        className={`${CHROME_COMPACT_NESTED_ITEM_CLASS} flex items-center justify-between gap-3`}
                      >
                        <div className="flex max-w-[70%] items-center truncate">
                          {conn.entity.type === 'PERSON' ? (
                            <User
                              className={`mr-2 h-3 w-3 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                            />
                          ) : conn.entity.type === 'ORGANIZATION' ? (
                            <Building2
                              className={`mr-2 h-3 w-3 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                            />
                          ) : (
                            <Shapes
                              className={`mr-2 h-3 w-3 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                            />
                          )}
                          <span className="truncate osint-meta-value" title={conn.entity.name}>
                            {conn.entity.name}
                          </span>
                        </div>
                        <span className="osint-meta-label rounded-sm bg-zinc-800 px-1.5 py-0.5">
                          {conn.count} Links
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="osint-body-quiet p-2">No connections established.</p>
                  )}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
