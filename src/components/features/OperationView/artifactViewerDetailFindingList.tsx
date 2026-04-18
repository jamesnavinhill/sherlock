import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Globe, Link2, PanelTopOpen } from 'lucide-react';

import type { ArtifactEvidence, KeyFinding, Source } from '@/types';
import {
  CHROME_THIN_ACTION_BUTTON_CLASS,
  getChromeThinActionRowClassName,
} from '@/components/ui/chrome';
import { Accordion } from '@/components/ui/Accordion';
import { normalizeText } from './artifactViewerShared';

interface FindingDetailListProps {
  canonicalFindings: KeyFinding[];
  keyFindingsAnchorId: string;
  jumpToSection: (sectionId: string) => void;
  jumpToEvidence: (evidenceId: string) => void;
  getFindingRelatedEvidence: (finding: KeyFinding) => ArtifactEvidence[];
  getMatchingSources: (references?: string[]) => Source[];
}

export const FindingDetailList: React.FC<FindingDetailListProps> = ({
  canonicalFindings,
  keyFindingsAnchorId,
  jumpToSection,
  jumpToEvidence,
  getFindingRelatedEvidence,
  getMatchingSources,
}) => {
  const [openFindingId, setOpenFindingId] = React.useState<string | null>(null);

  const renderSourceLinks = (sources: Source[]) => {
    if (sources.length === 0) return null;

    return (
      <div className="mt-2 space-y-1.5">
        {sources.map((source) => (
          <a
            key={`${source.url}-${source.title}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-1.5 font-sans text-[11px] leading-5 text-[color:var(--osint-text-quiet)] transition-colors hover:text-osint-primary"
            style={{ color: 'var(--osint-primary)' }}
            title={source.title || source.url}
          >
            <Link2 className="h-3 w-3 shrink-0" />
            <span className="truncate whitespace-nowrap">{source.title || source.url}</span>
          </a>
        ))}
      </div>
    );
  };

  const renderEvidenceButtons = (evidenceRows: ArtifactEvidence[]) => {
    if (evidenceRows.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {evidenceRows.map((evidence) => (
          <button
            key={evidence.id}
            type="button"
            onClick={() => jumpToEvidence(evidence.id)}
            className="osint-shell-chip inline-flex items-center gap-1 px-2 py-1 osint-meta-label transition"
          >
            <Globe className="h-3 w-3" />
            <span>{evidence.sourceTitle || evidence.title}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-1.5">
      {canonicalFindings.map((finding, index) => {
        const relatedEvidence = getFindingRelatedEvidence(finding);
        const matchingSources = getMatchingSources(finding.supportRefs);
        const headerTitle = normalizeText(finding.title) || normalizeText(finding.summary);
        const isOpen = openFindingId === finding.id;

        return (
          <Accordion
            key={finding.id}
            title={
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 osint-meta-label">{index + 1}</span>
                <span className="min-w-0 truncate osint-body-quiet leading-5 text-[color:var(--osint-text-strong)]">
                  {headerTitle}
                </span>
              </div>
            }
            isOpen={isOpen}
            onToggle={() => setOpenFindingId((current) => (current === finding.id ? null : finding.id))}
            variant="nested"
            className="mb-0"
            headerClassName="px-2.5 py-1.5"
            contentClassName="space-y-3 px-2.5 py-2"
          >
            <div className="max-w-none osint-body-small text-[color:var(--osint-text-strong)] prose prose-invert prose-p:my-0">
              <ReactMarkdown>{finding.summary}</ReactMarkdown>
            </div>

            {matchingSources.length > 0 ? (
              <div>
                <div className="osint-meta-label">Sources</div>
                {renderSourceLinks(matchingSources)}
              </div>
            ) : null}

            {relatedEvidence.length > 0 ? (
              <div>
                <div className="osint-meta-label">Evidence</div>
                {renderEvidenceButtons(relatedEvidence)}
              </div>
            ) : null}

            <div className={getChromeThinActionRowClassName(1)}>
              <button
                type="button"
                onClick={() => jumpToSection(finding.originSectionId || keyFindingsAnchorId)}
                className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full`}
                title="Open finding context"
                aria-label="Open finding context"
              >
                <PanelTopOpen className="h-3.5 w-3.5" />
                <span className="sr-only">Open</span>
              </button>
            </div>
          </Accordion>
        );
      })}
    </div>
  );
};
