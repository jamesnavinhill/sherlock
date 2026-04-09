import React, { useState } from 'react';
import {
  EyeOff,
  FolderOpen,
  Link2,
  MessageSquare,
  Microscope,
  Newspaper,
  Search,
  Shapes,
  Star,
  Trash2,
} from 'lucide-react';

import type { Artifact, Entity, Headline } from '../../../types';
import type { AppIconId } from '@/lib/appIcons';
import { AppIcon, getDefaultGraphNodeIconId } from '@/lib/appIcons';
import { IconPickerOverlay } from '@/components/ui/IconPickerOverlay';
import { EditableTitle } from '../../ui/EditableTitle';
import type { InspectorActionItem } from '../../ui/InspectorActionRow';
import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
} from '../../ui/chrome';
import { PANEL_SECTION_ICONS } from '../../ui/panelSectionIcons';
import { getArtifactFollowUps, getFollowUpText, getLabelProfileById } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';
import { cleanEntityName } from '../../../utils/text';
import { GlobalInspectorPanel } from '../Inspector/GlobalInspectorPanel';
import type { GlobalInspectorSection } from '../Inspector/globalInspectorTypes';
import {
  buildEntityInspectorSections,
  buildHeadlineInspectorSections,
} from '../Inspector/sharedInspectorSectionBuilders';
import { useExclusivePanelSections } from '../shared/useExclusivePanelSections';
import type { GraphNode } from './GraphCanvas';

type InvestigationContext = { topic: string; summary: string };

