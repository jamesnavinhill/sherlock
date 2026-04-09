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
  MessageSquare,
  Shapes,
  Microscope,
} from 'lucide-react';
import type { Entity, Headline, Artifact } from '../../../types';
import { EditableTitle } from '../../ui/EditableTitle';
import { Accordion } from '../../ui/Accordion';
import { InspectorActionRow, type InspectorActionItem } from '../../ui/InspectorActionRow';
import {
  CHROME_PANEL_ACTION_ROW_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
} from '../../ui/chrome';
import { getEntityToneClass } from '../../../utils/entityPalette';
import { sanitizeDisplayTitle } from '../../../domain';
import { getArtifactTypeLabel } from './artifactViewerPresentation';

interface InspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ENTITY' | 'HEADLINE' | 'REPORT' | null;
  report: Artifact | null;
  workspaceTitle?: string | null;
  entity: Entity | null;
  headline: Headline | null;
  reports: Artifact[]; // For mentions/connections
  onEntitySave: (newName: string) => void;
  onFlagEntity: (entityName: string) => void;
  onInvestigateEntity: (entityName: string) => void;
  onInvestigateHeadline: () => void;
  onOpenEntityChat: (entityName: string) => void;
  onOpenHeadlineChat: () => void;
  onOpenReportChat: () => void;
  onPlaceEntityOnBoard: (entityName: string) => void;
  onPlaceHeadlineOnBoard: () => void;
  onPlaceReportOnBoard: () => void;
  onNavigate: (artifactId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  onClose,
  mode,
  report,
  workspaceTitle,
  entity,
  headline,
  reports,
  onEntitySave,
  onFlagEntity,
  onInvestigateEntity,
  onInvestigateHeadline,
  onOpenEntityChat,
  onOpenHeadlineChat,
  onOpenReportChat,
  onPlaceEntityOnBoard,
  onPlaceHeadlineOnBoard,
  onPlaceReportOnBoard,
  onNavigate,
}) => {
  const entityToneClass = entity ? getEntityToneClass(entity.type) : getEntityToneClass('UNKNOWN');
  const reportDisplayTitle = report ? sanitizeDisplayTitle(report.topic) : '';
  const reportArtifactTypeLabel = report ? getArtifactTypeLabel(report.artifactType) : '';
  const entityTypeLabel = entity ? entity.type.replace(/_/g, ' ') : 'UNKNOWN';
  const entityActions: InspectorActionItem[] = entity
    ? [
        {
          id: 'entity-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: () => onOpenEntityChat(entity.name),
        },
        {
          id: 'entity-investigate',
          label: 'Run',
          icon: Microscope,
          onClick: () => onInvestigateEntity(entity.name),
        },
        {
          id: 'entity-google',
          label: 'Google',
          icon: Search,
          href: `https://www.google.com/search?q=${encodeURIComponent(entity.name)}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        {
          id: 'entity-flag',
          label: 'Star',
          icon: Star,
          iconOnly: true,
          onClick: () => onFlagEntity(entity.name),
        },
        {
          id: 'entity-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: () => onPlaceEntityOnBoard(entity.name),
        },
      ]
    : [];
  const headlineActions: InspectorActionItem[] = headline
    ? [
        {
          id: 'headline-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: onOpenHeadlineChat,
        },
        {
          id: 'headline-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: onPlaceHeadlineOnBoard,
        },
        {
          id: 'headline-investigate',
          label: 'Run',
          icon: Microscope,
          onClick: onInvestigateHeadline,
        },
      ]
    : [];
  const reportActions: InspectorActionItem[] = report
    ? [
        {
          id: 'report-chat',
          label: 'Chat',
          icon: MessageSquare,
          onClick: onOpenReportChat,
        },
        {
          id: 'report-board',
          label: 'Canvas',
          icon: Shapes,
          onClick: onPlaceReportOnBoard,
        },
      ]
    : [];
  // --- Internal State ---
  const [inspectorAccordions, setInspectorAccordions] = useState({
    mentions: false,
    connections: false,
  });

  const toggleAccordion = (section: keyof typeof inspectorAccordions) => {
    setInspectorAccordions((prev) =>
      Object.fromEntries(
        Object.keys(prev).map((key) => [key, key === section ? !prev[section] : false])
      ) as typeof prev
    );
  };

  // --- Helper Logic (Moved from Parent) ---

  // Get Reports mentioning this entity
  const getEntityMentions = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    return reports.filter((r) =>
      (r.entities || []).some((e) => {
        const name = typeof e === 'string' ? e : e.name;
        return name.trim().toLowerCase() === cleanName;
      })
    );
  };

  // Calculate connections based on co-occurrence in reports
  const getEntityConnections = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    const connectedEntities = new Map<string, { entity: Entity; count: number }>();

    reports.forEach((r) => {
      const hasEntity = (r.entities || []).some((e) => {
        const name = typeof e === 'string' ? e : e.name;
        return name.trim().toLowerCase() === cleanName;
      });

      if (hasEntity) {
        (r.entities || []).forEach((e) => {
          const name = typeof e === 'string' ? e : e.name;
          if (name.trim().toLowerCase() !== cleanName) {
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

  return (
    <div
      className={`osint-panel-shell ${isOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 lg:relative lg:z-0 lg:flex-shrink-0 transition-all duration-300 bg-black/95 backdrop-blur-md border-l border-zinc-800 overflow-hidden flex flex-col shadow-2xl lg:shadow-none ${isOpen ? 'lg:w-96' : 'lg:w-0'}`}
    >
      {/* --- ENTITY INSPECTOR MODE --- */}
      {mode === 'ENTITY' && entity && (
        <div className="flex flex-col h-full">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex justify-between items-start flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className={`p-2 border flex-shrink-0 ${entityToneClass} entity-tone-icon-panel`}>
                {entity.type === 'PERSON' && <User className="w-5 h-5" />}
                {entity.type === 'ORGANIZATION' && <Building2 className="w-5 h-5" />}
                {entity.type === 'UNKNOWN' && <Network className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <div className="osint-eyebrow">Inspector</div>
                  <span className="rounded-sm border border-zinc-700 bg-zinc-900/70 px-1.5 py-0.5 osint-meta-label text-zinc-300">
                    {entityTypeLabel}
                  </span>
                </div>
                <EditableTitle
                  value={entity.name}
                  onSave={onEntitySave}
                  className="mt-1 osint-panel-title text-white leading-tight"
                  inputClassName="mt-1 osint-panel-title text-white leading-tight"
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

          <div className={CHROME_PANEL_ACTION_ROW_CLASS}>
            <InspectorActionRow actions={entityActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24 custom-scrollbar">
            {(entity.role || entity.sentiment) && (
            <div className="osint-raised-surface p-4 space-y-3">
                {entity.role && (
                  <div>
                    <div className="mb-1 osint-meta-label">Role</div>
                    <div className="osint-body-small text-zinc-300">{entity.role}</div>
                  </div>
                )}
                {entity.sentiment && (
                  <div>
                    <div className="mb-1 osint-meta-label">Sentiment</div>
                    <span
                      className={`inline-flex items-center px-2 py-1 border osint-meta-label ${entity.sentiment === 'NEGATIVE' ? 'border-osint-danger/40 osint-danger-text bg-osint-danger/10' : entity.sentiment === 'POSITIVE' ? 'border-green-500 text-green-500' : 'border-zinc-600 text-zinc-400'}`}
                    >
                      {entity.sentiment}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mentions Accordion */}
            <Accordion
              title="Artifact Mentions"
              icon={FileText}
              isOpen={inspectorAccordions.mentions}
              onToggle={() => toggleAccordion('mentions')}
            >
              <div className="space-y-1">
                {getEntityMentions(entity.name).length > 0 ? (
                  getEntityMentions(entity.name).map((r) => (
                    <button
                      key={r.id || r.topic}
                      onClick={() => r.id && onNavigate(r.id)}
                      className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} border-l-2 border-transparent text-zinc-400 transition-all hover:border-osint-primary hover:bg-zinc-900 hover:text-white group flex items-center`}
                      title={sanitizeDisplayTitle(r.topic)}
                    >
                      <FileText className="w-3 h-3 mr-2 text-zinc-600 group-hover:text-osint-primary" />
                      <span className="truncate osint-meta-value text-zinc-300 group-hover:text-white">
                        {sanitizeDisplayTitle(r.topic)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-2 osint-body-quiet">No direct mentions found.</p>
                )}
              </div>
            </Accordion>

            {/* Connections Accordion */}
            <Accordion
              title="Network Connections"
              icon={Network}
              isOpen={inspectorAccordions.connections}
              onToggle={() => toggleAccordion('connections')}
            >
              <div className="space-y-1">
                {getEntityConnections(entity.name).length > 0 ? (
                  getEntityConnections(entity.name).map((conn, idx) => (
                    <div
                      key={idx}
                      className={`${CHROME_THIN_NESTED_ITEM_CLASS} flex items-center justify-between gap-3 border-b border-zinc-800/50 bg-zinc-900/20 last:border-0 hover:bg-zinc-900/40`}
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
                          className="truncate osint-meta-value text-zinc-400"
                          title={conn.entity.name}
                        >
                          {conn.entity.name}
                        </span>
                      </div>
                      <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 osint-meta-label text-zinc-500">
                        {conn.count} Links
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-2 osint-body-quiet">No connections established.</p>
                )}
              </div>
            </Accordion>
          </div>
        </div>
      )}

      {/* --- HEADLINE INSPECTOR MODE --- */}
      {mode === 'HEADLINE' && headline && (
        <div className="flex flex-col h-full">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex justify-between items-start flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <Newspaper className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="osint-eyebrow">Inspector</div>
                <h3
                  className="mt-1 truncate osint-panel-title text-white"
                  title={headline.source}
                >
                  {headline.source}
                </h3>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="osint-meta-label">{headline.type} Signal</span>
                  <span className="border border-green-900 bg-green-900/20 px-1.5 py-0.5 osint-meta-label text-green-500">
                    Live
                  </span>
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
            <InspectorActionRow actions={headlineActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="osint-raised-surface p-6 relative group">
              <h4 className="mb-2 osint-meta-label">Captured Content</h4>
              <p className="osint-body-small text-zinc-300">
                &quot;{headline.content}&quot;
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 osint-body-quiet">
                <span>TS: {headline.timestamp}</span>
              </div>
            </div>

            {headline.url && (
              <a
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="osint-raised-surface flex items-center justify-between p-4 hover:border-osint-primary hover:bg-zinc-900 transition-all group"
              >
                <div className="flex items-center overflow-hidden">
                  <Globe className="w-4 h-4 text-zinc-500 mr-3 group-hover:text-osint-primary" />
                  <span className="truncate osint-meta-value text-zinc-400 group-hover:text-white">
                    {headline.url}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
              </a>
            )}
          </div>

        </div>
      )}

      {mode === 'REPORT' && report && (
        <div className="flex h-full flex-col">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-start justify-between flex-shrink-0`}>
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <div className="osint-eyebrow">Inspector</div>
                <h3 className="osint-panel-title text-white leading-tight">
                  {reportDisplayTitle}
                </h3>
                <div className="mt-2 osint-meta-label">Current Artifact</div>
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
            <InspectorActionRow actions={reportActions} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 custom-scrollbar">
            <div className="osint-raised-surface p-4 space-y-3">
              {workspaceTitle ? (
                <div>
                  <div className="mb-1 osint-meta-label">Workspace</div>
                  <div className="osint-body-small text-zinc-300">{workspaceTitle}</div>
                </div>
              ) : null}
              {report.artifactType ? (
                <div>
                  <div className="mb-1 osint-meta-label">Artifact Type</div>
                  <div className="osint-body-small text-zinc-300">{reportArtifactTypeLabel}</div>
                </div>
              ) : null}
              <div>
                <div className="mb-1 osint-meta-label">Summary</div>
                <div className="osint-body-small text-zinc-300">
                  {report.summary || 'No summary saved for this artifact yet.'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="osint-raised-surface-subtle p-3">
                <div className="mb-1 osint-meta-label">Sections</div>
                <div className="osint-meta-value text-lg text-white">{report.sections?.length || 0}</div>
              </div>
              <div className="osint-raised-surface-subtle p-3">
                <div className="mb-1 osint-meta-label">Evidence</div>
                <div className="osint-meta-value text-lg text-white">{report.evidence?.length || 0}</div>
              </div>
              <div className="osint-raised-surface-subtle p-3">
                <div className="mb-1 osint-meta-label">Entities</div>
                <div className="osint-meta-value text-lg text-white">{report.entities?.length || 0}</div>
              </div>
              <div className="osint-raised-surface-subtle p-3">
                <div className="mb-1 osint-meta-label">Sources</div>
                <div className="osint-meta-value text-lg text-white">{report.sources?.length || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!mode && (
        <div className="flex h-full flex-col">
          <div className={`${CHROME_PANEL_HEADER_CLASS} flex items-start justify-between flex-shrink-0`}>
            <div className="min-w-0 pr-3">
              <div className="osint-eyebrow">Inspector</div>
              <h3 className="osint-panel-title text-white">No Item Selected</h3>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="osint-raised-surface max-w-xs p-5 text-center">
              <div className="mb-3 osint-meta-label">Inspector Ready</div>
              <p className="osint-body-small text-zinc-300">
                Select an entity, saved signal, or reopen the current artifact inspector here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
