import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Globe, Loader2, Pencil, StopCircle, Volume2, X } from 'lucide-react';

import type {
  ArtifactEvidence,
  ArtifactSection,
  Entity,
  FollowUp,
  KeyFinding,
  Source,
} from '@/types';
import { getFollowUpText } from '@/domain';
import { getEntityToneClass } from '@/utils/entityPalette';
import type { ArtifactViewerBodyBlock } from './artifactViewerText';
import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  getChromeMenuButtonClass,
} from '@/components/ui/chrome';
import {
  ARTIFACT_BODY_EDIT_KEY,
  ARTIFACT_VIEWER_SECTION_CLASS,
  SECTION_HEADER_ACTION_GROUP_CLASS,
  SECTION_HEADER_CLASS,
  SECTION_HEADER_ICON_BUTTON_CLASS,
  SECTION_HEADER_SUCCESS_ICON_BUTTON_CLASS,
  cx,
  markdownComponents,
} from './artifactViewerShared';

export const REPORT_MENU_BUTTON_CLASS =
  `${getChromeMenuButtonClass(false)} osint-meta-label-strong inline-flex h-9 items-center justify-center px-3`;

interface EvidenceButtonsProps {
  evidenceRows: ArtifactEvidence[];
  highlightedEvidenceId: string | null;
  onJumpToEvidence: (evidenceId: string) => void;
}

export const ArtifactEvidenceButtons: React.FC<EvidenceButtonsProps> = ({
  evidenceRows,
  highlightedEvidenceId,
  onJumpToEvidence,
}) => {
  if (evidenceRows.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {evidenceRows.map((evidence) => (
        <button
          key={evidence.id}
          type="button"
          onClick={() => onJumpToEvidence(evidence.id)}
          className={cx(
            'osint-shell-chip inline-flex items-center gap-1 px-2 py-1 osint-meta-label transition',
            highlightedEvidenceId === evidence.id
              ? 'border-osint-primary bg-osint-primary/15 text-white'
              : ''
          )}
        >
          <Globe className="h-3 w-3" />
          <span>{evidence.sourceTitle || evidence.title}</span>
        </button>
      ))}
    </div>
  );
};

interface InlineSourceLinksProps {
  sources: { title?: string; url: string }[];
}

const InlineSourceLinks: React.FC<InlineSourceLinksProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {sources.map((source) => (
        <a
          key={`${source.url}-${source.title}`}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="osint-inline-text-link osint-body-quiet"
          style={{ color: 'var(--osint-primary)' }}
        >
          <span>{source.title || source.url}</span>
        </a>
      ))}
    </div>
  );
};

interface SummarySectionProps {
  editableArtifactBody: string;
  editingSectionDraft: string;
  editingTargetKey: string | null;
  evidenceBySectionId: Record<string, ArtifactEvidence[]>;
  focusedEvidenceId?: string;
  focusedSectionId?: string;
  highlightedEvidenceId: string | null;
  highlightedSectionId: string | null;
  isAudioLoading: boolean;
  isCompositeReportBody: boolean;
  isPlaying: boolean;
  isSavingSection: boolean;
  onCancelEditing: () => void;
  onDraftChange: (value: string) => void;
  onJumpToEvidence: (evidenceId: string) => void;
  onPlayBriefing: () => void;
  onSaveSection: () => void;
  onStartEditingSection: (body: string, sectionId?: string, syncSummary?: boolean) => void;
  primarySummarySection?: ArtifactSection;
  setSectionRef: (sectionId: string, node: HTMLElement | null) => void;
  summaryAnchorId: string;
  visibleReportBody: string;
  visibleReportBodyBlocks: ArtifactViewerBodyBlock[];
}

