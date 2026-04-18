import React from 'react';
import { FileText, Globe, Link2, Microscope, Users } from 'lucide-react';
import type { Workspace, Entity, Headline, Artifact, LabelProfile, Source } from '../../../types';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';
import {
  CHROME_NESTED_ITEM_DOT_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
} from '../../ui/chrome';
import { LibraryRailSections } from '../LibraryRail/LibraryRailSections';
import { LibraryRailShell } from '../LibraryRail/LibraryRailShell';
import type { LibraryRailSection } from '../LibraryRail/libraryRailTypes';
import { PANEL_SECTION_ICONS } from '../../ui/panelSectionIcons';
import type { OperationWorkspaceFindingEntry } from './operationWorkspacePanelData';

interface WorkspaceRailProps {
  isOpen: boolean;
  activeWorkspace: Workspace | null;
  labelProfile: LabelProfile;
  artifacts: Artifact[];
  findings: OperationWorkspaceFindingEntry[];
  entities: Entity[];
  followUps: string[];
  sources: Source[];
  headlines: Headline[];
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  onNavigate: (id: string) => void;
  onEntityClick: (entity: Entity) => void;
  onFollowUpClick: (followUp: string) => void;
  onHeadlineClick: (headline: Headline) => void;
  activeArtifactId?: string;
  overlayOnDesktop?: boolean;
  showHeaderSummary?: boolean;
}

