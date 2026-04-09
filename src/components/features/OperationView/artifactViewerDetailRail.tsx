/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Globe, Link2, ShieldAlert } from 'lucide-react';

import type {
  Artifact,
  ArtifactEvidence,
  Entity,
  FollowUp,
  KeyFinding,
  LabelProfile,
  Source,
} from '@/types';
import { getFollowUpText } from '@/domain';
import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_BUTTON_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import { PANEL_SECTION_ICONS } from '@/components/ui/panelSectionIcons';
import { getEntityToneClass } from '@/utils/entityPalette';
import type { LibraryRailSection } from '../LibraryRail/libraryRailTypes';

type ArtifactDetailRailSectionId = 'findings' | 'entities' | 'followUps' | 'resources';

interface BuildArtifactViewerDetailRailSectionsArgs {
  report: Artifact | null;
  labelProfile: LabelProfile;
  canonicalFindings: KeyFinding[];
  reportEntities: Array<Entity | string>;
  reportSources: Source[];
  visibleFollowUps: FollowUp[];
  visibleEvidence: ArtifactEvidence[];
  openSection: ArtifactDetailRailSectionId;
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

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const normalizeText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || '';

const formatTimestamp = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

interface DetailRowProps {
  eyebrow?: string;
  title?: string;
  body?: string;
  tone?: 'DEFAULT' | 'ACCENT' | 'WARNING';
  children?: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({
  eyebrow,
  title,
  body,
  tone = 'DEFAULT',
  children,
}) => (
  <article
    className={cx(
      'border p-3',
      tone === 'WARNING'
        ? 'border-[color:var(--osint-danger-border)] bg-[color:var(--osint-danger-soft-bg)]'
        : tone === 'ACCENT'
          ? 'border-osint-primary/30 bg-osint-primary/5'
          : 'border-zinc-800 bg-zinc-950/70'
    )}
  >
    {eyebrow ? (
      <div className={cx('osint-meta-label', tone === 'WARNING' && 'osint-danger-text')}>
        {eyebrow}
      </div>
    ) : null}
    {title ? (
      <div
        className={cx(
          'mt-1 osint-meta-label-strong',
          tone === 'WARNING' ? 'osint-danger-text' : 'text-white'
        )}
      >
        {title}
      </div>
    ) : null}
    {body ? (
      <div
        className={cx(
          title ? 'mt-2' : 'mt-1',
          'max-w-none osint-body-small text-zinc-300 prose prose-invert prose-p:my-0',
          tone === 'WARNING' && 'osint-danger-text'
        )}
      >
        <ReactMarkdown>{body}</ReactMarkdown>
      </div>
    ) : null}
    {children}
  </article>
);

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
    <article className={cx('border border-zinc-800/50 bg-zinc-950/70 px-3 py-2', className)}>
      <div className="osint-meta-value leading-snug text-zinc-300">{questionText}</div>
      {children}
    </article>
  );
};

