/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import { FileSearch, Link2, Microscope, PanelTopOpen, ShieldAlert } from 'lucide-react';

import type {
  Artifact,
  ArtifactEvidence,
  Entity,
  FollowUp,
  KeyFinding,
  LabelProfile,
  PurposeProfile,
  Source,
} from '@/types';
import {
  getArtifactKeyFindings,
  getFollowUpText,
  getSectionByKinds,
} from '@/domain';
import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';
import { getEntityToneClass } from '@/utils/entityPalette';
import type { LibraryRailSection } from '../LibraryRail/libraryRailTypes';
import { buildArtifactViewerPresentation } from './artifactViewerPresentation';
import { FindingDetailList } from './artifactViewerDetailFindingList';
import {
  buildVisibleArtifactFollowUps,
  cx,
  dedupeById,
  matchesReference,
  normalizeText,
} from './artifactViewerShared';

type ArtifactDetailRailSectionId = 'findings' | 'entities' | 'followUps' | 'resources';

interface BuildArtifactViewerDetailRailSectionsArgs {
  artifact: Artifact | null;
  labelProfile: LabelProfile;
  canonicalFindings: KeyFinding[];
  artifactEntities: Array<Entity | string>;
  artifactSources: Source[];
  visibleFollowUps: FollowUp[];
  visibleEvidence: ArtifactEvidence[];
  openSection: ArtifactDetailRailSectionId | null;
  toggleSection: (sectionId: ArtifactDetailRailSectionId) => void;
  keyFindingsAnchorId: string;
  groundedClaimCount?: number;
  inferredClaimCount?: number;
  onEntityClick: (entity: Entity) => void;
  onLeadOpen: (followUp: FollowUp) => void;
  jumpToSection: (sectionId: string) => void;
  jumpToEvidence: (evidenceId: string) => void;
  getFindingRelatedEvidence: (finding: KeyFinding) => ArtifactEvidence[];
  getMatchingSources: (references?: string[]) => Source[];
  getMatchingEntity: (reference: string) => Entity | null;
}

interface BuildArtifactViewerArtifactDetailRailSectionsArgs {
  artifact: Artifact | null;
  labelProfile: LabelProfile;
  purposeProfile?: PurposeProfile;
  openSection: ArtifactDetailRailSectionId | null;
  toggleSection: (sectionId: ArtifactDetailRailSectionId) => void;
  onEntityClick: (entity: Entity) => void;
  onLeadOpen: (followUp: FollowUp) => void;
  jumpToSection: (sectionId: string) => void;
  jumpToEvidence: (evidenceId: string) => void;
}

interface FollowUpDetailRowProps {
  title?: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}

const FollowUpDetailRow: React.FC<FollowUpDetailRowProps> = ({
  title,
  body,
  children,
  className,
}) => {
  const questionText = normalizeText(body) || normalizeText(title);

  return (
    <article className={cx('osint-shell-stage-surface-subtle px-3 py-2', className)}>
      <p className="osint-body-quiet leading-5 text-[color:var(--osint-text-strong)]">{questionText}</p>
      {children}
    </article>
  );
};

