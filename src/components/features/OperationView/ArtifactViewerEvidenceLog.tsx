import React from 'react';

import type { ArtifactEvidence } from '@/types';
import { CHROME_THIN_ACTION_BUTTON_CLASS } from '@/components/ui/chrome';
import {
  ARTIFACT_VIEWER_SECTION_CLASS,
  ARTIFACT_VIEWER_SUBSECTION_CLASS,
  cx,
} from './artifactViewerShared';

interface EvidenceLogSectionProps {
  highlightedEvidenceId: string | null;
  onJumpToSection: (sectionId: string) => void;
  setEvidenceRef: (evidenceId: string, node: HTMLElement | null) => void;
  visibleEvidence: ArtifactEvidence[];
}

export const ArtifactEvidenceLogSection: React.FC<EvidenceLogSectionProps> = ({
  highlightedEvidenceId,
  onJumpToSection,
  setEvidenceRef,
  visibleEvidence,
}) => {
  if (visibleEvidence.length === 0) return null;

  return (
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
              setEvidenceRef(evidence.id, node);
            }}
            className={cx(
              ARTIFACT_VIEWER_SUBSECTION_CLASS,
              highlightedEvidenceId === evidence.id ? 'osint-shell-highlight-surface' : undefined
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
                      onJumpToSection(evidence.sectionId);
                    }
                  }}
                  className={CHROME_THIN_ACTION_BUTTON_CLASS}
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
  );
};
