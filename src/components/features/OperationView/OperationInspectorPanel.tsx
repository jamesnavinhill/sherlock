import React from 'react';
import {
  Building2,
  FileText,
  MessageSquare,
  Microscope,
  Network,
  Newspaper,
  Search,
  Shapes,
  Star,
  User,
} from 'lucide-react';

import type { Artifact, Entity, FollowUp, Headline, LabelProfile } from '../../../types';
import { getPurposeProfileById, sanitizeDisplayTitle } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';
import { EditableTitle } from '../../ui/EditableTitle';
import type { InspectorActionItem } from '../../ui/InspectorActionRow';
import { INSPECTOR_ACTION_SHORT_LABELS } from '../../ui/inspectorActionLabels';
import { GlobalInspectorPanel } from '../Inspector/GlobalInspectorPanel';
import type { GlobalInspectorSection } from '../Inspector/globalInspectorTypes';
import {
  buildEntityInspectorSections,
  buildHeadlineInspectorSections,
} from '../Inspector/sharedInspectorSectionBuilders';
import { useExclusivePanelSections } from '../shared/useExclusivePanelSections';
import { buildArtifactViewerReportDetailRailSections } from './artifactViewerDetailRail';
import { getArtifactTypeLabel } from './artifactViewerPresentation';

interface OperationInspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'ENTITY' | 'HEADLINE' | 'REPORT' | null;
  report: Artifact | null;
  labelProfile: LabelProfile;
  workspaceTitle?: string | null;
  entity: Entity | null;
  headline: Headline | null;
  reports: Artifact[];
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
  onSelectReportEntity: (entity: Entity) => void;
  onOpenReportLead: (followUp: FollowUp) => void;
  onJumpToReportSection: (sectionId: string) => void;
  onJumpToReportEvidence: (evidenceId: string) => void;
  onNavigate: (artifactId: string) => void;
}

const renderEntityIcon = (entityType: Entity['type']) => {
  if (entityType === 'PERSON') return <User className="h-5 w-5" />;
  if (entityType === 'ORGANIZATION') return <Building2 className="h-5 w-5" />;
  return <Network className="h-5 w-5" />;
};