export const ArtifactSummarySection: React.FC<SummarySectionProps> = ({
  editableArtifactBody,
  editingSectionDraft,
  editingTargetKey,
  evidenceBySectionId,
  focusedEvidenceId,
  focusedSectionId,
  highlightedEvidenceId,
  highlightedSectionId,
  isAudioLoading,
  isCompositeReportBody,
  isPlaying,
  isSavingSection,
  onCancelEditing,
  onDraftChange,
  onJumpToEvidence,
  onPlayBriefing,
  onSaveSection,
  onStartEditingSection,
  primarySummarySection,
  setSectionRef,
  summaryAnchorId,
  visibleReportBody,
  visibleReportBodyBlocks,
}) => {
  if (visibleReportBody.trim().length === 0) return null;

  const summaryEditKey = primarySummarySection?.id || ARTIFACT_BODY_EDIT_KEY;
  const summaryEvidence = evidenceBySectionId[primarySummarySection?.id || ''] || [];

  return (
    <section
      ref={(node) => {
        setSectionRef(summaryAnchorId, node);
      }}
      className={cx(
        ARTIFACT_VIEWER_SECTION_CLASS,
        highlightedSectionId === summaryAnchorId ? 'osint-shell-highlight-surface' : undefined
      )}
    >
      <div className={SECTION_HEADER_CLASS}>
        <div className="min-w-0">
          <h2 className="font-osint-display osint-title-section">Executive Summary</h2>
        </div>
        <div className={SECTION_HEADER_ACTION_GROUP_CLASS}>
          {!isCompositeReportBody && editingTargetKey === summaryEditKey ? (
            <>
              <button
                type="button"
                onClick={onSaveSection}
                disabled={isSavingSection}
                className={SECTION_HEADER_SUCCESS_ICON_BUTTON_CLASS}
                title="Save artifact text"
                aria-label="Save"
              >
                {isSavingSection ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onCancelEditing}
                disabled={isSavingSection}
                className={SECTION_HEADER_ICON_BUTTON_CLASS}
                title="Cancel editing"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : !isCompositeReportBody ? (
            <button
              type="button"
              onClick={() => onStartEditingSection(editableArtifactBody, primarySummarySection?.id, true)}
              className={SECTION_HEADER_ICON_BUTTON_CLASS}
              title="Edit artifact text"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPlayBriefing}
            disabled={isAudioLoading}
            className={cx(
              'inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 shadow-none transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
              isPlaying
                ? 'osint-icon-button-plain-danger animate-pulse'
                : 'osint-icon-button-plain'
            )}
            aria-label={isPlaying ? 'Stop audio briefing' : 'Play audio briefing'}
            title={isPlaying ? 'Stop audio briefing' : 'Play audio briefing'}
          >
            {isAudioLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <StopCircle className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {(focusedEvidenceId || focusedSectionId) && editingTargetKey !== summaryEditKey ? (
        <div className="mt-4 inline-flex items-center px-2 py-1 osint-meta-label text-osint-primary">
          Focused Reading Target
        </div>
      ) : null}

      <ArtifactEvidenceButtons
        evidenceRows={summaryEvidence}
        highlightedEvidenceId={highlightedEvidenceId}
        onJumpToEvidence={onJumpToEvidence}
      />

      <div className="mt-6">
        {!isCompositeReportBody && editingTargetKey === summaryEditKey ? (
          <textarea
            value={editingSectionDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="osint-input-field min-h-[18rem] w-full resize-y p-4 osint-prose"
            spellCheck={false}
          />
        ) : isCompositeReportBody ? (
          <div className="space-y-5 text-[color:var(--osint-text-strong)]">
            {visibleReportBodyBlocks.map((block, index) => (
              <div key={`${block.title || 'body'}-${index}`} className="space-y-2">
                {block.title ? (
                  <div className="osint-body-small font-semibold tracking-[0.02em] text-[color:var(--osint-text-heading)]">
                    {block.title}
                  </div>
                ) : null}
                <div className="osint-prose max-w-none whitespace-pre-wrap text-[color:var(--osint-text-strong)]">
                  {block.body}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="osint-prose max-w-none prose prose-invert">
            <ReactMarkdown components={markdownComponents}>{visibleReportBody}</ReactMarkdown>
          </div>
        )}
      </div>
    </section>
  );
};

interface KeyFindingsSectionProps {
  canonicalFindings: KeyFinding[];
  getFindingRelatedEvidence: (finding: KeyFinding) => ArtifactEvidence[];
  getMatchingSources: (references?: string[]) => Source[];
  highlightedEvidenceId: string | null;
  keyFindingsAnchorId: string;
  onJumpToEvidence: (evidenceId: string) => void;
  onJumpToSection: (sectionId: string) => void;
  setSectionRef: (sectionId: string, node: HTMLElement | null) => void;
}

export const ArtifactKeyFindingsSection: React.FC<KeyFindingsSectionProps> = ({
  canonicalFindings,
  getFindingRelatedEvidence,
  getMatchingSources,
  highlightedEvidenceId,
  keyFindingsAnchorId,
  onJumpToEvidence,
  onJumpToSection,
  setSectionRef,
}) => {
  if (canonicalFindings.length === 0) return null;

  return (
    <section
      ref={(node) => {
        setSectionRef(keyFindingsAnchorId, node);
      }}
      className={ARTIFACT_VIEWER_SECTION_CLASS}
    >
      <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-osint-display osint-title-section">Key Findings</h2>
        </div>
        <div className="osint-meta-label">{`${canonicalFindings.length} records`}</div>
      </div>
      <div className="mt-6 divide-y divide-zinc-800">
        {canonicalFindings.map((finding) => {
          const relatedEvidence = getFindingRelatedEvidence(finding);
          const matchingSources = getMatchingSources(finding.supportRefs);
          const findingOriginSectionId = finding.originSectionId;

          return (
            <article key={finding.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="mt-1 osint-panel-title">{finding.title}</h3>
                </div>
                {finding.originSectionId ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (findingOriginSectionId) {
                        onJumpToSection(findingOriginSectionId);
                      }
                    }}
                    className={CHROME_THIN_ACTION_BUTTON_CLASS}
                  >
                    Jump To Section
                  </button>
                ) : null}
              </div>
              <div className="mt-3 max-w-none osint-body-small prose prose-invert">
                <ReactMarkdown components={markdownComponents}>{finding.summary}</ReactMarkdown>
              </div>
              {matchingSources.length > 0 ? (
                <div className="mt-4">
                  <div className="osint-meta-label">Linked Sources</div>
                  <InlineSourceLinks sources={matchingSources} />
                </div>
              ) : null}
              {relatedEvidence.length > 0 ? (
                <div className="mt-4">
                  <div className="osint-meta-label">Evidence Jumps</div>
                  <ArtifactEvidenceButtons
                    evidenceRows={relatedEvidence}
                    highlightedEvidenceId={highlightedEvidenceId}
                    onJumpToEvidence={onJumpToEvidence}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
};

interface FollowUpsSectionProps {
  getMatchingEntity: (reference: string) => Entity | null;
  getMatchingSources: (references?: string[]) => Source[];
  onEntityClick: (entity: Entity) => void;
  onFollowUpOpen: (followUp: FollowUp) => void;
  onJumpToSection: (sectionId: string) => void;
  visibleFollowUps: FollowUp[];
}

export const ArtifactFollowUpsSection: React.FC<FollowUpsSectionProps> = ({
  getMatchingEntity,
  getMatchingSources,
  onEntityClick,
  onFollowUpOpen,
  onJumpToSection,
  visibleFollowUps,
}) => {
  if (visibleFollowUps.length === 0) return null;

  return (
    <section className={ARTIFACT_VIEWER_SECTION_CLASS}>
      <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="font-osint-display osint-title-section">Next Steps</h2>
        </div>
        <div className="osint-meta-label">{`${visibleFollowUps.length} records`}</div>
      </div>
      <div className="mt-6 divide-y divide-zinc-800">
        {visibleFollowUps.map((followUp) => {
          const followUpText = getFollowUpText(followUp);
          const matchingSources = getMatchingSources(followUp.sourceRefs);
          const matchingEntities = (followUp.entityRefs || [])
            .map((reference) => getMatchingEntity(reference))
            .filter((entity): entity is Entity => !!entity);

          return (
            <article key={followUp.id} className="py-6 first:pt-0 last:pb-0">
              <p className="max-w-none osint-body-small leading-relaxed text-[color:var(--osint-text-strong)]">
                {followUpText}
              </p>
              {matchingEntities.length > 0 ? (
                <div className="mt-4">
                  <div className="osint-meta-label">Entities</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchingEntities.map((entity) => (
                      <button
                        key={`${followUp.id}-${entity.name}`}
                        type="button"
                        onClick={() => onEntityClick(entity)}
                        className="osint-shell-chip inline-flex items-center gap-2 px-2 py-1 osint-meta-label transition"
                      >
                        <span
                          className={cx(
                            'h-1.5 w-1.5 rounded-full entity-tone-dot',
                            getEntityToneClass(entity.type)
                          )}
                        />
                        <span>{entity.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {matchingSources.length > 0 ? (
                <div className="mt-4">
                  <div className="osint-meta-label">Linked Sources</div>
                  <InlineSourceLinks sources={matchingSources} />
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-start gap-2">
                <button
                  type="button"
                  onClick={() => onFollowUpOpen(followUp)}
                  className={REPORT_MENU_BUTTON_CLASS}
                >
                  Investigate
                </button>
                {followUp.originSectionId ? (
                  <button
                    type="button"
                    onClick={() => onJumpToSection(followUp.originSectionId as string)}
                    className={REPORT_MENU_BUTTON_CLASS}
                  >
                    Open In Report
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
