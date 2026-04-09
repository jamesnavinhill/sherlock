import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileText,
  Globe,
  Link2,
  Loader2,
  PanelRight,
  Pencil,
  ShieldAlert,
  StopCircle,
  Target,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import type {
  Artifact,
  ArtifactEvidence,
  ArtifactSection,
  Entity,
  FollowUp,
  KeyFinding,
  Source,
} from '../../../types';
import {
  getArtifactFollowUps,
  getArtifactKeyFindings,
  getArtifactSectionTitle,
  getFollowUpText,
  getLabelProfileById,
  getPurposeProfileById,
  getSectionByKinds,
  getSectionItemsByKinds,
  sanitizeDisplayTitle,
} from '../../../domain';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EditableTitle } from '../../ui/EditableTitle';
import { EmptyState } from '../../ui/EmptyState';
import { generateAudioBriefing } from '../../../services/runtime';
import { decodeBase64, decodeAudioData } from '../../../utils/audio';
import { Accordion } from '../../ui/Accordion';
import {
  CHROME_ACTION_BUTTON_CLASS,
  CHROME_COMPACT_ACTION_BUTTON_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '../../ui/chrome';
import { getEntityToneClass } from '../../../utils/entityPalette';
import { buildArtifactViewerPresentation } from './artifactViewerPresentation';

interface ArtifactViewerProps {
  report: Artifact | null;
  workspaceTitle?: string | null;
  focusedSectionId?: string;
  focusedEvidenceId?: string;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onNotify: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  showPlaceholder: boolean;
  onStartNewCase: () => void;
  onTitleSave: (newTitle: string) => void;
  onReportBodySave: (
    body: string,
    sectionId?: string,
    options?: { syncSummary?: boolean }
  ) => Promise<void>;
  onLeadOpen: (followUp: FollowUp) => void;
  onEntityClick: (entity: Entity) => void;
}

const REPORT_BODY_EDIT_KEY = '__artifact-report-body__';

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const normalizeText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || '';

const matchesReference = (reference?: string | null, candidate?: string | null) => {
  const normalizedReference = normalizeText(reference).toLowerCase();
  const normalizedCandidate = normalizeText(candidate).toLowerCase();

  return (
    normalizedReference.length > 0 &&
    normalizedCandidate.length > 0 &&
    (normalizedReference === normalizedCandidate ||
      normalizedCandidate.includes(normalizedReference) ||
      normalizedReference.includes(normalizedCandidate))
  );
};

const dedupeById = <T extends { id: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

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
          'mt-2 max-w-none osint-body-small prose prose-invert prose-p:my-0',
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
  eyebrow?: string;
  title?: string;
  body?: string;
  children?: React.ReactNode;
  className?: string;
}

const FollowUpDetailRow: React.FC<FollowUpDetailRowProps> = ({
  eyebrow: _eyebrow,
  title,
  body,
  children,
  className,
}) => {
  const questionText = normalizeText(body) || normalizeText(title);

  return (
    <article className={cx('border border-zinc-800/50 bg-zinc-950/70 p-3', className)}>
      <div className="osint-meta-value leading-snug text-zinc-300">{questionText}</div>
      {children}
    </article>
  );
};

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  report,
  workspaceTitle,
  focusedSectionId,
  focusedEvidenceId,
  navStack,
  onNavigate,
  onNotify,
  showPlaceholder,
  onStartNewCase,
  onTitleSave,
  onReportBodySave,
  onLeadOpen,
  onEntityClick,
}) => {
  const reportSources = report?.sources || [];
  const reportEntities = report?.entities || [];

  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(true);
  const [openSidebarSection, setOpenSidebarSection] = useState<
    'findings' | 'followUps' | 'entities' | 'resources' | null
  >('findings');
  const [editingTargetKey, setEditingTargetKey] = useState<string | null>(null);
  const [editingSectionDraft, setEditingSectionDraft] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | undefined>();
  const [editingSyncSummary, setEditingSyncSummary] = useState(true);
  const [localFocusedSectionId, setLocalFocusedSectionId] = useState<string | null>(null);
  const [localFocusedEvidenceId, setLocalFocusedEvidenceId] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const evidenceRefs = useRef<Record<string, HTMLElement | null>>({});

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const toggleSidebarAccordion = (
    section: 'findings' | 'followUps' | 'entities' | 'resources'
  ) => {
    setOpenSidebarSection((current) => (current === section ? null : section));
  };

  useEffect(() => {
    return () => stopAudio();
  }, [report?.id]);

  useEffect(() => {
    setEditingTargetKey(null);
    setEditingSectionId(undefined);
    setEditingSectionDraft('');
    setLocalFocusedSectionId(null);
    setLocalFocusedEvidenceId(null);
  }, [report?.id]);

  useEffect(() => {
    setLocalFocusedSectionId(null);
    setLocalFocusedEvidenceId(null);
  }, [focusedSectionId, focusedEvidenceId]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        /* audio already stopped */
      }
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const markdownComponents: {
    a: (props: ComponentProps<'a'>) => ReactElement;
    p: (props: ComponentProps<'p'>) => ReactElement;
  } = {
    a: ({ children, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300 no-underline transition hover:border-osint-primary hover:text-white"
      >
        {children}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </a>
    ),
    p: (props) => <p className="mb-4 last:mb-0" {...props} />,
  };

  const labelProfile = getLabelProfileById(report?.labelProfileId || report?.config?.labelProfileId);
  const purposeProfile = getPurposeProfileById(report?.purposeId || report?.config?.purposeId);
  const detailPanelTitle = workspaceTitle?.trim()
    ? workspaceTitle.trim()
    : navStack.find((item) => item.type === 'CASE')?.label || labelProfile.workspaceLabel;
  const { evidenceBySectionId, orderedSections, visibleEvidence } = buildArtifactViewerPresentation(
    report,
    purposeProfile
  );
  const canonicalFindings = report ? getArtifactKeyFindings(report) : [];
  const focusedEvidence =
    focusedEvidenceId && visibleEvidence.length > 0
      ? visibleEvidence.find((entry) => entry.id === focusedEvidenceId)
      : undefined;
  const keyFindingsSection = getSectionByKinds(orderedSections, ['KEY_FINDINGS']);
  const primarySummarySection = getSectionByKinds(orderedSections, ['EXECUTIVE_SUMMARY']);
  const methodologySection = getSectionByKinds(orderedSections, ['METHODOLOGY']);
  const summaryAnchorId = primarySummarySection?.id || `${report?.id || 'artifact'}-summary`;
  const keyFindingsAnchorId =
    keyFindingsSection?.id || `${report?.id || 'artifact'}-key-findings`;
  const highlightedSectionId =
    localFocusedSectionId || focusedSectionId || focusedEvidence?.sectionId || null;
  const highlightedEvidenceId = localFocusedEvidenceId || focusedEvidenceId || null;
  const visibleReportBody = primarySummarySection?.content || report?.summary || '';
  const visibleFollowUps: FollowUp[] = (() => {
    if (!report) return [];
    const canonical = getArtifactFollowUps(report);
    if (canonical.length > 0) return canonical;

    return getSectionItemsByKinds(orderedSections, ['LEADS', 'NEXT_STEPS']).map((item, index) => ({
      id: `report-follow-up-${index}`,
      kind: 'NEXT_STEP' as const,
      title: item.slice(0, 96),
      actionText: item,
      status: 'OPEN' as const,
    }));
  })();
  const hiddenSectionKinds = new Set(
    [
      primarySummarySection?.kind,
      'KEY_FINDINGS',
      'LEADS',
      'NEXT_STEPS',
      methodologySection?.kind,
      visibleEvidence.length > 0 ? 'EVIDENCE' : null,
    ].filter(Boolean)
  );
  const supplementalSections = orderedSections.filter(
    (section) =>
      !hiddenSectionKinds.has(section.kind) &&
      ((section.content && section.content.trim().length > 0) ||
        (section.items && section.items.length > 0))
  );
  const reportDisplayTitle = report ? sanitizeDisplayTitle(report.topic) : '';
  const provenanceMetadata = (report?.provenance?.metadata || {}) as Record<string, unknown>;
  const groundedClaimCount =
    typeof provenanceMetadata.groundedClaimCount === 'number'
      ? provenanceMetadata.groundedClaimCount
      : undefined;
  const inferredClaimCount =
    typeof provenanceMetadata.inferredClaimCount === 'number'
      ? provenanceMetadata.inferredClaimCount
      : undefined;
  const mainColumnClassName = isDetailSidebarOpen
    ? 'w-3/4 h-full overflow-y-auto custom-scrollbar border-r border-zinc-800'
    : 'flex-1 h-full overflow-y-auto custom-scrollbar';
  const detailActionButtonClassName = `${CHROME_ACTION_BUTTON_CLASS} h-8 px-2.5`;
  useEffect(() => {
    const nextTarget =
      (highlightedEvidenceId ? evidenceRefs.current[highlightedEvidenceId] : null) ||
      (highlightedSectionId ? sectionRefs.current[highlightedSectionId] : null);

    if (!nextTarget) return;

    nextTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [highlightedEvidenceId, highlightedSectionId, report?.id]);

  const startEditingSection = (body: string, sectionId?: string, syncSummary = true) => {
    setEditingTargetKey(sectionId || REPORT_BODY_EDIT_KEY);
    setEditingSectionId(sectionId);
    setEditingSectionDraft(body);
    setEditingSyncSummary(syncSummary);
  };

  const handleSaveSection = async () => {
    const trimmed = editingSectionDraft.trim();
    if (!trimmed) {
      onNotify('Artifact text cannot be empty.', 'INFO');
      return;
    }

    setIsSavingSection(true);
    try {
      await onReportBodySave(trimmed, editingSectionId, {
        syncSummary: editingSyncSummary,
      });
      setEditingTargetKey(null);
      setEditingSectionId(undefined);
      setEditingSectionDraft('');
    } catch (error) {
      console.error('Failed to save artifact text', error);
      onNotify('Failed to update artifact text.', 'ERROR');
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleCancelEditing = () => {
    setEditingTargetKey(null);
    setEditingSectionId(undefined);
    setEditingSectionDraft('');
  };

  const handlePlayBriefing = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }
    if (!visibleReportBody.trim()) return;

    setIsAudioLoading(true);
    try {
      const base64Audio = await generateAudioBriefing(visibleReportBody);
      const WebkitAudioContext =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!WebkitAudioContext) {
        onNotify('Audio playback is not supported in this browser.', 'INFO');
        return;
      }
      const ctx = new WebkitAudioContext({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      sourceNodeRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      console.error('Audio playback failed', error);
      onNotify('Failed to generate audio briefing.', 'ERROR');
    } finally {
      setIsAudioLoading(false);
    }
  };

  const jumpToSection = (sectionId: string) => {
    setLocalFocusedSectionId(sectionId);
    setLocalFocusedEvidenceId(null);
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const jumpToEvidence = (evidenceId: string) => {
    const evidence = visibleEvidence.find((entry) => entry.id === evidenceId);
    setLocalFocusedEvidenceId(evidenceId);
    setLocalFocusedSectionId(evidence?.sectionId || null);
    evidenceRefs.current[evidenceId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

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
      ].filter(Boolean)
    );

  const getMatchingSources = (references?: string[]) =>
    dedupeById(
      reportSources
        .filter((source) =>
          (references || []).some(
            (reference) =>
              matchesReference(reference, source.title) || matchesReference(reference, source.url)
          )
        )
        .map((source, index) => ({ ...source, id: `${source.url}-${index}` }))
    ).map(({ id: _id, ...source }) => source);

  const getMatchingEntity = (reference: string) => {
    const match = reportEntities.find((entity) => {
      const candidateName = typeof entity === 'string' ? entity : entity.name;
      return matchesReference(reference, candidateName);
    });

    if (!match) return null;
    return typeof match === 'string' ? { name: match, type: 'UNKNOWN' as const } : match;
  };

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
            className={cx(
              'inline-flex items-center gap-1 border px-2 py-1 osint-meta-label transition',
              highlightedEvidenceId === evidence.id
                ? 'border-osint-primary bg-osint-primary/15 text-white'
                : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-osint-primary hover:text-white'
            )}
          >
            <Globe className="h-3 w-3" />
            <span>{evidence.sourceTitle || evidence.title}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderSectionBody = (section: ArtifactSection) => {
    if (section.kind === 'TIMELINE' && section.items && section.items.length > 0) {
      const timelineItems = section.items;

      return (
        <div className="space-y-4">
          {timelineItems.map((item, index) => (
            <div key={`${section.id}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="mt-1 h-2 w-2 rounded-full bg-osint-primary" />
                {index < timelineItems.length - 1 ? (
                  <div className="mt-2 h-full w-px bg-zinc-700" />
                ) : null}
              </div>
              <div className="flex-1 pb-1">
                <div className="osint-meta-label">{`Step ${index + 1}`}</div>
                <div className="mt-2 max-w-none osint-body-small prose prose-invert prose-p:my-0">
                  <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.items && section.items.length > 0) {
      return (
        <div className="space-y-4">
          {section.items.map((item, index) => (
            <div key={`${section.id}-${index}`} className="border-l border-zinc-700 pl-4">
              <div className="osint-meta-label">{`${getArtifactSectionTitle(section.kind, labelProfile, section.title)} ${index + 1}`}</div>
              <div className="mt-2 max-w-none osint-body-small prose prose-invert prose-p:my-0">
                <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.content) {
      return (
        <div className="osint-prose max-w-none prose prose-invert">
          <ReactMarkdown components={markdownComponents}>{section.content}</ReactMarkdown>
        </div>
      );
    }

    return null;
  };

  const renderDocumentSection = (
    section: ArtifactSection,
    options?: {
      eyebrow?: string;
      editable?: boolean;
      saveSectionId?: string;
      syncSummary?: boolean;
    }
  ) => {
    const displayedSectionId = section.id;
    const saveSectionId = options?.saveSectionId;
    const editKey = saveSectionId || REPORT_BODY_EDIT_KEY;
    const isEditing = options?.editable && editingTargetKey === editKey;
    const linkedEvidence = evidenceBySectionId[displayedSectionId] || [];

    return (
      <section
        key={displayedSectionId}
        ref={(node) => {
          sectionRefs.current[displayedSectionId] = node;
        }}
        className={cx(
          'border bg-zinc-950/70 p-6 transition-colors',
          highlightedSectionId === displayedSectionId
            ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
            : 'border-zinc-800'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="min-w-0">
            {options?.eyebrow ? <div className="osint-eyebrow">{options.eyebrow}</div> : null}
            <h2
              className={cx(
                'font-osint-display osint-title-section',
                options?.eyebrow ? 'mt-2' : undefined
              )}
            >
              {getArtifactSectionTitle(section.kind, labelProfile, section.title)}
            </h2>
          </div>
          {options?.editable && section.content ? (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveSection}
                    disabled={isSavingSection}
                    className="inline-flex h-9 w-9 items-center justify-center border border-green-500/40 bg-green-500/10 text-green-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                    onClick={handleCancelEditing}
                    disabled={isSavingSection}
                    className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    title="Cancel editing"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    startEditingSection(
                      section.content || '',
                      saveSectionId,
                      options?.syncSummary ?? false
                    )
                  }
                  className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white"
                  title="Edit artifact text"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>

        {linkedEvidence.length > 0 ? renderEvidenceButtons(linkedEvidence) : null}

        <div className="mt-5">
          {isEditing ? (
            <textarea
              value={editingSectionDraft}
              onChange={(event) => setEditingSectionDraft(event.target.value)}
              className="min-h-[16rem] w-full resize-y border border-zinc-700 bg-black/70 p-4 osint-prose text-zinc-200 outline-none transition-colors focus:border-osint-primary"
              spellCheck={false}
            />
          ) : (
            renderSectionBody(section)
          )}
        </div>
      </section>
    );
  };

  if (showPlaceholder || !report) {
    return (
      <div className="relative flex flex-1 items-center justify-center bg-black">
        <EmptyState
          icon={FileText}
          title="No Workspace Selected"
          description="Select a saved workspace from the toolbar above or start a new run to begin."
          action={{
            label: 'Start New Run',
            onClick: onStartNewCase,
          }}
          panelClassName="max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 overflow-hidden bg-black animate-in fade-in duration-500">
      <div className={mainColumnClassName}>
        <div className="sticky top-0 z-20 border-b border-zinc-800 bg-black/90 px-6 py-4 backdrop-blur-md osint-header-shadow">
          <div className="mb-2 flex flex-col justify-between md:flex-row md:items-center">
            <Breadcrumbs items={navStack} onNavigate={onNavigate} />
            <div className="mt-2 flex items-center gap-3 md:mt-0">
              {report.dateStr ? (
                <p className="osint-meta-label whitespace-nowrap">LOG DATE: {report.dateStr}</p>
              ) : null}
              {!isDetailSidebarOpen ? (
                <button
                  type="button"
                  onClick={() => setIsDetailSidebarOpen(true)}
                  className="shrink-0 text-zinc-500 transition-colors hover:text-white"
                  title="Expand Artifact Details"
                  aria-label="Expand Artifact Details"
                >
                  <PanelRight className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="min-w-0">
            <EditableTitle
              value={report.topic}
              displayValue={reportDisplayTitle}
              onSave={onTitleSave}
              className="font-osint-display osint-title-page truncate uppercase"
              inputClassName="font-osint-display osint-title-page uppercase"
            />
          </div>
        </div>

        <div className="space-y-8 p-6">
          {visibleReportBody.trim().length > 0 ? (
            <section
              ref={(node) => {
                sectionRefs.current[summaryAnchorId] = node;
              }}
              className={cx(
                'relative overflow-hidden border bg-osint-panel/90 p-8 backdrop-blur-md osint-section-shadow transition-colors',
                highlightedSectionId === summaryAnchorId
                  ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                  : 'border-zinc-700'
              )}
            >
              <div className="absolute -right-16 -top-16 h-32 w-32 rounded-bl-full bg-white/5 transition-all" />
              <div className="relative z-10 flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="min-w-0">
                  <h2 className="font-osint-display osint-title-section">Executive Summary</h2>
                </div>
                <div className="flex items-center gap-2">
                  {editingTargetKey === (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveSection}
                        disabled={isSavingSection}
                        className="inline-flex h-9 w-9 items-center justify-center border border-green-500/40 bg-green-500/10 text-green-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
                        onClick={handleCancelEditing}
                        disabled={isSavingSection}
                        className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        title="Cancel editing"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEditingSection(visibleReportBody, primarySummarySection?.id, true)
                      }
                      className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white"
                      title="Edit artifact text"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePlayBriefing}
                    disabled={isAudioLoading}
                    className={cx(
                      'inline-flex h-9 w-9 items-center justify-center border transition-all',
                      isPlaying
                        ? 'osint-button-danger animate-pulse'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-white hover:text-white'
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

              {(focusedEvidenceId || focusedSectionId) && editingTargetKey !== (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                <div className="relative z-10 mt-4 inline-flex items-center border border-osint-primary/40 bg-osint-primary/10 px-2 py-1 osint-meta-label text-osint-primary">
                  Focused Reading Target
                </div>
              ) : null}

              {(evidenceBySectionId[primarySummarySection?.id || ''] || []).length > 0
                ? renderEvidenceButtons(evidenceBySectionId[primarySummarySection?.id || ''])
                : null}

              <div className="relative z-10 mt-6">
                {editingTargetKey === (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                  <textarea
                    value={editingSectionDraft}
                    onChange={(event) => setEditingSectionDraft(event.target.value)}
                    className="min-h-[18rem] w-full resize-y border border-zinc-700 bg-black/70 p-4 osint-prose text-zinc-200 outline-none transition-colors focus:border-osint-primary"
                    spellCheck={false}
                  />
                ) : (
                  <div className="osint-prose max-w-none prose prose-invert">
                    <ReactMarkdown components={markdownComponents}>{visibleReportBody}</ReactMarkdown>
                  </div>
                )}
              </div>

            </section>
          ) : null}

          {canonicalFindings.length > 0 ? (
            <section
              ref={(node) => {
                sectionRefs.current[keyFindingsAnchorId] = node;
              }}
              className={cx(
                'border bg-zinc-950/70 p-6 transition-colors',
                highlightedSectionId === keyFindingsAnchorId
                  ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                  : 'border-zinc-800'
              )}
            >
              <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="font-osint-display osint-title-section">Key Findings</h2>
                </div>
                <div className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300">
                  {`${canonicalFindings.length} records`}
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {canonicalFindings.map((finding, index) => {
                  const relatedEvidence = getFindingRelatedEvidence(finding);
                  const matchingSources = getMatchingSources(finding.supportRefs);
                  const findingOriginSectionId = finding.originSectionId;

                  return (
                    <article key={finding.id} className="border border-zinc-800 bg-black/40 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="osint-meta-label">{`Finding ${index + 1}`}</div>
                          <h3 className="mt-1 osint-panel-title text-white">{finding.title}</h3>
                        </div>
                        {finding.originSectionId ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (findingOriginSectionId) {
                                jumpToSection(findingOriginSectionId);
                              }
                            }}
                            className={detailActionButtonClassName}
                          >
                            Jump To Section
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 max-w-none osint-body-small prose prose-invert">
                        <ReactMarkdown components={markdownComponents}>
                          {finding.summary}
                        </ReactMarkdown>
                      </div>
                      {matchingSources.length > 0 ? (
                        <div className="mt-4">
                          <div className="osint-meta-label">Linked Sources</div>
                          {renderInlineSourceLinks(matchingSources)}
                        </div>
                      ) : null}
                      {finding.supportRefs && finding.supportRefs.length > 0 ? (
                        <div className="mt-4">
                          <div className="osint-meta-label">Support References</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {finding.supportRefs.map((reference) => (
                              <span
                                key={`${finding.id}-${reference}`}
                                className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300"
                              >
                                {reference}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {relatedEvidence.length > 0 ? (
                        <div className="mt-4">
                          <div className="osint-meta-label">Evidence Jumps</div>
                          {renderEvidenceButtons(relatedEvidence)}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {methodologySection?.content
            ? renderDocumentSection(methodologySection, {
                eyebrow: 'Method',
                editable: true,
                saveSectionId: methodologySection.id,
                syncSummary: false,
              })
            : null}

          {supplementalSections.length > 0 ? (
            <div className="space-y-6">
              {supplementalSections.map((section) =>
                renderDocumentSection(section, {
                  editable: Boolean(section.content),
                  saveSectionId: section.content ? section.id : undefined,
                  syncSummary: false,
                })
              )}
            </div>
          ) : null}

          {visibleEvidence.length > 0 ? (
            <section className="border border-zinc-800 bg-zinc-950/70 p-6">
              <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <div className="osint-eyebrow">Evidence Index</div>
                  <h2 className="mt-2 font-osint-display osint-title-section">Evidence Log</h2>
                </div>
                <div className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300">
                  {`${visibleEvidence.length} items`}
                </div>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {visibleEvidence.map((evidence) => (
                  <article
                    key={evidence.id}
                    ref={(node) => {
                      evidenceRefs.current[evidence.id] = node;
                    }}
                    className={cx(
                      'border bg-black/40 p-4 transition-colors',
                      highlightedEvidenceId === evidence.id
                        ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                        : 'border-zinc-800'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="osint-meta-label">{evidence.kind}</div>
                        <div className="mt-1 osint-meta-label-strong text-white">
                          {evidence.title}
                        </div>
                      </div>
                      {evidence.sectionId ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (evidence.sectionId) {
                              jumpToSection(evidence.sectionId);
                            }
                          }}
                          className={detailActionButtonClassName}
                        >
                          Jump To Section
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-3 osint-body-small leading-relaxed text-zinc-300">
                      {evidence.summary}
                    </p>
                    {evidence.quote ? (
                      <blockquote className="mt-3 border-l-2 border-osint-primary/40 pl-3 osint-body-muted italic">
                        {evidence.quote}
                      </blockquote>
                    ) : null}
                    {evidence.sourceUrl || evidence.sourceTitle ? (
                      <div className="mt-4">
                        {evidence.sourceUrl ? (
                          <a
                            href={evidence.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300 transition hover:border-osint-primary hover:text-white"
                          >
                            <Link2 className="h-3 w-3" />
                            <span>{evidence.sourceTitle || evidence.sourceUrl}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center border border-zinc-700 bg-zinc-950 px-2 py-1 osint-meta-label text-zinc-300">
                            {evidence.sourceTitle}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {isDetailSidebarOpen ? (
        <div className="flex h-full w-1/4 flex-col overflow-hidden bg-black/95">
          <div className="flex shrink-0 items-start justify-between border-b border-zinc-800 bg-zinc-900/30 p-4">
            <div className="min-w-0 pr-3">
              <div className="mb-1 osint-meta-label">Details</div>
              <h3 className="truncate font-mono osint-panel-title" title={detailPanelTitle}>
                {detailPanelTitle}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsDetailSidebarOpen(false)}
              className="mr-2 shrink-0 text-zinc-500 transition-colors hover:text-white"
              title="Collapse Artifact Details"
              aria-label="Collapse Artifact Details"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>

          <div className={`${CHROME_RAIL_BODY_CLASS} bg-zinc-900/10 custom-scrollbar`}>
            <Accordion
              title="Key Findings"
              count={canonicalFindings.length}
              icon={AlertTriangle}
              isOpen={openSidebarSection === 'findings'}
              onToggle={() => toggleSidebarAccordion('findings')}
              className={getRailAccordionClassName(openSidebarSection === 'findings')}
              headerClassName="text-osint-primary"
              contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {canonicalFindings.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet italic">
                    No canonical findings were extracted for this artifact.
                  </p>
                ) : (
                  canonicalFindings.map((finding, index) => {
                    const relatedEvidence = getFindingRelatedEvidence(finding);
                    const matchingSources = getMatchingSources(finding.supportRefs);

                    return (
                      <DetailRow
                        key={finding.id}
                        eyebrow={`Finding ${index + 1}`}
                        title={finding.title}
                        body={finding.summary}
                      >
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
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => jumpToSection(finding.originSectionId || keyFindingsAnchorId)}
                            className={detailActionButtonClassName}
                          >
                            Open In Document
                          </button>
                        </div>
                      </DetailRow>
                    );
                  })
                )}
              </div>
            </Accordion>

            <Accordion
              title={labelProfile.followUpLabel}
              count={visibleFollowUps.length}
              icon={Target}
              isOpen={openSidebarSection === 'followUps'}
              onToggle={() => toggleSidebarAccordion('followUps')}
              className={getRailAccordionClassName(openSidebarSection === 'followUps')}
              headerClassName="text-osint-primary"
              contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {visibleFollowUps.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet italic">
                    {`No ${labelProfile.followUpLabel.toLowerCase()} extracted for this artifact.`}
                  </p>
                ) : (
                  visibleFollowUps.map((followUp) => {
                    const questionText = normalizeText(getFollowUpText(followUp));
                    const matchingSources = getMatchingSources(followUp.sourceRefs);

                    return (
                      <FollowUpDetailRow
                        key={followUp.id}
                        className="border border-zinc-800/50 bg-zinc-950/70 p-3"
                        eyebrow={`${followUp.kind.replace(/_/g, ' ')} · ${followUp.status.replace(/_/g, ' ')}`}
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
                        <div className="mt-3 space-y-1">
                          <button
                            type="button"
                            onClick={() => onLeadOpen(followUp)}
                            className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                          >
                            Open
                          </button>
                          {followUp.originSectionId ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (followUp.originSectionId) {
                                  jumpToSection(followUp.originSectionId);
                                }
                              }}
                              className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                            >
                              Jump To Section
                            </button>
                          ) : null}
                        </div>
                      </FollowUpDetailRow>
                    );
                  })
                )}
              </div>
            </Accordion>

            <Accordion
              title="Entities"
              count={reportEntities.length}
              icon={Users}
              isOpen={openSidebarSection === 'entities'}
              onToggle={() => toggleSidebarAccordion('entities')}
              className={getRailAccordionClassName(openSidebarSection === 'entities')}
              contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
            >
              {reportEntities.length === 0 ? (
                <p className="px-2 py-1 osint-body-quiet italic">No entities detected.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {reportEntities.map((entity, index) => {
                    const normalizedEntity =
                      typeof entity === 'string'
                        ? { name: entity, type: 'UNKNOWN' as const }
                        : entity;

                    return (
                      <button
                        key={`${normalizedEntity.name}-${index}`}
                        type="button"
                        onClick={() => onEntityClick(normalizedEntity)}
                        className="flex items-center gap-2 border border-zinc-800/50 bg-zinc-900/20 p-2 text-left transition hover:border-osint-primary hover:bg-zinc-900"
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
              )}
            </Accordion>

            <Accordion
              title="Sources"
              count={reportSources.length}
              icon={Globe}
              isOpen={openSidebarSection === 'resources'}
              onToggle={() => toggleSidebarAccordion('resources')}
              className={getRailAccordionClassName(openSidebarSection === 'resources')}
              contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {[
                  [report.provenance?.provider, report.provenance?.modelId]
                    .filter((value): value is string => normalizeText(value).length > 0)
                    .join(' / '),
                  report.provenance?.generatedAt
                    ? `Generated ${formatTimestamp(report.provenance.generatedAt)}`
                    : null,
                  report.provenance?.search?.webSearchRequests
                    ? `Web search calls: ${report.provenance.search.webSearchRequests}`
                    : null,
                  groundedClaimCount !== undefined || inferredClaimCount !== undefined
                    ? `${groundedClaimCount ?? 0} grounded / ${inferredClaimCount ?? 0} inferred`
                    : null,
                ].some(Boolean) ? (
                  <div className="border border-zinc-800/50 bg-zinc-900/20 p-3">
                    <div className="osint-meta-label">Generation</div>
                    <div className="mt-2 space-y-1 osint-body-quiet text-zinc-400">
                      {[report.provenance?.provider, report.provenance?.modelId]
                        .filter((value): value is string => normalizeText(value).length > 0)
                        .join(' / ') ? (
                        <div>
                          {[report.provenance?.provider, report.provenance?.modelId]
                            .filter((value): value is string => normalizeText(value).length > 0)
                            .join(' / ')}
                        </div>
                      ) : null}
                      {report.provenance?.generatedAt ? (
                        <div>{`Generated ${formatTimestamp(report.provenance.generatedAt)}`}</div>
                      ) : null}
                      {report.provenance?.search?.webSearchRequests ? (
                        <div>{`Web search calls: ${report.provenance.search.webSearchRequests}`}</div>
                      ) : null}
                      {groundedClaimCount !== undefined || inferredClaimCount !== undefined ? (
                        <div>{`${groundedClaimCount ?? 0} grounded / ${inferredClaimCount ?? 0} inferred`}</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {report.provenance?.warnings?.length ? (
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
                  <div
                    key={evidence.id}
                    className="border border-zinc-800/50 bg-zinc-900/20 p-3"
                  >
                    <div className="osint-meta-label">{evidence.kind}</div>
                    <div className="mt-1 osint-meta-value text-zinc-300">{evidence.title}</div>
                    {evidence.sourceTitle || evidence.sourceUrl ? (
                      <div className="mt-1 osint-body-quiet text-zinc-400">
                        {evidence.sourceTitle || evidence.sourceUrl}
                      </div>
                    ) : null}
                    <div className="mt-3 space-y-1">
                      <button
                        type="button"
                        onClick={() => jumpToEvidence(evidence.id)}
                        className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                      >
                        Open Evidence
                      </button>
                      {evidence.sectionId ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (evidence.sectionId) {
                              jumpToSection(evidence.sectionId);
                            }
                          }}
                          className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                        >
                          Jump To Section
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {reportSources.length === 0 ? (
                  visibleEvidence.length === 0 ? (
                    <p className="px-2 py-1 osint-body-quiet italic">
                      No sources captured for this report.
                    </p>
                  ) : null
                ) : (
                  reportSources.map((source, index) => (
                    <a
                      key={`${source.url}-${index}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="osint-link-list-item block truncate border-b border-zinc-900 p-2 last:border-0"
                    >
                      <Link2 className="mr-1 inline h-3 w-3" />
                      <span className="osint-body-quiet text-zinc-400">
                        {source.title || source.url}
                      </span>
                    </a>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </div>
      ) : null}
    </div>
  );
};
