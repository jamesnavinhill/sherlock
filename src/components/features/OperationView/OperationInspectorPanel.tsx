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
import { buildArtifactViewerArtifactDetailRailSections } from './artifactViewerDetailRail';
import { getArtifactTypeLabel } from './artifactViewerPresentation';

interface OperationInspectorPanelProps {
  isOpen: boolean;
  mode: 'ENTITY' | 'HEADLINE' | 'REPORT' | null;
  artifact: Artifact | null;
  labelProfile: LabelProfile;
  workspaceTitle?: string | null;
  entity: Entity | null;
  headline: Headline | null;
  artifacts: Artifact[];
  onEntitySave: (newName: string) => void;
  onFlagEntity: (entityName: string) => void;
  onInvestigateEntity: (entityName: string) => void;
  onInvestigateHeadline: () => void;
  onOpenEntityChat: (entityName: string) => void;
  onOpenHeadlineChat: () => void;
  onOpenArtifactChat: () => void;
  onPlaceEntityOnBoard: (entityName: string) => void;
  onPlaceHeadlineOnBoard: () => void;
  onPlaceArtifactOnBoard: () => void;
  onSelectArtifactEntity: (entity: Entity) => void;
  onOpenArtifactFollowUp: (followUp: FollowUp) => void;
  onJumpToArtifactSection: (sectionId: string) => void;
  onJumpToArtifactEvidence: (evidenceId: string) => void;
  onNavigate: (artifactId: string) => void;
}

const renderEntityIcon = (entityType: Entity['type']) => {
  if (entityType === 'PERSON') return <User className="h-5 w-5" />;
  if (entityType === 'ORGANIZATION') return <Building2 className="h-5 w-5" />;
  return <Network className="h-5 w-5" />;
};

export const OperationInspectorPanel: React.FC<OperationInspectorPanelProps> = ({
  isOpen,
  mode,
  artifact,
  labelProfile,
  workspaceTitle,
  entity,
  headline,
  artifacts,
  onEntitySave,
  onFlagEntity,
  onInvestigateEntity,
  onInvestigateHeadline,
  onOpenEntityChat,
  onOpenHeadlineChat,
  onOpenArtifactChat,
  onPlaceEntityOnBoard,
  onPlaceHeadlineOnBoard,
  onPlaceArtifactOnBoard,
  onSelectArtifactEntity,
  onOpenArtifactFollowUp,
  onJumpToArtifactSection,
  onJumpToArtifactEvidence,
  onNavigate,
}) => {
  const entitySectionState = useExclusivePanelSections([
    'details',
    'mentions',
    'connections',
  ] as const);
  const headlineSectionState = useExclusivePanelSections(['content', 'source'] as const);
  const artifactSectionState = useExclusivePanelSections(['overview'] as const);
  const artifactDetailSectionState = useExclusivePanelSections([
    'findings',
    'entities',
    'followUps',
    'resources',
  ] as const);

  const entityToneClass = entity ? getEntityToneClass(entity.type) : getEntityToneClass('UNKNOWN');
  const artifactDisplayTitle = artifact ? sanitizeDisplayTitle(artifact.topic) : '';
  const artifactTypeLabel = artifact ? getArtifactTypeLabel(artifact.artifactType) : '';
  const entityTypeLabel = entity ? entity.type.replace(/_/g, ' ') : 'UNKNOWN';
  const purposeProfile = getPurposeProfileById(artifact?.purposeId || artifact?.config?.purposeId);

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

  const artifactActions: InspectorActionItem[] = artifact
    ? [
        {
          id: 'artifact-chat',
          label: 'Open Workspace Chat',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.chat,
          icon: MessageSquare,
          onClick: onOpenArtifactChat,
        },
        {
          id: 'artifact-board',
          label: 'Place On Board',
          shortLabel: INSPECTOR_ACTION_SHORT_LABELS.board,
          icon: Shapes,
          onClick: onPlaceArtifactOnBoard,
        },
      ]
    : [];

  const getEntityMentions = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    return artifacts.filter((candidateArtifact) =>
      (candidateArtifact.entities || []).some((candidateEntity) => {
        const candidateName =
          typeof candidateEntity === 'string' ? candidateEntity : candidateEntity.name;
        return candidateName.trim().toLowerCase() === cleanName;
      })
    );
  };

  const getEntityConnections = (entityName: string) => {
    const cleanName = entityName.trim().toLowerCase();
    const connectedEntities = new Map<string, { entity: Entity; count: number }>();

    artifacts.forEach((candidateArtifact) => {
      const hasEntity = (candidateArtifact.entities || []).some((candidateEntity) => {
        const candidateName =
          typeof candidateEntity === 'string' ? candidateEntity : candidateEntity.name;
        return candidateName.trim().toLowerCase() === cleanName;
      });

      if (!hasEntity) return;

      (candidateArtifact.entities || []).forEach((candidateEntity) => {
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

  const artifactSections: GlobalInspectorSection[] =
    mode === 'REPORT' && artifact
      ? [
          {
            id: 'overview',
            title: 'Artifact Overview',
            isOpen: artifactSectionState.openSection === 'overview',
            onToggle: () => artifactSectionState.toggleSection('overview'),
            content: (
              <div className="osint-raised-surface p-4 space-y-3">
                {workspaceTitle ? (
                  <div>
                    <div className="mb-1 osint-meta-label">Workspace</div>
                    <div className="osint-body-small text-zinc-300">{workspaceTitle}</div>
                  </div>
                ) : null}
                {artifact.artifactType ? (
                  <div>
                    <div className="mb-1 osint-meta-label">Artifact Type</div>
                    <div className="osint-body-small text-zinc-300">{artifactTypeLabel}</div>
                  </div>
                ) : null}
                <div>
                  <div className="mb-1 osint-meta-label">Summary</div>
                  <div className="osint-body-small text-zinc-300">
                    {artifact.summary || 'No summary saved for this artifact yet.'}
                  </div>
                </div>
              </div>
            ),
          },
          ...buildArtifactViewerArtifactDetailRailSections({
            artifact,
            labelProfile,
            purposeProfile,
            openSection: artifactDetailSectionState.openSection,
            toggleSection: artifactDetailSectionState.toggleSection,
            onEntityClick: onSelectArtifactEntity,
            onLeadOpen: onOpenArtifactFollowUp,
            jumpToSection: onJumpToArtifactSection,
            jumpToEvidence: onJumpToArtifactEvidence,
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

  if (mode === 'REPORT' && artifact) {
    return (
      <GlobalInspectorPanel
        isOpen={isOpen}
        title={artifactDisplayTitle}
        headerIcon={
          <div className="p-2 text-white">
            <FileText className="h-5 w-5" />
          </div>
        }
        actionItems={artifactActions}
        actionRowLayout="grid"
        actionRowGridColumns={2}
        sections={artifactSections}
      />
    );
  }

  return (
    <GlobalInspectorPanel
      isOpen={isOpen}
      title="No Item Selected"
      emptyState={{
        title: 'No Item Selected',
        description:
          'Select an entity, saved signal, or reopen the current artifact inspector here.',
      }}
    />
  );
};