export const OperationInspectorPanel: React.FC<OperationInspectorPanelProps> = ({
  isOpen,
  onClose,
  mode,
  report,
  labelProfile,
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
  onSelectReportEntity,
  onOpenReportLead,
  onJumpToReportSection,
  onJumpToReportEvidence,
  onNavigate,
}) => {
  const entitySectionState = useExclusivePanelSections([
    'details',
    'mentions',
    'connections',
  ] as const);
  const headlineSectionState = useExclusivePanelSections(['content', 'source'] as const);
  const reportSectionState = useExclusivePanelSections(['overview'] as const);
  const reportDetailSectionState = useExclusivePanelSections([
    'findings',
    'entities',
    'followUps',
    'resources',
  ] as const);

  const entityToneClass = entity ? getEntityToneClass(entity.type) : getEntityToneClass('UNKNOWN');
  const reportDisplayTitle = report ? sanitizeDisplayTitle(report.topic) : '';
  const reportArtifactTypeLabel = report ? getArtifactTypeLabel(report.artifactType) : '';
  const entityTypeLabel = entity ? entity.type.replace(/_/g, ' ') : 'UNKNOWN';
  const purposeProfile = getPurposeProfileById(report?.purposeId || report?.config?.purposeId);

  const entityActions: InspectorActionItem[] = entity
    ? [
        {
          id: 'entity-chat',
          label: 'Open Workspace Chat',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
          icon: MessageSquare,
          onClick: () => onOpenEntityChat(entity.name),
        },
        {
          id: 'entity-investigate',
          label: 'Launch Investigation',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.run,
          icon: Microscope,
          onClick: () => onInvestigateEntity(entity.name),
        },
        {
          id: 'entity-google',
          label: 'Search Google',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.google,
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
          label: 'Place On Board',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.board,
          icon: Shapes,
          onClick: () => onPlaceEntityOnBoard(entity.name),
        },
      ]
    : [];

  const headlineActions: InspectorActionItem[] = headline
    ? [
        {
          id: 'headline-chat',
          label: 'Open Workspace Chat',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
          icon: MessageSquare,
          onClick: onOpenHeadlineChat,
        },
        {
          id: 'headline-board',
          label: 'Place On Board',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.board,
          icon: Shapes,
          onClick: onPlaceHeadlineOnBoard,
        },
        {
          id: 'headline-investigate',
          label: 'Launch Investigation',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.run,
          icon: Microscope,
          onClick: onInvestigateHeadline,
        },
      ]
    : [];

  const reportActions: InspectorActionItem[] = report
    ? [
        {
          id: 'report-chat',
          label: 'Open Workspace Chat',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
          icon: MessageSquare,
          onClick: onOpenReportChat,
        },
        {
          id: 'report-board',
          label: 'Place On Board',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.board,
          icon: Shapes,
          onClick: onPlaceReportOnBoard,
        },
      ]
    : [];

  const getEntityMentions = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    return reports.filter((candidateReport) =>
      (candidateReport.entities || []).some((candidateEntity) => {
        const candidateName =
          typeof candidateEntity === 'string' ? candidateEntity : candidateEntity.name;
        return candidateName.trim().toLowerCase() === cleanName;
      })
    );
  };

  const getEntityConnections = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    const connectedEntities = new Map<string, { entity: Entity; count: number }>();

    reports.forEach((candidateReport) => {
      const hasEntity = (candidateReport.entities || []).some((candidateEntity) => {
        const candidateName =
          typeof candidateEntity === 'string' ? candidateEntity : candidateEntity.name;
        return candidateName.trim().toLowerCase() === cleanName;
      });

      if (!hasEntity) return;

      (candidateReport.entities || []).forEach((candidateEntity) => {
        const candidateName =
          typeof candidateEntity === 'string' ? candidateEntity : candidateEntity.name;
        if (candidateName.trim().toLowerCase() === cleanName) return;

        const existing = connectedEntities.get(candidateName) || {
          entity:
            typeof candidateEntity === 'string'
              ? { name: candidateName, type: 'UNKNOWN' as const }
              : candidateEntity,
          count: 0,
        };
        existing.count += 1;
        connectedEntities.set(candidateName, existing);
      });
    });

    return Array.from(connectedEntities.values()).sort((left, right) => right.count - left.count);
  };
  const entityMentions = mode === 'ENTITY' && entity ? getEntityMentions(entity.name) : [];
  const entityConnections = mode === 'ENTITY' && entity ? getEntityConnections(entity.name) : [];

  const entitySections: GlobalInspectorSection[] =
    mode === 'ENTITY' && entity
      ? buildEntityInspectorSections({
          entityName: entity.name,
          details: entity,
          detailsTitle: 'Entity Summary',
          emptyDetailsMessage: 'No additional entity metadata saved.',
          mentionsTitle: 'Artifact Mentions',
          mentions: entityMentions,
          connections: entityConnections,
          openSection: entitySectionState.openSection,
          toggleSection: entitySectionState.toggleSection,
          onOpenMention: (matchedReport) => {
            if (matchedReport.id) {
              onNavigate(matchedReport.id);
            }
          },
          getMentionLabel: (matchedReport) => sanitizeDisplayTitle(matchedReport.topic),
        })
      : [];

  const headlineSections: GlobalInspectorSection[] =
    mode === 'HEADLINE' && headline
      ? buildHeadlineInspectorSections({
          headline,
          openSection: headlineSectionState.openSection,
          toggleSection: headlineSectionState.toggleSection,
        })
      : [];

  const reportSections: GlobalInspectorSection[] =
    mode === 'REPORT' && report
      ? [
          {
            id: 'overview',
            title: 'Artifact Overview',
            isOpen: reportSectionState.openSection === 'overview',
            onToggle: () => reportSectionState.toggleSection('overview'),
            content: (
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
            ),
          },
          ...buildArtifactViewerReportDetailRailSections({
            report,
            labelProfile,
            purposeProfile,
            openSection: reportDetailSectionState.openSection,
            toggleSection: reportDetailSectionState.toggleSection,
            onEntityClick: onSelectReportEntity,
            onLeadOpen: onOpenReportLead,
            jumpToSection: onJumpToReportSection,
            jumpToEvidence: onJumpToReportEvidence,
          }).map<GlobalInspectorSection>((section) => ({
            ...section,
            content: section.content ?? section.emptyState ?? null,
          })),
        ]
      : [];

  if (mode === 'ENTITY' && entity) {
    return (
      <GlobalInspectorPanel
        isOpen={isOpen}
        onClose={onClose}
        title={
          <EditableTitle
            value={entity.name}
            onSave={onEntitySave}
            className="leading-tight text-white"
            inputClassName="leading-tight text-white"
          />
        }
        subtitle={entityTypeLabel}
        headerIcon={
          <div className={`p-2 ${entityToneClass} entity-tone-icon-panel`}>
            {renderEntityIcon(entity.type)}
          </div>
        }
        actionItems={entityActions}
        actionRowLayout="grid"
        actionRowGridColumns={3}
        sections={entitySections}
      />
    );
  }

  if (mode === 'HEADLINE' && headline) {
    return (
      <GlobalInspectorPanel
        isOpen={isOpen}
        onClose={onClose}
        title={<span title={headline.source}>{headline.source}</span>}
        subtitle={
          <span className="flex items-center gap-2">
            <span>{headline.type} Signal</span>
            <span className="rounded-sm border border-green-900 bg-green-900/20 px-1.5 py-0.5 text-green-500">
              Live
            </span>
          </span>
        }
        headerIcon={
          <div className="p-2 text-white">
            <Newspaper className="h-5 w-5" />
          </div>
        }
        actionItems={headlineActions}
        actionRowLayout="grid"
        actionRowGridColumns={3}
        sections={headlineSections}
      />
    );
  }

  if (mode === 'REPORT' && report) {
    return (
      <GlobalInspectorPanel
        isOpen={isOpen}
        onClose={onClose}
        title={reportDisplayTitle}
        headerIcon={
          <div className="p-2 text-white">
            <FileText className="h-5 w-5" />
          </div>
        }
        actionItems={reportActions}
        actionRowLayout="grid"
        actionRowGridColumns={2}
        sections={reportSections}
      />
    );
  }

  return (
    <GlobalInspectorPanel
      isOpen={isOpen}
      onClose={onClose}
      title="No Item Selected"
      emptyState={{
        title: 'No Item Selected',
        description:
          'Select an entity, saved signal, or reopen the current artifact inspector here.',
      }}
    />
  );
};