export const WorkspaceRail: React.FC<WorkspaceRailProps> = ({
  isOpen,
  activeWorkspace,
  labelProfile,
  artifacts,
  findings,
  entities,
  followUps,
  sources,
  headlines,
  openSections,
  toggleSection,
  onNavigate,
  onEntityClick,
  onFollowUpClick,
  onHeadlineClick,
  activeArtifactId,
  overlayOnDesktop = false,
  showHeaderSummary = false,
}) => {
  const desktopLayoutClass = overlayOnDesktop
    ? 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-20'
    : 'lg:relative lg:z-0';

  const sections: LibraryRailSection[] = [];

  if (artifacts.length > 0) {
    sections.push({
      id: 'artifacts',
      title: labelProfile.artifactLabelPlural,
      count: artifacts.length,
      icon: PANEL_SECTION_ICONS.artifacts,
      isOpen: openSections.artifacts,
      onToggle: () => toggleSection('artifacts'),
      entries: artifacts.map((artifact) => ({
        id: artifact.id || artifact.topic,
        title: sanitizeDisplayTitle(artifact.topic),
        onClick: artifact.id ? () => onNavigate(artifact.id as string) : undefined,
        isActive: activeArtifactId === artifact.id,
        icon: <span className={CHROME_NESTED_ITEM_DOT_CLASS} />,
      })),
    });
  }

  if (entities.length > 0) {
    sections.push({
      id: 'entities',
      title: 'Identified Entities',
      count: entities.length,
      icon: PANEL_SECTION_ICONS.entities,
      isOpen: openSections.entities,
      onToggle: () => toggleSection('entities'),
      content: (
        <div className="space-y-1">
          {entities.map((entity, index) => (
            <button
              key={`${entity.name}-${index}`}
              type="button"
              onClick={() => onEntityClick(entity)}
              className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} flex items-center gap-2`}
              title={entity.name}
            >
              <span
                className={`${CHROME_NESTED_ITEM_DOT_CLASS} ${getEntityToneClass(entity.type)} entity-tone-dot`}
              />
              <span className="truncate osint-body-quiet leading-5" style={{ color: 'inherit' }}>
                {entity.name}
              </span>
            </button>
          ))}
        </div>
      ),
    });
  }

  if (findings.length > 0) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      count: findings.length,
      icon: PANEL_SECTION_ICONS.keyFindings,
      isOpen: openSections.findings,
      onToggle: () => toggleSection('findings'),
      entries: findings.map(({ finding, artifactId, artifactTitle }) => ({
        id: finding.id,
        title: finding.title,
        description: finding.summary,
        meta: sanitizeDisplayTitle(artifactTitle),
        onClick: artifactId ? () => onNavigate(artifactId) : undefined,
      })),
    });
  }

  sections.push({
    id: 'followUps',
    title: labelProfile.followUpLabel,
    count: followUps.length,
    icon: PANEL_SECTION_ICONS.followUps,
    isOpen: openSections.followUps,
    onToggle: () => toggleSection('followUps'),
    content:
      followUps.length === 0 ? (
        <p className="osint-body-quiet px-2 py-1 italic">{`No ${labelProfile.followUpLabel.toLowerCase()} available for this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
      ) : (
        <div className="space-y-1">
          {followUps.map((followUp, index) => (
            <div
              key={`${followUp}-${index}`}
              className={`${CHROME_THIN_NESTED_ITEM_CLASS} space-y-2`}
            >
              <p className="osint-body-quiet leading-5 text-zinc-300">{followUp}</p>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => onFollowUpClick(followUp)}
                  className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                  title="Open follow-up"
                  aria-label="Open follow-up"
                >
                  <Microscope className="h-3.5 w-3.5" />
                  <span className="sr-only">Open</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ),
  });

  if (artifacts.some((artifact) => (artifact.evidence || []).length > 0)) {
    const evidenceEntries = artifacts
      .flatMap((artifact) =>
        (artifact.evidence || []).slice(0, 2).map((evidence) => ({
          artifact,
          evidence,
        }))
      )
      .slice(0, 8);

    sections.push({
      id: 'evidence',
      title: 'Evidence',
      count: artifacts.reduce((total, artifact) => total + (artifact.evidence?.length || 0), 0),
      icon: Globe,
      isOpen: openSections.evidence,
      onToggle: () => toggleSection('evidence'),
      entries: evidenceEntries.map(({ artifact: evidenceArtifact, evidence }) => ({
        id: `${evidenceArtifact.id || evidenceArtifact.topic}-${evidence.id}`,
        title: evidence.kind,
        description: evidence.title,
        meta: sanitizeDisplayTitle(evidenceArtifact.topic),
        onClick: evidenceArtifact.id ? () => onNavigate(evidenceArtifact.id as string) : undefined,
      })),
    });
  }

  sections.push({
    id: 'sources',
    title: 'Sources',
    count: sources.length,
    icon: PANEL_SECTION_ICONS.sources,
    isOpen: openSections.sources,
    onToggle: () => toggleSection('sources'),
    content:
      sources.length === 0 ? (
        <p className="osint-body-quiet px-2 py-1 italic">No sources captured yet.</p>
      ) : (
        <div className="space-y-1">
          {sources.map((source, index) => (
            <a
              key={`${source.url}-${index}`}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} block truncate`}
              style={{ color: 'var(--osint-primary)' }}
              title={source.title || source.url}
            >
              <Link2 className="mr-1 inline h-3 w-3 text-current opacity-70" />
              <span className="osint-body-quiet" style={{ color: 'inherit' }}>
                {source.title || source.url}
              </span>
            </a>
          ))}
        </div>
      ),
  });

  sections.push({
    id: 'headlines',
    title: labelProfile.signalLabel,
    count: headlines.length,
    icon: PANEL_SECTION_ICONS.signals,
    isOpen: openSections.headlines,
    onToggle: () => toggleSection('headlines'),
    entries: headlines.map((headline) => ({
      id: headline.id,
      title: headline.source,
      description: headline.content,
      meta: `${headline.type} Signal`,
      onClick: () => onHeadlineClick(headline),
    })),
    emptyState: (
      <p className="osint-body-quiet px-2 py-1 italic">{`No saved signals linked to this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
    ),
  });

  const headerSummary = showHeaderSummary ? (
    <div className="osint-meta-label flex items-center space-x-3">
      <span className="flex items-center">
        <FileText className="mr-1 h-3 w-3" />
        {artifacts.length} {labelProfile.artifactLabelPlural}
      </span>
      <span className="flex items-center">
        <Users className="mr-1 h-3 w-3" />
        {entities.length} Entities
      </span>
    </div>
  ) : undefined;

  return (
    <LibraryRailShell
      isOpen={isOpen}
      overlayOnDesktop={overlayOnDesktop}
      title={
        activeWorkspace ? (
          <h2 className="truncate whitespace-nowrap leading-tight">
            {getWorkspaceDisplayTitle(activeWorkspace)}
          </h2>
        ) : (
          <h2 className="truncate whitespace-nowrap text-zinc-500">
            {`No ${labelProfile.workspaceLabel} Selected`}
          </h2>
        )
      }
      subtitle={
        activeWorkspace
          ? undefined
          : `Select a ${labelProfile.workspaceLabel.toLowerCase()} from the dropdown above.`
      }
      summary={headerSummary}
      widthValue="min(var(--osint-shell-rail-width),calc(100vw - 1rem))"
      className={`${desktopLayoutClass} ${overlayOnDesktop ? 'lg:shadow-2xl' : 'lg:shadow-none'}`}
    >
      <LibraryRailSections sections={sections} />
    </LibraryRailShell>
  );
};

export { WorkspaceRail as WorkspaceLibraryRail };
