import React, { useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';

import type { Artifact, ArtifactEvidence, Entity, FollowUp, KeyFinding } from '../../../types';
import {
  getArtifactKeyFindings,
  getLabelProfileById,
  getPurposeProfileById,
  getSectionByKinds,
  sanitizeDisplayTitle,
} from '../../../domain';
import { Breadcrumbs } from '../../ui/Breadcrumbs';
import type { BreadcrumbItem } from '../../ui/Breadcrumbs';
import { EditableTitle } from '../../ui/EditableTitle';
import { EmptyState } from '../../ui/EmptyState';
import { MainContentDotGrid } from '../../ui/MainContentDotGrid';
import { generateAudioBriefing } from '../../../services/runtime';
import { decodeBase64, decodeAudioData } from '../../../utils/audio';
import { CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS } from '../../ui/chrome';
import { buildArtifactViewerPresentation } from './artifactViewerPresentation';
import { buildArtifactViewerBody, buildArtifactViewerBodyBlocks } from './artifactViewerText';
import {
  ArtifactFollowUpsSection,
  ArtifactKeyFindingsSection,
  ArtifactSummarySection,
} from './ArtifactViewerSections';
import { ArtifactDocumentSection } from './ArtifactViewerDocumentSection';
import { ArtifactEvidenceLogSection } from './ArtifactViewerEvidenceLog';
import {
  ARTIFACT_BODY_EDIT_KEY,
  buildVisibleArtifactFollowUps,
  dedupeById,
  matchesReference,
  normalizeText,
} from './artifactViewerShared';

interface ArtifactViewerProps {
  artifact: Artifact | null;
  focusedSectionId?: string;
  focusedEvidenceId?: string;
  navStack: BreadcrumbItem[];
  onNavigate: (id: string) => void;
  onNotify: (message: string, tone: 'SUCCESS' | 'ERROR' | 'INFO') => void;
  showPlaceholder: boolean;
  onStartWorkspace: () => void;
  onTitleSave: (newTitle: string) => void;
  onArtifactBodySave: (
    body: string,
    sectionId?: string,
    options?: { syncSummary?: boolean }
  ) => Promise<void>;
  onFollowUpOpen: (followUp: FollowUp) => void;
  onEntityClick: (entity: Entity) => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({
  artifact,
  focusedSectionId,
  focusedEvidenceId,
  navStack,
  onNavigate,
  onNotify,
  showPlaceholder,
  onStartWorkspace,
  onTitleSave,
  onArtifactBodySave,
  onFollowUpOpen,
  onEntityClick,
}) => {
  const artifactSources = artifact?.sources || [];
  const artifactEntities = artifact?.entities || [];

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

  const labelProfile = getLabelProfileById(
    artifact?.labelProfileId || artifact?.config?.labelProfileId
  );
  const purposeProfile = getPurposeProfileById(
    artifact?.purposeId || artifact?.config?.purposeId
  );
  const { evidenceBySectionId, orderedSections, visibleEvidence } = buildArtifactViewerPresentation(
    artifact,
    purposeProfile
  );
  const canonicalFindings = artifact ? getArtifactKeyFindings(artifact) : [];
  const focusedEvidence =
    focusedEvidenceId && visibleEvidence.length > 0
      ? visibleEvidence.find((entry) => entry.id === focusedEvidenceId)
      : undefined;
  const keyFindingsSection = getSectionByKinds(orderedSections, ['KEY_FINDINGS']);
  const primarySummarySection = getSectionByKinds(orderedSections, ['EXECUTIVE_SUMMARY']);
  const methodologySection = getSectionByKinds(orderedSections, ['METHODOLOGY']);
  const summaryAnchorId = primarySummarySection?.id || `${artifact?.id || 'artifact'}-summary`;
  const keyFindingsAnchorId = keyFindingsSection?.id || `${artifact?.id || 'artifact'}-key-findings`;
  const highlightedSectionId =
    localFocusedSectionId || focusedSectionId || focusedEvidence?.sectionId || null;
  const highlightedEvidenceId = localFocusedEvidenceId || focusedEvidenceId || null;
  const visibleReportBodyBlocks = buildArtifactViewerBodyBlocks({
    artifact,
    orderedSections,
    labelProfile,
  });
  const visibleReportBody = buildArtifactViewerBody({
    artifact,
    orderedSections,
    labelProfile,
  });
  const editableArtifactBody = primarySummarySection?.content || artifact?.summary || '';
  const isCompositeReportBody =
    normalizeText(visibleReportBody) !== normalizeText(editableArtifactBody);
  const visibleFollowUps = buildVisibleArtifactFollowUps(artifact, orderedSections);
  const shouldRenderDiscreteReportSections = false;
  const artifactDisplayTitle = artifact ? sanitizeDisplayTitle(artifact.topic) : '';

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

  useEffect(() => {
    return () => stopAudio();
  }, [artifact?.id]);

  useEffect(() => {
    setEditingTargetKey(null);
    setEditingSectionId(undefined);
    setEditingSectionDraft('');
    setLocalFocusedSectionId(null);
    setLocalFocusedEvidenceId(null);
  }, [artifact?.id]);

  useEffect(() => {
    setLocalFocusedSectionId(null);
    setLocalFocusedEvidenceId(null);
  }, [focusedSectionId, focusedEvidenceId]);

  useEffect(() => {
    const nextTarget =
      (highlightedEvidenceId ? evidenceRefs.current[highlightedEvidenceId] : null) ||
      (highlightedSectionId ? sectionRefs.current[highlightedSectionId] : null);

    if (!nextTarget) return;

    nextTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [highlightedEvidenceId, highlightedSectionId, artifact?.id]);

  const startEditingSection = (body: string, sectionId?: string, syncSummary = true) => {
    setEditingTargetKey(sectionId || ARTIFACT_BODY_EDIT_KEY);
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
      await onArtifactBodySave(trimmed, editingSectionId, {
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

  const setSectionNode = (sectionId: string, node: HTMLElement | null) => {
    sectionRefs.current[sectionId] = node;
  };

  const setEvidenceNode = (evidenceId: string, node: HTMLElement | null) => {
    evidenceRefs.current[evidenceId] = node;
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

  const renderDocumentSection = (
    section: NonNullable<typeof orderedSections[number]>,
    options?: {
      eyebrow?: string;
      editable?: boolean;
      saveSectionId?: string;
      syncSummary?: boolean;
    }
  ) => (
    <ArtifactDocumentSection
      key={section.id}
      editingSectionDraft={editingSectionDraft}
      editingTargetKey={editingTargetKey}
      evidenceBySectionId={evidenceBySectionId}
      highlightedEvidenceId={highlightedEvidenceId}
      highlightedSectionId={highlightedSectionId}
      isSavingSection={isSavingSection}
      labelProfile={labelProfile}
      onCancelEditing={handleCancelEditing}
      onDraftChange={setEditingSectionDraft}
      onJumpToEvidence={jumpToEvidence}
      onSaveSection={handleSaveSection}
      onStartEditingSection={startEditingSection}
      options={options}
      section={section}
      setSectionRef={setSectionNode}
    />
  );

  if (showPlaceholder || !artifact) {
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
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar" data-app-scroll-region>
        <div className="relative">
          <MainContentDotGrid testId="artifact-viewer-dot-grid-background" />
          <div
            data-testid="artifact-viewer-top-header"
            className={`relative z-10 px-6 pb-2 pt-4 ${CHROME_TOP_PANEL_HEADER_MIN_HEIGHT_CLASS}`}
          >
            <div className="flex h-full flex-col justify-center gap-2 md:flex-row md:items-center md:justify-between">
              <Breadcrumbs items={navStack} onNavigate={onNavigate} />
              <div className="flex items-center gap-3">
                {artifact.dateStr ? (
                  <p className="osint-meta-label whitespace-nowrap">LOG DATE: {artifact.dateStr}</p>
                ) : null}
              </div>
            </div>
          </div>
          <div data-testid="artifact-viewer-title-surface" className="relative z-10 px-6 py-5">
            <EditableTitle
              value={artifact.topic}
              displayValue={artifactDisplayTitle}
              onSave={onTitleSave}
              className="font-osint-display osint-title-page text-[clamp(var(--font-size-xl),calc(var(--font-size-lg)+0.8vw),var(--font-size-3xl))] leading-tight uppercase"
              inputClassName="font-osint-display osint-title-page text-[clamp(var(--font-size-xl),calc(var(--font-size-lg)+0.8vw),var(--font-size-3xl))] uppercase"
            />
          </div>

          <div className="relative z-10 space-y-8 px-6 pb-6 pt-6">
            <ArtifactSummarySection
              editableArtifactBody={editableArtifactBody}
              editingSectionDraft={editingSectionDraft}
              editingTargetKey={editingTargetKey}
              evidenceBySectionId={evidenceBySectionId}
              focusedEvidenceId={focusedEvidenceId}
              focusedSectionId={focusedSectionId}
              highlightedEvidenceId={highlightedEvidenceId}
              highlightedSectionId={highlightedSectionId}
              isAudioLoading={isAudioLoading}
              isCompositeReportBody={isCompositeReportBody}
              isPlaying={isPlaying}
              isSavingSection={isSavingSection}
              onCancelEditing={handleCancelEditing}
              onDraftChange={setEditingSectionDraft}
              onJumpToEvidence={jumpToEvidence}
              onPlayBriefing={handlePlayBriefing}
              onSaveSection={handleSaveSection}
              onStartEditingSection={startEditingSection}
              primarySummarySection={primarySummarySection}
              setSectionRef={setSectionNode}
              summaryAnchorId={summaryAnchorId}
              visibleReportBody={visibleReportBody}
              visibleReportBodyBlocks={visibleReportBodyBlocks}
            />

            <ArtifactKeyFindingsSection
              canonicalFindings={canonicalFindings}
              getFindingRelatedEvidence={getFindingRelatedEvidence}
              getMatchingSources={getMatchingSources}
              highlightedEvidenceId={highlightedEvidenceId}
              keyFindingsAnchorId={keyFindingsAnchorId}
              onJumpToEvidence={jumpToEvidence}
              onJumpToSection={jumpToSection}
              setSectionRef={setSectionNode}
            />

            <ArtifactFollowUpsSection
              getMatchingEntity={getMatchingEntity}
              getMatchingSources={getMatchingSources}
              onEntityClick={onEntityClick}
              onFollowUpOpen={onFollowUpOpen}
              onJumpToSection={jumpToSection}
              visibleFollowUps={visibleFollowUps}
            />

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

            <ArtifactEvidenceLogSection
              highlightedEvidenceId={highlightedEvidenceId}
              onJumpToSection={jumpToSection}
              setEvidenceRef={setEvidenceNode}
              visibleEvidence={visibleEvidence}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
