import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Check,
  FileText,
  Globe,
  Loader2,
  Pencil,
  StopCircle,
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
import { MainContentDotGrid } from '../../ui/MainContentDotGrid';
import { generateAudioBriefing } from '../../../services/runtime';
import { decodeBase64, decodeAudioData } from '../../../utils/audio';
import {
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_CARD_SURFACE_CLASS,
  getChromeMenuButtonClass,
  CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
} from '../../ui/chrome';
import { buildArtifactViewerPresentation } from './artifactViewerPresentation';
import { buildArtifactViewerBody, buildArtifactViewerBodyBlocks } from './artifactViewerText';
import { getEntityToneClass } from '@/utils/entityPalette';

interface ArtifactViewerProps {
  report: Artifact | null;
  focusedSectionId?: string;
  focusedEvidenceId?: string;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onNotify: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  showPlaceholder: boolean;
  onStartWorkspace: () => void;
  onTitleSave: (newTitle: string) => void;
  onReportBodySave: (
    body: string,
    sectionId?: string,
    options?: { syncSummary?: boolean }
  ) => Promise<void>;
  onFollowUpOpen: (followUp: FollowUp) => void;
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

const ARTIFACT_VIEWER_SECTION_CLASS = `${CHROME_CARD_SURFACE_CLASS} osint-shell-stage-surface p-6 transition-colors`;

const ARTIFACT_VIEWER_SUBSECTION_CLASS = `${CHROME_CARD_SECTION_SUBTLE_CLASS} osint-shell-stage-surface-subtle p-4 transition-colors`;

const SECTION_HEADER_CLASS =
  'flex items-center justify-between gap-4 border-b border-zinc-800 pb-4';

const SECTION_HEADER_ACTION_GROUP_CLASS = 'flex items-center gap-2';

const SECTION_HEADER_ICON_BUTTON_CLASS =
  'osint-icon-button-plain inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60';

const SECTION_HEADER_SUCCESS_ICON_BUTTON_CLASS =
  'osint-icon-button-plain-success inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60';

const REPORT_MENU_BUTTON_CLASS = `${getChromeMenuButtonClass(false)} osint-meta-label-strong inline-flex h-9 items-center justify-center px-3`;

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  report,
  focusedSectionId,
  focusedEvidenceId,
  navStack,
  onNavigate,
  onNotify,
  showPlaceholder,
  onStartWorkspace,
  onTitleSave,
  onReportBodySave,
  onFollowUpOpen,
  onEntityClick,
}) => {
  const reportSources = report?.sources || [];
  const reportEntities = report?.entities || [];

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
        className="osint-inline-text-link osint-body-small text-[color:var(--osint-text-strong)] no-underline"
      >
        {children}
      </a>
    ),
    p: (props) => <p className="mb-4 last:mb-0" {...props} />,
  };

  const labelProfile = getLabelProfileById(
    report?.labelProfileId || report?.config?.labelProfileId
  );
  const purposeProfile = getPurposeProfileById(report?.purposeId || report?.config?.purposeId);
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
  const keyFindingsAnchorId = keyFindingsSection?.id || `${report?.id || 'artifact'}-key-findings`;
  const highlightedSectionId =
    localFocusedSectionId || focusedSectionId || focusedEvidence?.sectionId || null;
  const highlightedEvidenceId = localFocusedEvidenceId || focusedEvidenceId || null;
  const visibleReportBodyBlocks = buildArtifactViewerBodyBlocks({
    report,
    orderedSections,
    labelProfile,
  });
  const visibleReportBody = buildArtifactViewerBody({
    report,
    orderedSections,
    labelProfile,
  });
  const editableReportBody = primarySummarySection?.content || report?.summary || '';
  const isCompositeReportBody =
    normalizeText(visibleReportBody) !== normalizeText(editableReportBody);
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
  const shouldRenderDiscreteReportSections = false;
  const reportDisplayTitle = report ? sanitizeDisplayTitle(report.topic) : '';
  const mainColumnClassName = 'flex-1 h-full overflow-y-auto custom-scrollbar';
  const detailActionButtonClassName = CHROME_THIN_ACTION_BUTTON_CLASS;
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

  const renderInlineSourceLinks = (sources: { title?: string; url: string }[]) => {
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
                  <div className="osint-shell-rule mt-2 h-full w-px" />
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
          ARTIFACT_VIEWER_SECTION_CLASS,
          highlightedSectionId === displayedSectionId
            ? 'osint-shell-highlight-surface'
            : undefined
        )}
      >
        <div className={SECTION_HEADER_CLASS}>
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
            <div className={SECTION_HEADER_ACTION_GROUP_CLASS}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveSection}
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
                    onClick={handleCancelEditing}
                    disabled={isSavingSection}
                    className={SECTION_HEADER_ICON_BUTTON_CLASS}
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
                  className={SECTION_HEADER_ICON_BUTTON_CLASS}
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
              className="osint-input-field min-h-[16rem] w-full resize-y p-4 osint-prose"
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
      <div className="osint-page-stage-shell osint-shell-content-surface relative flex flex-1 items-center justify-center">
        <EmptyState
          icon={FileText}
          title="No Workspace Selected"
          description="Select a saved workspace from the toolbar above or start a new run to begin."
          action={{
            label: 'Start New Run',
            onClick: onStartWorkspace,
          }}
          panelClassName="max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="osint-page-stage-shell osint-shell-content-surface relative flex flex-1 overflow-hidden animate-in fade-in duration-500">
      <div className={mainColumnClassName} data-app-scroll-region>
        <div className="relative">
          <MainContentDotGrid testId="artifact-viewer-dot-grid-background" />
          <div
            data-testid="artifact-viewer-top-header"
            className={`relative z-10 px-6 pb-2 pt-4 ${CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS}`}
          >
            <div className="flex h-full flex-col justify-center gap-2 md:flex-row md:items-center md:justify-between">
              <Breadcrumbs items={navStack} onNavigate={onNavigate} />
              <div className="flex items-center gap-3">
                {report.dateStr ? (
                  <p className="osint-meta-label whitespace-nowrap">LOG DATE: {report.dateStr}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div data-testid="artifact-viewer-title-surface" className="relative z-10 px-6 py-5">
            <EditableTitle
              value={report.topic}
              displayValue={reportDisplayTitle}
              onSave={onTitleSave}
              className="font-osint-display osint-title-page text-[clamp(var(--font-size-xl),calc(var(--font-size-lg)+0.8vw),var(--font-size-3xl))] leading-tight uppercase"
              inputClassName="font-osint-display osint-title-page text-[clamp(var(--font-size-xl),calc(var(--font-size-lg)+0.8vw),var(--font-size-3xl))] uppercase"
            />
          </div>

          <div className="relative z-10 space-y-8 px-6 pb-6 pt-6">
            {visibleReportBody.trim().length > 0 ? (
              <section
                ref={(node) => {
                  sectionRefs.current[summaryAnchorId] = node;
                }}
                className={cx(
                  ARTIFACT_VIEWER_SECTION_CLASS,
                  highlightedSectionId === summaryAnchorId
                    ? 'osint-shell-highlight-surface'
                    : undefined
                )}
              >
                <div className={SECTION_HEADER_CLASS}>
                  <div className="min-w-0">
                    <h2 className="font-osint-display osint-title-section">Executive Summary</h2>
                  </div>
                  <div className={SECTION_HEADER_ACTION_GROUP_CLASS}>
                    {!isCompositeReportBody &&
                    editingTargetKey === (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSaveSection}
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
                          onClick={handleCancelEditing}
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
                        onClick={() =>
                          startEditingSection(editableReportBody, primarySummarySection?.id, true)
                        }
                        className={SECTION_HEADER_ICON_BUTTON_CLASS}
                        title="Edit artifact text"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handlePlayBriefing}
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

                {(focusedEvidenceId || focusedSectionId) &&
                editingTargetKey !== (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                  <div className="mt-4 inline-flex items-center px-2 py-1 osint-meta-label text-osint-primary">
                    Focused Reading Target
                  </div>
                ) : null}

                {(evidenceBySectionId[primarySummarySection?.id || ''] || []).length > 0
                  ? renderEvidenceButtons(evidenceBySectionId[primarySummarySection?.id || ''])
                  : null}

                <div className="mt-6">
                  {!isCompositeReportBody &&
                  editingTargetKey === (primarySummarySection?.id || REPORT_BODY_EDIT_KEY) ? (
                    <textarea
                      value={editingSectionDraft}
                      onChange={(event) => setEditingSectionDraft(event.target.value)}
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
                      <ReactMarkdown components={markdownComponents}>
                        {visibleReportBody}
                      </ReactMarkdown>
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
                  ARTIFACT_VIEWER_SECTION_CLASS,
                  highlightedSectionId === keyFindingsAnchorId
                    ? 'osint-shell-highlight-surface'
                    : undefined
                )}
              >
                <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="font-osint-display osint-title-section">Key Findings</h2>
                  </div>
                  <div className="osint-meta-label">
                    {`${canonicalFindings.length} records`}
                  </div>
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

            {visibleFollowUps.length > 0 ? (
              <section className={ARTIFACT_VIEWER_SECTION_CLASS}>
                <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="font-osint-display osint-title-section">Next Steps</h2>
                  </div>
                  <div className="osint-meta-label">
                    {`${visibleFollowUps.length} records`}
                  </div>
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
                            {renderInlineSourceLinks(matchingSources)}
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
                              onClick={() => jumpToSection(followUp.originSectionId as string)}
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
            ) : null}

            {shouldRenderDiscreteReportSections && methodologySection?.content
              ? renderDocumentSection(methodologySection, {
                  eyebrow: 'Method',
                  editable: true,
                  saveSectionId: methodologySection.id,
                  syncSummary: false,
                })
              : null}

            {shouldRenderDiscreteReportSections ? (
              <div className="space-y-6">
                {orderedSections
                  .filter(
                    (section) =>
                      ![
                        primarySummarySection?.kind,
                        'KEY_FINDINGS',
                        methodologySection?.kind,
                        visibleEvidence.length > 0 ? 'EVIDENCE' : null,
                      ]
                        .filter(Boolean)
                        .includes(section.kind) &&
                      ((section.content && section.content.trim().length > 0) ||
                        (section.items && section.items.length > 0))
                  )
                  .map((section) =>
                    renderDocumentSection(section, {
                      editable: Boolean(section.content),
                      saveSectionId: section.content ? section.id : undefined,
                      syncSummary: false,
                    })
                  )}
              </div>
            ) : null}

            {visibleEvidence.length > 0 ? (
              <section className={ARTIFACT_VIEWER_SECTION_CLASS}>
                <div className="flex items-end justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="osint-eyebrow">Evidence Index</div>
                    <h2 className="mt-2 font-osint-display osint-title-section">Evidence Log</h2>
                  </div>
                  <div className="osint-shell-chip inline-flex items-center px-2 py-1 osint-meta-label">
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
                        ARTIFACT_VIEWER_SUBSECTION_CLASS,
                        highlightedEvidenceId === evidence.id
                          ? 'osint-shell-highlight-surface'
                          : undefined
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="osint-meta-label">{evidence.kind}</div>
                          <div className="mt-1 osint-meta-label-strong text-[color:var(--osint-text-heading)]">
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
                      <p className="mt-3 osint-body-small leading-relaxed text-[color:var(--osint-text-strong)]">
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
                              className="osint-inline-text-link osint-meta-label"
                            >
                              <span>{evidence.sourceTitle || evidence.sourceUrl}</span>
                            </a>
                          ) : (
                            <span className="osint-inline-reference osint-meta-label">
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
      </div>
    </div>
  );
};
