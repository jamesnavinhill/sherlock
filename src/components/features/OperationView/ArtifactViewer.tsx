import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  AlertTriangle,
  Users,
  Globe,
  Target,
  Volume2,
  Loader2,
  StopCircle,
  Link2,
  PanelRight,
  ShieldAlert,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';
import type { Artifact, Entity, FollowUp } from '../../../types';
import {
  getArtifactFollowUps,
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
  onReportBodySave: (body: string, sectionId?: string) => Promise<void>;
  onLeadOpen: (followUp: FollowUp) => void;
  onEntityClick: (entity: Entity) => void;
}

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
  const DETAIL_SECTION_SCROLL_CLASS =
    'max-h-[min(24rem,calc(100svh-20rem))] overflow-y-auto overscroll-contain pr-1 custom-scrollbar';
  const reportSources = report?.sources || [];

  // --- Right Column Accordions State ---
  const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(true);
  const [openSidebarSection, setOpenSidebarSection] = useState<
    'anomalies' | 'followUps' | 'entities' | 'resources' | null
  >('anomalies');
  const [isEditingReportBody, setIsEditingReportBody] = useState(false);
  const [reportBodyDraft, setReportBodyDraft] = useState('');
  const [isSavingReportBody, setIsSavingReportBody] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const evidenceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleSidebarAccordion = (
    section: 'anomalies' | 'followUps' | 'entities' | 'resources'
  ) => {
    setOpenSidebarSection((current) => (current === section ? null : section));
  };

  // --- Audio State ---
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup audio on unmount or report change
  useEffect(() => {
    return () => stopAudio();
  }, [report?.id]);

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

  // --- Markdown Configuration ---
  const markdownComponents: {
    a: (props: ComponentProps<'a'>) => ReactElement;
    p: (props: ComponentProps<'p'>) => ReactElement;
  } = {
    a: ({ children, ...props }) => (
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className="text-osint-primary bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded hover:bg-osint-primary/10 hover:text-osint-ink hover:border-osint-primary/40 transition-all duration-200 font-medium no-underline inline-flex items-center gap-1 mx-0.5 text-[0.95em]"
      >
        {children}
        <Link2 className="w-3 h-3 opacity-70" />
      </a>
    ),
    p: (props) => <p className="mb-4 last:mb-0" {...props} />,
  };

  const renderSectionBody = (section: NonNullable<Artifact['sections']>[number]) => {
    if (section.kind === 'TIMELINE' && section.items && section.items.length > 0) {
      const items = section.items;
      return (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${section.id}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-osint-primary mt-2" />
                {index < items.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-2" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="mb-1 osint-meta-label">{`Step ${index + 1}`}</div>
                <div className="osint-body-small">
                  <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (section.items && section.items.length > 0) {
      const gridKinds = new Set([
        'KEY_FINDINGS',
        'ANOMALIES',
        'IMPLICATIONS',
        'LEADS',
        'NEXT_STEPS',
      ]);
      const itemClass = gridKinds.has(section.kind)
        ? 'bg-zinc-900/70 border border-zinc-800 p-4'
        : 'border-l-2 border-osint-primary/40 pl-3 text-sm text-zinc-300';

      return (
        <div className={gridKinds.has(section.kind) ? 'grid md:grid-cols-2 gap-3' : 'space-y-2'}>
          {section.items.map((item, index) => (
            <div key={`${section.id}-${index}`} className={itemClass}>
              <ReactMarkdown components={markdownComponents}>{item}</ReactMarkdown>
            </div>
          ))}
        </div>
      );
    }

    if (section.content) {
      return (
        <div className="osint-body-small prose prose-invert max-w-none">
          <ReactMarkdown components={markdownComponents}>{section.content}</ReactMarkdown>
        </div>
      );
    }

    return null;
  };

  const labelProfile = getLabelProfileById(report?.labelProfileId || report?.config?.labelProfileId);
  const purposeProfile = getPurposeProfileById(report?.purposeId || report?.config?.purposeId);
  const detailPanelTitle = workspaceTitle?.trim()
    ? workspaceTitle.trim()
    : navStack.find((item) => item.type === 'CASE')?.label || labelProfile.workspaceLabel;
  const {
    artifactTypeLabel,
    evidenceBySectionId,
    orderedSections,
    provenanceSummary,
    readingHighlights,
    visibleEvidence,
  } = buildArtifactViewerPresentation(report, purposeProfile);
  const focusedEvidence =
    focusedEvidenceId && visibleEvidence.length > 0
      ? visibleEvidence.find((entry) => entry.id === focusedEvidenceId)
      : undefined;
  const highlightedSectionId = focusedSectionId || focusedEvidence?.sectionId;
  const primarySummarySection = getSectionByKinds(orderedSections, [
    'EXECUTIVE_SUMMARY',
    'KEY_FINDINGS',
  ]);
  const methodologySection = getSectionByKinds(orderedSections, ['METHODOLOGY']);
  const visibleReportBody = primarySummarySection?.content || report?.summary || '';
  const editableReportSectionId =
    primarySummarySection?.kind === 'EXECUTIVE_SUMMARY' ? primarySummarySection.id : undefined;
  const visibleFollowUps = (() => {
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
  const visibleAnomalies =
    report?.agendas && report.agendas.length > 0
      ? report.agendas
      : getSectionItemsByKinds(orderedSections, ['ANOMALIES', 'KEY_FINDINGS']);
  const hiddenSectionKinds = new Set(
    [
        primarySummarySection?.kind,
        'ANOMALIES',
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
  const mainColumnClassName = isDetailSidebarOpen
    ? 'w-3/4 h-full overflow-y-auto custom-scrollbar border-r border-zinc-800'
    : 'flex-1 h-full overflow-y-auto custom-scrollbar';
  const reportDisplayTitle = report ? sanitizeDisplayTitle(report.topic) : '';
  const readingPatternPanelStyle = {
    backgroundColor: 'color-mix(in oklab, var(--osint-panel) 96%, transparent)',
    borderColor: 'color-mix(in oklab, var(--osint-ink) 12%, transparent)',
  } as const;
  const readingPatternCardStyle = {
    backgroundColor: 'color-mix(in oklab, var(--osint-surface) 74%, var(--osint-panel))',
    borderColor: 'color-mix(in oklab, var(--osint-ink) 10%, transparent)',
  } as const;
  const readingPatternAccentCardStyle = {
    backgroundColor: 'color-mix(in oklab, var(--osint-primary) 10%, var(--osint-surface))',
    borderColor: 'color-mix(in oklab, var(--osint-primary) 28%, var(--osint-surface))',
  } as const;
  const readingPatternWarningCardStyle = {
    backgroundColor: 'color-mix(in oklab, var(--color-osint-danger) 10%, var(--osint-surface))',
    borderColor: 'color-mix(in oklab, var(--color-osint-danger) 26%, var(--osint-panel))',
  } as const;

  useEffect(() => {
    if (!isEditingReportBody) {
      setReportBodyDraft(visibleReportBody);
    }
  }, [isEditingReportBody, visibleReportBody]);

  useEffect(() => {
    const nextTarget =
      (focusedEvidenceId ? evidenceRefs.current[focusedEvidenceId] : null) ||
      (highlightedSectionId ? sectionRefs.current[highlightedSectionId] : null);

    if (!nextTarget) return;

    nextTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusedEvidenceId, highlightedSectionId, report?.id]);

  const handleSaveReportBody = async () => {
    const trimmed = reportBodyDraft.trim();
    if (!trimmed) {
      onNotify('Artifact text cannot be empty.', 'INFO');
      return;
    }

    if (trimmed === visibleReportBody.trim()) {
      setIsEditingReportBody(false);
      return;
    }

    setIsSavingReportBody(true);
    try {
      await onReportBodySave(trimmed, editableReportSectionId);
      setIsEditingReportBody(false);
    } catch (error) {
      console.error('Failed to save report body', error);
      onNotify('Failed to update artifact text.', 'ERROR');
    } finally {
      setIsSavingReportBody(false);
    }
  };

  const handleCancelReportBodyEdit = () => {
    setReportBodyDraft(visibleReportBody);
    setIsEditingReportBody(false);
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

  // --- RENDER ---
  if (showPlaceholder || !report) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black relative">
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
    <div className="flex-1 flex overflow-hidden bg-black relative animate-in fade-in duration-500">
      {/* MAIN COLUMN (Title + Report Body) - 3/4 Width */}
      <div className={mainColumnClassName}>
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-6 py-4 bg-black/90 backdrop-blur-md border-b border-zinc-800 osint-header-shadow">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
            <Breadcrumbs items={navStack} onNavigate={onNavigate} />
            <div className="mt-2 md:mt-0 flex items-center gap-3">
              {report.dateStr && (
                <p className="osint-meta-label whitespace-nowrap">
                  LOG DATE: {report.dateStr}
                </p>
              )}
              {!isDetailSidebarOpen ? (
                <button
                  onClick={() => setIsDetailSidebarOpen(true)}
                  className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                  title="Expand Artifact Details"
                  aria-label="Expand Artifact Details"
                >
                  <PanelRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
          <div className="min-w-0">
            <EditableTitle
              value={report.topic}
              displayValue={reportDisplayTitle}
              onSave={onTitleSave}
              className="font-osint-display osint-title-page uppercase truncate"
              inputClassName="font-osint-display osint-title-page uppercase"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 border p-4" style={readingPatternPanelStyle}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="osint-meta-label">
                {artifactTypeLabel} Reading Pattern
              </div>
              <div className="osint-meta-label">
                Provenance at a glance
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-3 md:grid-cols-3">
                {readingHighlights.map((highlight) => (
                  <div key={highlight.label} className="border p-3" style={readingPatternCardStyle}>
                    <div className="osint-meta-label">
                      {highlight.label}
                    </div>
                    <div className="mt-2 osint-body-small text-[color:var(--osint-ink)]">
                      {highlight.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {provenanceSummary.map((stat) => (
                  <div
                    key={stat.label}
                    className="border p-3"
                    style={
                      stat.tone === 'WARNING'
                        ? readingPatternWarningCardStyle
                        : stat.tone === 'ACCENT'
                          ? readingPatternAccentCardStyle
                          : readingPatternCardStyle
                    }
                  >
                    <div className="osint-meta-label">
                      {stat.label}
                    </div>
                    <div className="mt-2 osint-body-small text-[color:var(--osint-ink)]">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report Body */}
          <div
            ref={(node) => {
              if (primarySummarySection?.id) {
                sectionRefs.current[primarySummarySection.id] = node;
              }
            }}
            className={`bg-osint-panel/90 backdrop-blur-md p-8 border osint-section-shadow relative overflow-hidden group mb-8 transition-colors ${
              highlightedSectionId === primarySummarySection?.id
                ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                : 'border-zinc-700'
            }`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-white/10"></div>
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-2 relative z-10">
              <h2 className="font-osint-display osint-title-section flex items-center tracking-wide">
                <FileText className="w-5 h-5 mr-3 text-osint-primary" /> {artifactTypeLabel}
              </h2>
              <div className="flex items-center gap-2">
                {isEditingReportBody ? (
                  <>
                    <button
                      onClick={handleSaveReportBody}
                      disabled={isSavingReportBody}
                      className="inline-flex h-9 w-9 items-center justify-center border border-green-500/40 bg-green-500/10 text-green-300 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      title="Save artifact text"
                      aria-label="Save"
                    >
                      {isSavingReportBody ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelReportBodyEdit}
                      disabled={isSavingReportBody}
                      className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      title="Cancel editing"
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingReportBody(true)}
                    className="inline-flex h-9 w-9 items-center justify-center border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-white hover:text-white"
                    title="Edit artifact text"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handlePlayBriefing}
                  disabled={isAudioLoading}
                  className={`inline-flex h-9 w-9 items-center justify-center transition-all border ${isPlaying ? 'osint-button-danger animate-pulse' : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-white'}`}
                  aria-label={isPlaying ? 'Stop audio briefing' : 'Play audio briefing'}
                  title={isPlaying ? 'Stop audio briefing' : 'Play audio briefing'}
                >
                  {isAudioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <StopCircle className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {primarySummarySection && (evidenceBySectionId[primarySummarySection.id] || []).length > 0 ? (
              <div className="relative z-10 mb-4 flex flex-wrap gap-2">
                {evidenceBySectionId[primarySummarySection.id].slice(0, 4).map((evidence) => (
                  <span
                    key={evidence.id}
                    className={`rounded-none border px-2 py-1 osint-meta-label ${
                      focusedEvidenceId === evidence.id
                        ? 'border-osint-primary bg-osint-primary/20 text-white'
                        : 'border-osint-primary/30 bg-osint-primary/10 text-osint-primary'
                    }`}
                  >
                    {evidence.sourceTitle || evidence.title}
                  </span>
                ))}
              </div>
            ) : null}
            {focusedEvidenceId || focusedSectionId ? (
              <div className="relative z-10 mb-4 inline-flex items-center border border-osint-primary/40 bg-osint-primary/10 px-2 py-1 osint-meta-label text-osint-primary">
                Focused Reading Target
              </div>
            ) : null}
            {isEditingReportBody ? (
              <textarea
                value={reportBodyDraft}
                onChange={(event) => setReportBodyDraft(event.target.value)}
                className="relative z-10 min-h-[18rem] w-full resize-y border border-zinc-700 bg-black/70 p-4 osint-prose text-zinc-200 outline-none transition-colors focus:border-osint-primary"
                spellCheck={false}
              />
            ) : (
              <div className="relative z-10 osint-prose prose prose-invert max-w-none">
                <ReactMarkdown components={markdownComponents}>{visibleReportBody}</ReactMarkdown>
              </div>
            )}
          </div>

          {methodologySection?.content && (
            <div
              ref={(node) => {
                sectionRefs.current[methodologySection.id] = node;
              }}
              className={`mb-8 border bg-zinc-950/70 p-5 transition-colors ${
                highlightedSectionId === methodologySection.id
                  ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                  : 'border-zinc-800'
              }`}
            >
              <h3 className="mb-3 osint-meta-label-strong">
                {getArtifactSectionTitle(
                  methodologySection.kind,
                  labelProfile,
                  methodologySection.title
                )}
              </h3>
              {(evidenceBySectionId[methodologySection.id] || []).length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {evidenceBySectionId[methodologySection.id].slice(0, 3).map((evidence) => (
                    <span
                      key={evidence.id}
                      className={`rounded-none border px-2 py-1 osint-meta-label ${
                        focusedEvidenceId === evidence.id
                          ? 'border-osint-primary bg-osint-primary/20 text-white'
                          : 'border-osint-primary/30 bg-osint-primary/10 text-osint-primary'
                      }`}
                    >
                      {evidence.sourceTitle || evidence.title}
                    </span>
                  ))}
                </div>
              ) : null}
              {renderSectionBody(methodologySection)}
            </div>
          )}

          {visibleEvidence.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
                <h2 className="osint-meta-label-strong flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-osint-primary" /> Evidence Log
                </h2>
                <span className="osint-meta-label">
                  {visibleEvidence.length} items
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleEvidence.map((evidence) => (
                  <div
                    key={evidence.id}
                    ref={(node) => {
                      evidenceRefs.current[evidence.id] = node;
                    }}
                    className={`border bg-zinc-950/70 p-4 transition-colors ${
                      focusedEvidenceId === evidence.id
                        ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                        : 'border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="osint-meta-label-strong text-white">
                        {evidence.title}
                      </div>
                      <div className="osint-meta-label">
                        {evidence.kind}
                      </div>
                    </div>
                    <p className="osint-body-small leading-relaxed">{evidence.summary}</p>
                    {evidence.quote && (
                      <blockquote className="mt-3 border-l-2 border-osint-primary/40 pl-3 osint-body-muted italic">
                        {evidence.quote}
                      </blockquote>
                    )}
                    {(evidence.sourceTitle || evidence.sourceUrl) && (
                      <div className="mt-3 osint-meta-label">
                        {evidence.sourceUrl ? (
                          <a
                            href={evidence.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="osint-link-list-item inline-flex items-center border-b-0 p-0 osint-meta-label"
                          >
                            <Link2 className="w-3 h-3 mr-1" />
                            {evidence.sourceTitle || evidence.sourceUrl}
                          </a>
                        ) : (
                          evidence.sourceTitle
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {supplementalSections.length > 0 && (
            <div className="space-y-4 mb-8">
              {supplementalSections.map((section) => (
                <div
                  key={section.id}
                  ref={(node) => {
                    sectionRefs.current[section.id] = node;
                  }}
                  className={`bg-zinc-950/60 border p-5 transition-colors ${
                    highlightedSectionId === section.id
                      ? 'border-osint-primary shadow-[0_0_0_1px_rgba(231,255,77,0.35)]'
                      : 'border-zinc-800'
                  }`}
                >
                  <h3 className="mb-3 osint-meta-label-strong">
                    {getArtifactSectionTitle(section.kind, labelProfile, section.title)}
                  </h3>
                  {(evidenceBySectionId[section.id] || []).length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {evidenceBySectionId[section.id].slice(0, 3).map((evidence) => (
                        <span
                          key={evidence.id}
                          className={`rounded-none border px-2 py-1 osint-meta-label ${
                            focusedEvidenceId === evidence.id
                              ? 'border-osint-primary bg-osint-primary/20 text-white'
                              : 'border-osint-primary/30 bg-osint-primary/10 text-osint-primary'
                          }`}
                        >
                          {evidence.sourceTitle || evidence.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {renderSectionBody(section)}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* RIGHT SIDE COLUMN (Anomalies, Entities, Resources) - 1/4 Width */}
      {isDetailSidebarOpen && (
        <div className="flex h-full w-1/4 flex-col overflow-hidden bg-black/95">
          <div className="flex items-start justify-between border-b border-zinc-800 bg-zinc-900/30 p-4 flex-shrink-0">
            <div className="min-w-0 pr-3">
              <div className="mb-1 osint-meta-label">
                {labelProfile.workspaceLabel} DETAILS
              </div>
              <h3
                className="truncate osint-panel-title font-mono"
                title={detailPanelTitle}
              >
                {detailPanelTitle}
              </h3>
            </div>
            <button
              onClick={() => setIsDetailSidebarOpen(false)}
              className="mr-2 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
              title="Collapse Artifact Details"
              aria-label="Collapse Artifact Details"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 bg-zinc-900/10 custom-scrollbar">
            {/* Anomalies */}
            <Accordion
              title={`${labelProfile.anomalyLabel} (${visibleAnomalies.length})`}
              icon={AlertTriangle}
              isOpen={openSidebarSection === 'anomalies'}
              onToggle={() => toggleSidebarAccordion('anomalies')}
              className="mb-2"
              headerClassName="text-osint-primary"
              contentClassName={DETAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {visibleAnomalies.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet italic">{`No ${labelProfile.anomalyLabel.toLowerCase()} extracted for this artifact.`}</p>
                ) : (
                  visibleAnomalies.map((agenda, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/80 p-3 border-l-2 border-osint-primary text-xs text-zinc-300"
                    >
                      <ReactMarkdown components={markdownComponents}>{agenda}</ReactMarkdown>
                    </div>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title={`${labelProfile.followUpLabel} (${visibleFollowUps.length})`}
              icon={Target}
              isOpen={openSidebarSection === 'followUps'}
              onToggle={() => toggleSidebarAccordion('followUps')}
              className="mb-2"
              headerClassName="text-osint-primary"
              contentClassName={DETAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {visibleFollowUps.length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet italic">
                    {`No ${labelProfile.followUpLabel.toLowerCase()} extracted for this artifact.`}
                  </p>
                ) : (
                  <>
                    {visibleFollowUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className="border border-zinc-800 bg-zinc-900/60 p-3"
                      >
                        <div className="mb-2 osint-meta-label">
                          {followUp.kind.replace(/_/g, ' ')}
                        </div>
                        <div className="mb-3 osint-body-small leading-relaxed prose prose-invert max-w-none prose-p:my-0">
                          <ReactMarkdown components={markdownComponents}>
                            {getFollowUpText(followUp)}
                          </ReactMarkdown>
                        </div>
                        <button
                          onClick={() => onLeadOpen(followUp)}
                          className="osint-button-primary w-full py-1 text-[10px] font-bold uppercase"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Accordion>

            {/* Entities List */}
            <Accordion
              title={`Entities (${(report.entities || []).length})`}
              icon={Users}
              isOpen={openSidebarSection === 'entities'}
              onToggle={() => toggleSidebarAccordion('entities')}
              className="mb-2"
              contentClassName={DETAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-1">
                {(report.entities || []).length === 0 ? (
                  <p className="px-2 py-1 osint-body-quiet italic">
                    No entities detected.
                  </p>
                ) : (
                  (report.entities || []).map((e, idx) => {
                    const name = typeof e === 'string' ? e : e.name;
                    const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          onEntityClick(typeof e === 'string' ? { name, type: 'UNKNOWN' } : e)
                        }
                        className="w-full text-left p-2 bg-zinc-900/50 hover:bg-zinc-800 border border-transparent hover:border-osint-primary transition-all rounded flex items-center group"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${getEntityToneClass(type)} entity-tone-dot`}
                        ></div>
                        <span className="osint-meta-value text-zinc-400 group-hover:text-white truncate">
                          {name}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </Accordion>

            {/* Resources */}
            <Accordion
              title={`Provenance (${reportSources.length + visibleEvidence.length})`}
              icon={Globe}
              isOpen={openSidebarSection === 'resources'}
              onToggle={() => toggleSidebarAccordion('resources')}
              className="mb-2"
              contentClassName={DETAIL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-1">
                {report.provenance?.warnings?.length ? (
                  <div className="mb-2 space-y-2">
                    {report.provenance.warnings.map((warning, index) => (
                      <div
                        key={`${warning}-${index}`}
                        className="flex gap-2 border border-[color:var(--osint-danger-border)] bg-[color:var(--osint-danger-soft-bg)] p-2 osint-meta-value"
                      >
                        <ShieldAlert className="mt-0.5 h-3 w-3 flex-shrink-0 osint-danger-text" />
                        <span className="osint-danger-text">{warning}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {report.provenance?.search?.webSearchRequests ? (
                  <div className="px-2 py-1 osint-meta-label">
                    Web search calls: {report.provenance.search.webSearchRequests}
                  </div>
                ) : null}
                {visibleEvidence.slice(0, 4).map((evidence) => (
                  <div key={evidence.id} className="border border-zinc-800 bg-zinc-900/70 p-2">
                    <div className="osint-meta-label">
                      {evidence.kind}
                    </div>
                    <div className="mt-1 osint-body-quiet text-zinc-300">{evidence.title}</div>
                  </div>
                ))}
                {reportSources.length === 0 ? (
                  visibleEvidence.length === 0 ? (
                    <p className="px-2 py-1 osint-body-quiet italic">
                      No sources captured for this report.
                    </p>
                  ) : null
                ) : (
                  reportSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="osint-link-list-item block p-2 osint-meta-label truncate border-b border-zinc-900 last:border-0"
                    >
                      <Link2 className="w-3 h-3 inline mr-1" />
                      {source.title}
                    </a>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
};