interface NodeInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ENTITY' | 'HEADLINE' | 'REPORT' | null;
  selectedNode: GraphNode | null;
  selectedEntity: string | null;
  selectedHeadline: Headline | null;
  selectedReport: Artifact | null;
  reports: Artifact[];
  hiddenNodeIds: Set<string>;
  flaggedNodeIds: Set<string>;
  onEntitySave: (oldName: string, newName: string) => void;
  onReportSave: (report: Artifact, newTitle: string) => void;
  onToggleFlag: () => void;
  onToggleHide: () => void;
  onDeleteNode: () => void;
  onSetManualNodeIcon: (iconId: AppIconId | null) => void;
  onInvestigate: (topic: string, context?: InvestigationContext) => void;
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
  onSetManualNodeIcon,
  onInvestigate,
  onOpenReport,
  onOpenEntityChat,
  onOpenReportChat,
  onOpenHeadlineChat,
  onPlaceEntityOnBoard,
  onPlaceReportOnBoard,
  onPlaceHeadlineOnBoard,
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const entitySectionState = useExclusivePanelSections(['details', 'mentions', 'connections'] as const, {
    initialOpenSection: 'details',
  });
  const headlineSectionState = useExclusivePanelSections(['content', 'source'] as const, {
    initialOpenSection: 'content',
  });
  const reportSectionState = useExclusivePanelSections(
    ['summary', 'entities', 'followUps', 'sources'] as const,
    {
      initialOpenSection: 'summary',
    }
  );

  const getEntityDetails = (entityName: string): Entity | null => {
    const cleanName = cleanEntityName(entityName);
    for (const report of reports) {
      for (const reportEntity of report.entities) {
        const reportEntityName =
          typeof reportEntity === 'string' ? reportEntity : reportEntity.name;
        if (cleanEntityName(reportEntityName) === cleanName && typeof reportEntity !== 'string') {
          return reportEntity;
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
      (report) =>
        (report.entities || []).some((entity) => {
          const entityNameCandidate = typeof entity === 'string' ? entity : entity.name;
          return cleanEntityName(entityNameCandidate) === cleanName;
        }) ||
        (report.sources || []).some(
          (source) =>
            cleanEntityName(source.title) === cleanName ||
            cleanEntityName(source.url || '').includes(cleanName)
        ) ||
        reportTextIncludes(report, cleanName)
    );
  };

  const getEntityConnections = (entityName: string) => {
    const cleanName = cleanEntityName(entityName);
    const connectedEntities = new Map<string, { entity: Entity; count: number }>();
    const mentionIds = new Set(getEntityMentions(entityName).map((report) => report.id));

    reports.forEach((report) => {
      const hasEntity = !!report.id && mentionIds.has(report.id);
      if (!hasEntity) return;

      (report.entities || []).forEach((entity) => {
        const entityNameCandidate = typeof entity === 'string' ? entity : entity.name;
        if (cleanEntityName(entityNameCandidate) === cleanName) return;

        const existing = connectedEntities.get(entityNameCandidate) || {
          entity:
            typeof entity === 'string'
              ? { name: entityNameCandidate, type: 'UNKNOWN' as const }
              : entity,
          count: 0,
        };
        existing.count += 1;
        connectedEntities.set(entityNameCandidate, existing);
      });
    });

    return Array.from(connectedEntities.values()).sort((left, right) => right.count - left.count);
  };

  const selectedEntityToneClass = selectedEntity
    ? getEntityToneClass(getNodeType(selectedEntity))
    : getEntityToneClass('UNKNOWN');
  const selectedEntityDetails =
    mode === 'ENTITY' && selectedEntity ? getEntityDetails(selectedEntity) : null;
  const selectedEntityMentions =
    mode === 'ENTITY' && selectedEntity ? getEntityMentions(selectedEntity) : [];
  const selectedEntityConnections =
    mode === 'ENTITY' && selectedEntity ? getEntityConnections(selectedEntity) : [];
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
  const selectedNodeResolvedIconId =
    selectedNode?.iconId ||
    getDefaultGraphNodeIconId({
      type: selectedNode?.type || (mode === 'REPORT' ? 'REPORT' : 'ENTITY'),
      subtype: selectedNode?.subtype || (mode === 'ENTITY' ? selectedNodeType : undefined),
    });

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

  const manualIconButton =
    selectedNode?.isManual && (mode === 'ENTITY' || mode === 'REPORT') ? (
      <button
        type="button"
        onClick={() => setShowIconPicker(true)}
        className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400 transition hover:border-zinc-600 hover:text-white"
      >
        <Shapes className="h-3.5 w-3.5" />
        Icon
      </button>
    ) : null;

  const entitySections: GlobalInspectorSection[] =
    mode === 'ENTITY' && selectedEntity
      ? buildEntityInspectorSections({
          entityName: selectedEntity,
          details: selectedEntityDetails,
          detailsTitle: 'Node Summary',
          emptyDetailsMessage: 'No additional entity metadata available.',
          mentionsTitle: 'Report Mentions',
          mentions: selectedEntityMentions,
          connections: selectedEntityConnections,
          openSection: entitySectionState.openSection || 'details',
          toggleSection: entitySectionState.toggleSection,
          onOpenMention: onOpenReport,
          getMentionLabel: (report) => report.topic,
        })
      : [];

  const headlineSections: GlobalInspectorSection[] =
    mode === 'HEADLINE' && selectedHeadline
      ? buildHeadlineInspectorSections({
          headline: selectedHeadline,
          openSection: headlineSectionState.openSection || 'content',
          toggleSection: headlineSectionState.toggleSection,
        })
      : [];

  const reportSections: GlobalInspectorSection[] =
    mode === 'REPORT' && selectedReport
      ? [
          {
            id: 'summary',
            title: 'Executive Summary',
            isOpen: reportSectionState.openSection === 'summary',
            onToggle: () => reportSectionState.toggleSection('summary'),
            content: (
              <div className="osint-raised-surface p-4">
                <p className="osint-body-small line-clamp-6">
                  {selectedReport.summary.substring(0, 300)}...
                </p>
              </div>
            ),
          },
          {
            id: 'entities',
            title: 'Entities',
            count: selectedReport.entities.length,
            icon: PANEL_SECTION_ICONS.entities,
            isOpen: reportSectionState.openSection === 'entities',
            onToggle: () => reportSectionState.toggleSection('entities'),
            content: (
              <div className="space-y-1">
                {selectedReport.entities.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet">No entities found.</p>
                ) : (
                  selectedReport.entities.map((entity, index) => {
                    const normalizedEntity =
                      typeof entity === 'string' ? { name: entity, type: 'UNKNOWN' as const } : entity;
                    return (
                      <div
                        key={`${normalizedEntity.name}-${index}`}
                        className={`${CHROME_THIN_NESTED_ITEM_CLASS} flex items-center gap-2`}
                        title={normalizedEntity.name}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getEntityToneClass(normalizedEntity.type)} entity-tone-dot`}
                        />
                        <span className="truncate osint-meta-value">{normalizedEntity.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            ),
          },
          {
            id: 'followUps',
            title: selectedReportLabelProfile.followUpLabel,
            count: selectedReportFollowUps.length,
            icon: PANEL_SECTION_ICONS.followUps,
            isOpen: reportSectionState.openSection === 'followUps',
            onToggle: () => reportSectionState.toggleSection('followUps'),
            content: (
              <div className="space-y-1">
                {selectedReportFollowUps.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet">{`No ${selectedReportLabelProfile.followUpLabel.toLowerCase()} found.`}</p>
                ) : (
                  selectedReportFollowUps.map((followUp, index) => (
                    <div key={`${followUp}-${index}`} className={`${CHROME_THIN_NESTED_ITEM_CLASS} space-y-2`}>
                      <p className="osint-meta-value leading-snug text-zinc-300">{followUp}</p>
                      <div className={getChromeThinActionRowClassName(1)}>
                        <button
                          type="button"
                          onClick={() => {
                            onInvestigate(followUp);
                            onClose();
                          }}
                          className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ),
          },
          {
            id: 'sources',
            title: 'Sources',
            count: selectedReport.sources?.length || 0,
            icon: PANEL_SECTION_ICONS.sources,
            isOpen: reportSectionState.openSection === 'sources',
            onToggle: () => reportSectionState.toggleSection('sources'),
            content: (
              <div className="space-y-1">
                {!selectedReport.sources || selectedReport.sources.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet">No sources found.</p>
                ) : (
                  selectedReport.sources.map((source, index) => (
                    <a
                      key={`${source.url}-${index}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} block truncate`}
                      title={source.title || source.url}
                    >
                      <Link2 className="mr-1 inline h-3 w-3" />
                      <span className="osint-body-quiet text-zinc-400">{source.title || source.url}</span>
                    </a>
                  ))
                )}
              </div>
            ),
          },
        ]
      : [];

  return (
    <>
      {mode === 'ENTITY' && selectedEntity ? (
        <GlobalInspectorPanel
          isOpen={isOpen}
          onClose={onClose}
          title={
            <EditableTitle
              value={selectedEntity}
              onSave={(newName) => onEntitySave(selectedEntity, newName)}
              className="leading-tight"
              inputClassName="leading-tight"
            />
          }
          subtitle={
            selectedNodeType === 'SOURCE'
              ? 'Source Node'
              : selectedNodeType === 'UNKNOWN'
                ? 'Knowledge Node'
                : `${selectedNodeType} Entity`
          }
          headerIcon={
            <div className={`border p-2 ${selectedEntityToneClass} entity-tone-icon-panel`}>
              <AppIcon iconId={selectedNodeResolvedIconId} size={20} strokeWidth={1.9} />
            </div>
          }
          headerActions={manualIconButton}
          actionItems={entityActions}
          actionRowLayout="grid"
          actionRowGridColumns={3}
          sections={entitySections}
        />
      ) : mode === 'HEADLINE' && selectedHeadline ? (
        <GlobalInspectorPanel
          isOpen={isOpen}
          onClose={onClose}
          title={<span title={selectedHeadline.source}>{selectedHeadline.source}</span>}
          subtitle={
            <span className="flex items-center gap-2">
              <span>{selectedHeadline.type} Signal</span>
              <span className="rounded-sm border border-green-900 bg-green-900/20 px-1.5 py-0.5 text-green-500">
                Live
              </span>
            </span>
          }
          headerIcon={
            <div className="border border-zinc-700 bg-zinc-800/50 p-2 text-white">
              <Newspaper className="h-5 w-5" />
            </div>
          }
          actionItems={headlineActions}
          actionRowLayout="grid"
          actionRowGridColumns={3}
          sections={headlineSections}
        />
      ) : mode === 'REPORT' && selectedReport ? (
        <GlobalInspectorPanel
          isOpen={isOpen}
          onClose={onClose}
          title={
            <EditableTitle
              value={selectedReport.topic}
              onSave={(newTitle) => onReportSave(selectedReport, newTitle)}
              className="leading-tight"
              inputClassName="leading-tight"
            />
          }
          subtitle="Artifact"
          headerIcon={
            <div className="border border-zinc-700 bg-zinc-800/50 p-2 text-white">
              <AppIcon iconId={selectedNodeResolvedIconId} size={20} strokeWidth={1.9} />
            </div>
          }
          headerActions={manualIconButton}
          actionItems={reportActions}
          actionRowLayout="grid"
          actionRowGridColumns={3}
          sections={reportSections}
        />
      ) : (
        <GlobalInspectorPanel
          isOpen={isOpen}
          onClose={onClose}
          title="No Item Selected"
          emptyState={{
            title: 'No Item Selected',
            description: 'Select a node, report, or saved signal to inspect details here.',
          }}
        />
      )}

      <IconPickerOverlay
        isOpen={showIconPicker && !!selectedNode?.isManual}
        title="Manual Node Icon"
        description="Choose an icon override for this manual node. Reset to default anytime."
        selectedIconId={selectedNode?.iconId || null}
        allowDefault
        defaultLabel="Use Default Node Icon"
        onClose={() => setShowIconPicker(false)}
        onSelect={(iconId) => {
          onSetManualNodeIcon(iconId);
          setShowIconPicker(false);
        }}
      />
    </>
  );
};
