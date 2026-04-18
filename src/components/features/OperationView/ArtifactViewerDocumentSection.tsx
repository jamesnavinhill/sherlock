import React from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';

import type { ArtifactEvidence, ArtifactSection, LabelProfile } from '@/types';
import { getArtifactSectionTitle } from '@/domain';
import { ArtifactEvidenceButtons } from './ArtifactViewerSections';
import {
  ARTIFACT_BODY_EDIT_KEY,
  ARTIFACT_VIEWER_SECTION_CLASS,
  ArtifactSectionBody,
  SECTION_HEADER_ACTION_GROUP_CLASS,
  SECTION_HEADER_CLASS,
  SECTION_HEADER_ICON_BUTTON_CLASS,
  SECTION_HEADER_SUCCESS_ICON_BUTTON_CLASS,
  cx,
} from './artifactViewerShared';

interface DocumentSectionProps {
  editingSectionDraft: string;
  editingTargetKey: string | null;
  evidenceBySectionId: Record<string, ArtifactEvidence[]>;
  highlightedEvidenceId: string | null;
  highlightedSectionId: string | null;
  isSavingSection: boolean;
  labelProfile: LabelProfile;
  onCancelEditing: () => void;
  onDraftChange: (value: string) => void;
  onJumpToEvidence: (evidenceId: string) => void;
  onSaveSection: () => void;
  onStartEditingSection: (body: string, sectionId?: string, syncSummary?: boolean) => void;
  options?: {
    eyebrow?: string;
    editable?: boolean;
    saveSectionId?: string;
    syncSummary?: boolean;
  };
  section: ArtifactSection;
  setSectionRef: (sectionId: string, node: HTMLElement | null) => void;
}

export const ArtifactDocumentSection: React.FC<DocumentSectionProps> = ({
  editingSectionDraft,
  editingTargetKey,
  evidenceBySectionId,
  highlightedEvidenceId,
  highlightedSectionId,
  isSavingSection,
  labelProfile,
  onCancelEditing,
  onDraftChange,
  onJumpToEvidence,
  onSaveSection,
  onStartEditingSection,
  options,
  section,
  setSectionRef,
}) => {
  const displayedSectionId = section.id;
  const saveSectionId = options?.saveSectionId;
  const editKey = saveSectionId || ARTIFACT_BODY_EDIT_KEY;
  const isEditing = options?.editable && editingTargetKey === editKey;
  const linkedEvidence = evidenceBySectionId[displayedSectionId] || [];

  return (
    <section
      key={displayedSectionId}
      ref={(node) => {
        setSectionRef(displayedSectionId, node);
      }}
      className={cx(
        ARTIFACT_VIEWER_SECTION_CLASS,
        highlightedSectionId === displayedSectionId ? 'osint-shell-highlight-surface' : undefined
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
            ) : (
              <button
                type="button"
                onClick={() =>
                  onStartEditingSection(section.content || '', saveSectionId, options?.syncSummary ?? false)
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

      <ArtifactEvidenceButtons
        evidenceRows={linkedEvidence}
        highlightedEvidenceId={highlightedEvidenceId}
        onJumpToEvidence={onJumpToEvidence}
      />

      <div className="mt-5">
        {isEditing ? (
          <textarea
            value={editingSectionDraft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="osint-input-field min-h-[16rem] w-full resize-y p-4 osint-prose"
            spellCheck={false}
          />
        ) : (
          <ArtifactSectionBody section={section} labelProfile={labelProfile} />
        )}
      </div>
    </section>
  );
};