export const buildArtifactViewerDetailRailSections = ({
  report,
  labelProfile,
  canonicalFindings,
  reportEntities,
  reportSources,
  visibleFollowUps,
  visibleEvidence,
  openSection,
  toggleSection,
  keyFindingsAnchorId,
  groundedClaimCount,
  inferredClaimCount,
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
            className="inline-flex items-center gap-1 border border-zinc-700 bg-zinc-950 px-2 py-1 osint-body-quiet text-zinc-400 transition hover:border-osint-primary hover:text-white"
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
                  className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300 transition hover:border-osint-primary hover:text-white"
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
              className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-400"
            >
              {reference}
            </span>
          );
        })}
      </div>
    );
  };

  const renderEvidenceButtons = (evidenceRows: ArtifactEvidence[]) => {
    if (evidenceRows.length === 0) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {evidenceRows.map((evidence) => (
          <button
            key={evidence.id}
            type="button"
            onClick={() => jumpToEvidence(evidence.id)}
            className="inline-flex items-center gap-1 border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300 transition hover:border-osint-primary hover:text-white"
          >
            <Globe className="h-3 w-3" />
            <span>{evidence.sourceTitle || evidence.title}</span>
          </button>
        ))}
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
          <div className="space-y-2">
            {canonicalFindings.map((finding, index) => {
              const relatedEvidence = getFindingRelatedEvidence(finding);
              const matchingSources = getMatchingSources(finding.supportRefs);

              return (
                <DetailRow key={finding.id} eyebrow={`Finding ${index + 1}`} body={finding.summary}>
                  {matchingSources.length > 0 ? (
                    <div className="mt-3">
                      <div className="osint-meta-label">Sources</div>
                      {renderInlineSourceLinks(matchingSources)}
                    </div>
                  ) : null}
                  {relatedEvidence.length > 0 ? (
                    <div className="mt-3">
                      <div className="osint-meta-label">Evidence</div>
                      {renderEvidenceButtons(relatedEvidence)}
                    </div>
                  ) : null}
                  <div className={getChromeThinActionRowClassName(1)}>
                    <button
                      type="button"
                      onClick={() => jumpToSection(finding.originSectionId || keyFindingsAnchorId)}
                      className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                    >
                      Open
                    </button>
                  </div>
                </DetailRow>
              );
            })}
          </div>
        ),
    },
    {
      id: 'entities',
      title: 'Entities',
      count: reportEntities.length,
      icon: PANEL_SECTION_ICONS.entities,
      isOpen: openSection === 'entities',
      onToggle: () => toggleSection('entities'),
      content:
        reportEntities.length === 0 ? (
          <p className="px-2 py-1 osint-body-quiet italic">No entities detected.</p>
        ) : (
          <div className="space-y-1">
            {reportEntities.map((entity, index) => {
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
                  <span className="truncate osint-meta-value text-zinc-300">
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
                  className={`${CHROME_THIN_NESTED_ITEM_CLASS} border-zinc-800/50 bg-zinc-950/70`}
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
                    >
                      Open
                    </button>
                    {followUp.originSectionId ? (
                      <button
                        type="button"
                        onClick={() => jumpToSection(followUp.originSectionId as string)}
                        className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                      >
                        Jump To Section
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
      count: reportSources.length,
      icon: PANEL_SECTION_ICONS.sources,
      isOpen: openSection === 'resources',
      onToggle: () => toggleSection('resources'),
      content: (
        <div className="space-y-2">
          {[
            [report?.provenance?.provider, report?.provenance?.modelId]
              .filter((value): value is string => normalizeText(value).length > 0)
              .join(' / '),
            report?.provenance?.generatedAt
              ? `Generated ${formatTimestamp(report.provenance.generatedAt)}`
              : null,
            report?.provenance?.search?.webSearchRequests
              ? `Web search calls: ${report.provenance.search.webSearchRequests}`
              : null,
            groundedClaimCount !== undefined || inferredClaimCount !== undefined
              ? `${groundedClaimCount ?? 0} grounded / ${inferredClaimCount ?? 0} inferred`
              : null,
          ].some(Boolean) ? (
            <div className="border border-zinc-800/50 bg-zinc-900/20 p-3">
              <div className="osint-meta-label">Generation</div>
              <div className="mt-2 space-y-1 osint-body-quiet text-zinc-400">
                {[report?.provenance?.provider, report?.provenance?.modelId]
                  .filter((value): value is string => normalizeText(value).length > 0)
                  .join(' / ') ? (
                  <div>
                    {[report?.provenance?.provider, report?.provenance?.modelId]
                      .filter((value): value is string => normalizeText(value).length > 0)
                      .join(' / ')}
                  </div>
                ) : null}
                {report?.provenance?.generatedAt ? (
                  <div>{`Generated ${formatTimestamp(report.provenance.generatedAt)}`}</div>
                ) : null}
                {report?.provenance?.search?.webSearchRequests ? (
                  <div>{`Web search calls: ${report.provenance.search.webSearchRequests}`}</div>
                ) : null}
                {groundedClaimCount !== undefined || inferredClaimCount !== undefined ? (
                  <div>{`${groundedClaimCount ?? 0} grounded / ${inferredClaimCount ?? 0} inferred`}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          {report?.provenance?.warnings?.length ? (
            <div className="border border-[color:var(--osint-danger-border)] bg-[color:var(--osint-danger-soft-bg)] p-3">
              <div className="osint-meta-label osint-danger-text">Warnings</div>
              <div className="mt-2 space-y-1 osint-body-quiet osint-danger-text">
                {report.provenance.warnings.map((warning, index) => (
                  <div key={`${warning}-${index}`} className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {visibleEvidence.map((evidence) => (
            <div key={evidence.id} className="border border-zinc-800/50 bg-zinc-900/20 p-3">
              <div className="osint-meta-label">{evidence.kind}</div>
              <div className="mt-1 osint-meta-value text-zinc-300">{evidence.title}</div>
              {evidence.sourceTitle || evidence.sourceUrl ? (
                <div className="mt-1 osint-body-quiet text-zinc-400">
                  {evidence.sourceTitle || evidence.sourceUrl}
                </div>
              ) : null}
              <div className={getChromeThinActionRowClassName(evidence.sectionId ? 2 : 1)}>
                <button
                  type="button"
                  onClick={() => jumpToEvidence(evidence.id)}
                  className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                >
                  Open Evidence
                </button>
                {evidence.sectionId ? (
                  <button
                    type="button"
                    onClick={() => jumpToSection(evidence.sectionId as string)}
                    className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                  >
                    Jump To Section
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          {reportSources.length === 0 ? (
            visibleEvidence.length === 0 ? (
              <p className="px-2 py-1 osint-body-quiet italic">No sources captured for this report.</p>
            ) : null
          ) : (
            reportSources.map((source, index) => (
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
  ];
};
