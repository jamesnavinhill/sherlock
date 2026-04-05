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
import { cleanEntityName } from '../../../utils/text';
import { getEntityToneClass } from '../../../utils/entityPalette';
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
    setInspectorAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const selectedNodeType = selectedEntity ? getNodeType(selectedEntity) : 'UNKNOWN';
  const isSelectedNodeFlagged =
    !!selectedNode &&
    (flaggedNodeIds.has(selectedNode.id) || flaggedNodeIds.has(selectedNode.label));
  const isSelectedNodeHidden =
    !!selectedNode && (hiddenNodeIds.has(selectedNode.id) || hiddenNodeIds.has(selectedNode.label));
  const selectedNodeDeleteLabel = selectedNode?.isManual ? 'Delete Node' : 'Remove From Graph';
  const reportActions: InspectorActionItem[] = selectedReport
    ? [
        {
          id: 'report-chat',
          label: 'Open In Chat',
          icon: MessageSquare,
          onClick: () => onOpenReportChat(selectedReport),
        },
        {
          id: 'report-open',
          label: 'Open Full Report',
          icon: FolderOpen,
          onClick: () => onOpenReport(selectedReport),
        },
        {
          id: 'report-search',
          label: 'Search Report Topic',
          icon: Search,
          href: `https://www.google.com/search?q=${encodeURIComponent(selectedReport.topic)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          id: 'report-flag',
          label: isSelectedNodeFlagged ? 'Unstar Node' : 'Star Node',
          icon: Star,
          onClick: onToggleFlag,
          iconClassName: isSelectedNodeFlagged ? 'fill-current' : undefined,
          className: isSelectedNodeFlagged
            ? 'border-yellow-700 bg-yellow-900/20 text-yellow-500 hover:border-yellow-600 hover:text-yellow-400'
            : undefined,
        },
        {
          id: 'report-hide',
          label: isSelectedNodeHidden ? 'Unhide Node' : 'Hide Node',
          icon: EyeOff,
          onClick: onToggleHide,
          className: isSelectedNodeHidden
            ? 'border-zinc-500 bg-zinc-900/50 text-white hover:border-white hover:text-white'
            : undefined,
        },
        {
          id: 'report-delete',
          label: selectedNodeDeleteLabel,
          icon: Trash2,
          onClick: onDeleteNode,
          className:
            'osint-danger-inline hover:border-[color:var(--osint-danger-soft-border)] hover:bg-[color:var(--osint-danger-soft-bg)]',
        },
      ]
    : [];
  const entityActions: InspectorActionItem[] = selectedEntity
    ? [
        {
          id: 'entity-chat',
          label: 'Open In Chat',
          icon: MessageSquare,
          onClick: () => onOpenEntityChat(selectedEntity),
        },
        {
          id: 'entity-investigate',
          label: selectedNodeType === 'SOURCE' ? 'Explore Source' : 'Investigate Entity',
          icon: Microscope,
          onClick: () => onInvestigate(selectedEntity),
        },
        {
          id: 'entity-search',
          label: 'Search Google',
          icon: Search,
          href: `https://www.google.com/search?q=${encodeURIComponent(selectedEntity)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          id: 'entity-flag',
          label: isSelectedNodeFlagged ? 'Unstar Node' : 'Star Node',
          icon: Star,
          onClick: onToggleFlag,
          iconClassName: isSelectedNodeFlagged ? 'fill-current' : undefined,
          className: isSelectedNodeFlagged
            ? 'border-yellow-700 bg-yellow-900/20 text-yellow-500 hover:border-yellow-600 hover:text-yellow-400'
            : undefined,
        },
        {
          id: 'entity-hide',
          label: isSelectedNodeHidden ? 'Unhide Node' : 'Hide Node',
          icon: EyeOff,
          onClick: onToggleHide,
          className: isSelectedNodeHidden
            ? 'border-zinc-500 bg-zinc-900/50 text-white hover:border-white hover:text-white'
            : undefined,
        },
        {
          id: 'entity-delete',
          label: selectedNodeDeleteLabel,
          icon: Trash2,
          onClick: onDeleteNode,
          className:
            'osint-danger-inline hover:border-[color:var(--osint-danger-soft-border)] hover:bg-[color:var(--osint-danger-soft-bg)]',
        },
      ]
    : [];

  return (
    <div
      className={`${isOpen ? 'w-96' : 'w-0'} transition-all duration-300 bg-black/95 backdrop-blur-md border-l border-zinc-800 flex-shrink-0 overflow-hidden flex flex-col shadow-2xl z-20`}
    >
      {/* --- HEADLINE MODE --- */}
      {mode === 'HEADLINE' && selectedHeadline && (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30 flex-shrink-0">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">
                    {selectedHeadline.type} INTEL
                  </span>
                  <span className="text-[9px] bg-green-900/20 text-green-500 border border-green-900 px-1.5 py-0.5 font-mono">
                    LIVE
                  </span>
                </div>
                <h3
                  className="text-lg font-bold text-white leading-tight font-mono truncate"
                  title={selectedHeadline.source}
                >
                  {selectedHeadline.source}
                </h3>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="bg-zinc-900/50 p-4 border border-zinc-800 relative group">
              <h4 className="text-[10px] text-zinc-500 font-mono uppercase mb-2">
                Captured Content
              </h4>
              <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                &quot;{selectedHeadline.content}&quot;
              </p>
              <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-600 font-mono">
                <span>TS: {selectedHeadline.timestamp}</span>
              </div>
            </div>
            {selectedHeadline.url && (
              <a
                href={selectedHeadline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-700 hover:border-osint-primary hover:bg-zinc-900 transition-all group"
              >
                <div className="flex items-center overflow-hidden">
                  <Globe className="w-4 h-4 text-zinc-500 mr-3 group-hover:text-osint-primary" />
                  <span className="text-xs font-mono text-zinc-400 group-hover:text-white truncate">
                    {selectedHeadline.url}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
              </a>
            )}
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 mt-auto space-y-3">
            <button
              onClick={() => {
                onOpenHeadlineChat(selectedHeadline);
                onClose();
              }}
              className="w-full py-3 border border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white transition-colors font-mono text-sm uppercase flex items-center justify-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Open In Chat
            </button>
            <button
              onClick={() => {
                onInvestigate(selectedHeadline.content);
                onClose();
              }}
              className="osint-button-primary w-full py-3 font-bold font-mono text-sm uppercase flex items-center justify-center"
            >
              <Microscope className="w-4 h-4 mr-2" /> Launch Investigation
            </button>
          </div>
        </div>
      )}

      {/* --- REPORT MODE --- */}
      {mode === 'REPORT' && selectedReport && (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30 flex-shrink-0">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">
                    INVESTIGATION REPORT
                  </span>
                </div>
                <EditableTitle
                  value={selectedReport.topic}
                  onSave={(newTitle) => onReportSave(selectedReport, newTitle)}
                  className="text-md font-bold text-white leading-tight font-mono"
                  inputClassName="text-md font-bold leading-tight"
                />
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
            <InspectorActionRow actions={reportActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            <div className="bg-zinc-900/50 p-4 border border-zinc-800">
              <h4 className="text-[10px] text-zinc-500 font-mono uppercase mb-2">
                Executive Summary
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono line-clamp-6">
                {selectedReport.summary.substring(0, 300)}...
              </p>
            </div>

            {/* Entities */}
            <Accordion
              title={`Entities (${selectedReport.entities.length})`}
              icon={User}
              isOpen={inspectorAccordions.reportEntities}
              onToggle={() => toggleAccordion('reportEntities')}
            >
              <div className="space-y-1">
                {selectedReport.entities.length === 0 && (
                  <p className="text-[10px] text-zinc-500 font-mono px-2 py-1">
                    No entities found.
                  </p>
                )}
                {selectedReport.entities.map((e, idx) => {
                  const name = typeof e === 'string' ? e : e.name;
                  return (
                    <button
                      key={idx}
                      disabled
                      className="w-full text-left p-2 hover:bg-zinc-900 text-xs font-mono text-zinc-400 hover:text-white truncate cursor-default"
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </Accordion>

            {/* Leads */}
            <Accordion
              title={`Leads (${selectedReport.leads?.length || 0})`}
              icon={Lightbulb}
              isOpen={inspectorAccordions.reportLeads}
              onToggle={() => toggleAccordion('reportLeads')}
            >
              <div className="space-y-1">
                {(!selectedReport.leads || selectedReport.leads.length === 0) && (
                  <p className="text-[10px] text-zinc-500 font-mono px-2 py-1">No leads found.</p>
                )}
                {selectedReport.leads?.map((lead, idx) => (
                  <div key={idx} className="p-2 bg-zinc-900/20 border border-zinc-800/50 mb-1">
                    <p className="text-[10px] text-zinc-400 font-mono mb-2 line-clamp-2">{lead}</p>
                    <button
                      onClick={() => {
                        onInvestigate(lead);
                        onClose();
                      }}
                      className="osint-button-primary w-full text-center py-1 text-[10px] font-bold uppercase"
                    >
                      Investigate
                    </button>
                  </div>
                ))}
              </div>
            </Accordion>

            {/* Sources */}
            <Accordion
              title={`Sources (${selectedReport.sources?.length || 0})`}
              icon={Globe}
              isOpen={inspectorAccordions.reportSources}
              onToggle={() => toggleAccordion('reportSources')}
            >
              <div className="space-y-1">
                {(!selectedReport.sources || selectedReport.sources.length === 0) && (
                  <p className="text-[10px] text-zinc-500 font-mono px-2 py-1">No sources found.</p>
                )}
                {selectedReport.sources?.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="osint-link-list-item block p-2 text-[10px] font-mono truncate border-b border-zinc-900 last:border-0"
                  >
                    <Link2 className="w-3 h-3 inline mr-1" />
                    {s.title}
                  </a>
                ))}
              </div>
            </Accordion>
          </div>
        </div>
      )}

      {/* --- ENTITY MODE --- */}
      {mode === 'ENTITY' && selectedEntity && (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30 flex-shrink-0">
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
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">
                    {selectedNodeType === 'SOURCE'
                      ? 'SOURCE NODE'
                      : selectedNodeType === 'UNKNOWN'
                        ? 'KNOWLEDGE NODE'
                        : `${selectedNodeType} ENTITY`}
                  </span>
                </div>
                <EditableTitle
                  value={selectedEntity}
                  onSave={(newName) => onEntitySave(selectedEntity, newName)}
                  className="text-base font-bold text-white leading-tight font-mono"
                  inputClassName="text-lg font-bold leading-tight"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
            <InspectorActionRow actions={entityActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(() => {
              const details = getEntityDetails(selectedEntity);
              return (
                <>
                  {(details?.role || details?.sentiment) && (
                    <div className="bg-zinc-900/50 p-4 border border-zinc-800 space-y-3">
                      {details.role && (
                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                            Role
                          </div>
                          <div className="text-sm text-zinc-300">{details.role}</div>
                        </div>
                      )}
                      {details.sentiment && (
                        <div>
                          <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                            Sentiment
                          </div>
                          <span
                            className={`text-xs uppercase font-mono px-2 py-1 border ${details.sentiment === 'NEGATIVE' ? 'border-osint-danger/40 osint-danger-text bg-osint-danger/10' : details.sentiment === 'POSITIVE' ? 'border-green-500 text-green-500' : 'border-zinc-600 text-zinc-400'}`}
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

            <Accordion
              title="Report Mentions"
              icon={FileText}
              isOpen={inspectorAccordions.mentions}
              onToggle={() => toggleAccordion('mentions')}
            >
              <div className="space-y-1">
                {getEntityMentions(selectedEntity).length > 0 ? (
                  getEntityMentions(selectedEntity).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenReport(r)}
                      className="w-full text-left p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white hover:border-osint-primary border-transparent border-l-2 transition-all flex items-center group"
                    >
                      <FileText className="w-3 h-3 mr-2 text-zinc-600 group-hover:text-osint-primary" />
                      <span className="truncate text-xs font-mono">{r.topic}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-zinc-600 text-xs font-mono p-2">No direct mentions found.</p>
                )}
              </div>
            </Accordion>

            <Accordion
              title="Network Connections"
              icon={Network}
              isOpen={inspectorAccordions.connections}
              onToggle={() => toggleAccordion('connections')}
            >
              <div className="space-y-1">
                {getEntityConnections(selectedEntity).length > 0 ? (
                  getEntityConnections(selectedEntity).map((conn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-zinc-900/20 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40"
                    >
                      <div className="flex items-center truncate max-w-[70%]">
                        {conn.entity.type === 'PERSON' ? (
                          <User
                            className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                          />
                        ) : conn.entity.type === 'ORGANIZATION' ? (
                          <Building2
                            className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                          />
                        ) : (
                          <Shapes
                            className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`}
                          />
                        )}
                        <span
                          className="text-xs font-mono text-zinc-400 truncate"
                          title={conn.entity.name}
                        >
                          {conn.entity.name}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm font-mono">
                        {conn.count} Links
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-600 text-xs font-mono p-2">No connections established.</p>
                )}
              </div>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};