export const buildArtifactViewerDetailRailSections = ({
  artifact,
  labelProfile,
  canonicalFindings,
  artifactEntities,
  artifactSources,
  visibleFollowUps,
  visibleEvidence,
  openSection,
  toggleSection,
  keyFindingsAnchorId,
  onEntityClick,
  onLeadOpen,
  jumpToSection,
  jumpToEvidence,
  getFindingRelatedEvidence,
  getMatchingSources,
  getMatchingEntity,
}: BuildArtifactViewerDetailRailSectionsArgs): LibraryRailSection[] => {
  const renderInlineSourceLinks = (sources: Source[]) => {
    if (sources.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={`${source.url}-${source.title}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="osint-shell-chip inline-flex items-center gap-1 px-2 py-1 osint-body-quiet transition hover:border-osint-primary hover:text-white"
            style={{ color: 'var(--osint-primary)' }}
          >
            <Link2 className="h-3 w-3" />
            <span>{source.title || source.url}</span>
          </a>
        ))}
      </div>
    );
  };

  const renderReferenceChips = (references: string[] | undefined, kind: 'ENTITY' | 'SOURCE') => {
    if (!references || references.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {references.map((reference) => {
          if (kind === 'ENTITY') {
            const entity = getMatchingEntity(reference);
            if (entity) {
              return (
                <button
                  key={`${kind}-${reference}`}
                  type="button"
                  onClick={() => onEntityClick(entity)}
                  className="osint-shell-chip inline-flex items-center gap-2 px-2 py-1 osint-meta-label transition hover:border-osint-primary hover:text-white"
                >
                  <span
                    className={cx(
                      'h-1.5 w-1.5 rounded-full entity-tone-dot',
                      getEntityToneClass(entity.type)
                    )}
                  />
                  <span>{entity.name}</span>
                </button>
              );
            }
          }

          return (
            <span
              key={`${kind}-${reference}`}
              className="osint-shell-chip-muted inline-flex items-center px-2 py-1 osint-meta-label"
            >
              {reference}
            </span>
          );
        })}
      </div>
    );
  };

  return [
    {
      id: 'findings',
      title: 'Key Findings',
      count: canonicalFindings.length,
      icon: PANEL_SECTION_ICONS.keyFindings,
      isOpen: openSection === 'findings',
      onToggle: () => toggleSection('findings'),
      headerClassName: 'text-osint-primary',
      content:
        canonicalFindings.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">
            No canonical findings were extracted for this artifact.
          </p>
        ) : (
          <FindingDetailList
            key={canonicalFindings.map((finding) => finding.id).join('|')}
            canonicalFindings={canonicalFindings}
            keyFindingsAnchorId={keyFindingsAnchorId}
            jumpToSection={jumpToSection}
            jumpToEvidence={jumpToEvidence}
            getFindingRelatedEvidence={getFindingRelatedEvidence}
            getMatchingSources={getMatchingSources}
          />
        ),
    },
    {
      id: 'entities',
      title: 'Entities',
      count: artifactEntities.length,
      icon: PANEL_SECTION_ICONS.entities,
      isOpen: openSection === 'entities',
      onToggle: () => toggleSection('entities'),
      content:
        artifactEntities.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">No entities detected.</p>
        ) : (
          <div className="space-y-1">
            {artifactEntities.map((entity, index) => {
              const normalizedEntity =
                typeof entity === 'string' ? { name: entity, type: 'UNKNOWN' as const } : entity;

              return (
                <button
                  key={`${normalizedEntity.name}-${index}`}
                  type="button"
                  onClick={() => onEntityClick(normalizedEntity)}
                  className={`${CHROME_THIN_NESTED_ITEM_BUTTON_CLASS} flex items-center gap-2`}
                  title={normalizedEntity.name}
                >
                  <span
                    className={cx(
                      'h-1.5 w-1.5 rounded-full entity-tone-dot',
                      getEntityToneClass(normalizedEntity.type)
                    )}
                  />
                  <span className="truncate osint-body-quiet leading-5" style={{ color: 'inherit' }}>
                    {normalizedEntity.name}
                  </span>
                </button>
              );
            })}
          </div>
        ),
    },
    {
      id: 'followUps',
      title: labelProfile.followUpLabel,
      count: visibleFollowUps.length,
      icon: PANEL_SECTION_ICONS.followUps,
      isOpen: openSection === 'followUps',
      onToggle: () => toggleSection('followUps'),
      headerClassName: 'text-osint-primary',
      content:
        visibleFollowUps.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">
            {`No ${labelProfile.followUpLabel.toLowerCase()} extracted for this artifact.`}
          </p>
        ) : (
          <div className="space-y-2">
            {visibleFollowUps.map((followUp) => {
              const questionText = normalizeText(getFollowUpText(followUp));
              const matchingSources = getMatchingSources(followUp.sourceRefs);

              return (
                <FollowUpDetailRow
                  key={followUp.id}
                  className={`${CHROME_THIN_NESTED_ITEM_CLASS}`}
                  title={questionText}
                  body={getFollowUpText(followUp)}
                >
                  {followUp.entityRefs && followUp.entityRefs.length > 0 ? (
                    <div className="mt-3">
                      <div className="osint-meta-label">Entities</div>
                      {renderReferenceChips(followUp.entityRefs, 'ENTITY')}
                    </div>
                  ) : null}
                  {followUp.sourceRefs && followUp.sourceRefs.length > 0 ? (
                    <div className="mt-3">
                      <div className="osint-meta-label">Sources</div>
                      {matchingSources.length > 0
                        ? renderInlineSourceLinks(matchingSources)
                        : renderReferenceChips(followUp.sourceRefs, 'SOURCE')}
                    </div>
                  ) : null}
                  <div className={getChromeThinActionRowClassName(followUp.originSectionId ? 2 : 1)}>
                    <button
                      type="button"
                      onClick={() => onLeadOpen(followUp)}
                      className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                      title="Open follow-up"
                      aria-label="Open follow-up"
                    >
                      <Microscope className="h-3.5 w-3.5" />
                      <span className="sr-only">Open</span>
                    </button>
                    {followUp.originSectionId ? (
                      <button
                        type="button"
                        onClick={() => jumpToSection(followUp.originSectionId as string)}
                        className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                        title="Jump to section"
                        aria-label="Jump to section"
                      >
                        <PanelTopOpen className="h-3.5 w-3.5" />
                        <span className="sr-only">Jump To Section</span>
                      </button>
                    ) : null}
                  </div>
                </FollowUpDetailRow>
              );
            })}
          </div>
        ),
    },
    {
      id: 'resources',
      title: 'Sources',
      count: artifactSources.length,
      icon: PANEL_SECTION_ICONS.sources,
      isOpen: openSection === 'resources',
      onToggle: () => toggleSection('resources'),
      content: (
        <div className="space-y-2">
          {artifact?.provenance?.warnings?.length ? (
            <div className="border border-[color:var(--osint-danger-border)] bg-[color:var(--osint-danger-soft-bg)] p-3">
              <div className="osint-meta-label osint-danger-text">Warnings</div>
              <div className="mt-2 space-y-1 osint-body-quiet osint-danger-text">
                {artifact.provenance.warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {visibleEvidence.map((evidence) => (
            <div key={evidence.id} className="osint-shell-stage-surface-subtle p-3">
              <div className="osint-meta-label">{evidence.kind}</div>
              <div className="mt-1 osint-meta-value">{evidence.title}</div>
              {evidence.sourceTitle || evidence.sourceUrl ? (
                <div className="mt-1 osint-body-quiet">
                  {evidence.sourceTitle || evidence.sourceUrl}
                </div>
              ) : null}
              <div className={getChromeThinActionRowClassName(evidence.sectionId ? 2 : 1)}>
                <button
                  type="button"
                  onClick={() => jumpToEvidence(evidence.id)}
                  className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                  title="Open evidence"
                  aria-label="Open evidence"
                >
                  <FileSearch className="h-3.5 w-3.5" />
                  <span className="sr-only">Open Evidence</span>
                </button>
                {evidence.sectionId ? (
                  <button
                    type="button"
                    onClick={() => jumpToSection(evidence.sectionId as string)}
                    className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                    title="Jump to section"
                    aria-label="Jump to section"
                  >
                    <PanelTopOpen className="h-3.5 w-3.5" />
                    <span className="sr-only">Jump To Section</span>
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {artifactSources.length === 0 ? (
            visibleEvidence.length === 0 ? (
              <p className="px-2 py-1 osint-body-quiet italic">No sources captured for this report.</p>
            ) : null
          ) : (
            artifactSources.map((source, index) => (
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
            ))
          )}
        </div>
      ),
    },
  ];
};

export const buildArtifactViewerArtifactDetailRailSections = ({
  artifact,
  labelProfile,
  purposeProfile,
  openSection,
  toggleSection,
  onEntityClick,
  onLeadOpen,
  jumpToSection,
  jumpToEvidence,
}: BuildArtifactViewerArtifactDetailRailSectionsArgs): LibraryRailSection[] => {
  const artifactEntities = artifact?.entities || [];
  const artifactSources = artifact?.sources || [];
  const { evidenceBySectionId, orderedSections, visibleEvidence } = buildArtifactViewerPresentation(
    artifact,
    purposeProfile
  );
  const canonicalFindings = artifact ? getArtifactKeyFindings(artifact) : [];
  const keyFindingsSection = getSectionByKinds(orderedSections, ['KEY_FINDINGS']);
  const keyFindingsAnchorId = keyFindingsSection?.id || `${artifact?.id || 'artifact'}-key-findings`;
  const visibleFollowUps = buildVisibleArtifactFollowUps(artifact, orderedSections);

  const getFindingRelatedEvidence = (finding: KeyFinding) =>
    dedupeById(
      [
        ...(finding.originSectionId ? evidenceBySectionId[finding.originSectionId] || [] : []),
        ...visibleEvidence.filter((entry) =>
          (finding.supportRefs || []).some(
            (reference) =>
              matchesReference(reference, entry.title) ||
              matchesReference(reference, entry.sourceTitle) ||
              matchesReference(reference, entry.sourceUrl)
          )
        ),
      ].filter((entry): entry is ArtifactEvidence => Boolean(entry))
    );

  const getMatchingSources = (references?: string[]) =>
    dedupeById(
      artifactSources
        .filter((source) =>
          (references || []).some(
            (reference) =>
              matchesReference(reference, source.title) || matchesReference(reference, source.url)
          )
        )
        .map((source, index) => ({ ...source, id: `${source.url}-${index}` }))
    ).map(({ id: _id, ...source }) => source);

  const getMatchingEntity = (reference: string) => {
    const match = artifactEntities.find((entity) => {
      const candidateName = typeof entity === 'string' ? entity : entity.name;
      return matchesReference(reference, candidateName);
    });

    if (!match) return null;
    return typeof match === 'string' ? { name: match, type: 'UNKNOWN' as const } : match;
  };

  return buildArtifactViewerDetailRailSections({
    artifact,
    labelProfile,
    canonicalFindings,
    artifactEntities,
    artifactSources,
    visibleFollowUps,
    visibleEvidence,
    openSection,
    toggleSection,
    keyFindingsAnchorId,
    onEntityClick,
    onLeadOpen,
    jumpToSection,
    jumpToEvidence,
    getFindingRelatedEvidence,
    getMatchingSources,
    getMatchingEntity,
  });
};
