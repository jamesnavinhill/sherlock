/* eslint-disable react-refresh/only-export-components */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ComponentProps, ReactElement } from 'react';

import type { Artifact, ArtifactSection, FollowUp, LabelProfile } from '@/types';
import { getArtifactFollowUps, getArtifactSectionTitle, getSectionItemsByKinds } from '@/domain';
import {
  CHROME_CARD_SECTION_SUBTLE_CLASS,
  CHROME_CARD_SURFACE_CLASS,
} from '@/components/ui/chrome';

export const ARTIFACT_BODY_EDIT_KEY = '__artifact-body__';

export const ARTIFACT_VIEWER_SECTION_CLASS = `${CHROME_CARD_SURFACE_CLASS} osint-shell-stage-surface p-6 transition-colors`;

export const ARTIFACT_VIEWER_SUBSECTION_CLASS = `${CHROME_CARD_SECTION_SUBTLE_CLASS} osint-shell-stage-surface-subtle p-4 transition-colors`;

export const SECTION_HEADER_CLASS =
  'flex items-center justify-between gap-4 border-b border-zinc-800 pb-4';

export const SECTION_HEADER_ACTION_GROUP_CLASS = 'flex items-center gap-2';

export const SECTION_HEADER_ICON_BUTTON_CLASS =
  'osint-icon-button-plain inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60';

export const SECTION_HEADER_SUCCESS_ICON_BUTTON_CLASS =
  'osint-icon-button-plain-success inline-flex h-9 w-9 items-center justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-60';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const normalizeText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() || '';

export const matchesReference = (reference?: string | null, candidate?: string | null) => {
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

export const dedupeById = <T extends { id: string }>(items: T[]) =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

export const markdownComponents: {
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

export const buildVisibleArtifactFollowUps = (
  artifact: Artifact | null,
  orderedSections: ArtifactSection[]
): FollowUp[] => {
  if (!artifact) return [];

  const canonical = getArtifactFollowUps(artifact);
  if (canonical.length > 0) return canonical;

  return getSectionItemsByKinds(orderedSections, ['LEADS', 'NEXT_STEPS']).map((item, index) => ({
    id: `artifact-follow-up-${index}`,
    kind: 'NEXT_STEP' as const,
    title: item.slice(0, 96),
    actionText: item,
    status: 'OPEN' as const,
  }));
};

interface ArtifactSectionBodyProps {
  labelProfile: LabelProfile;
  section: ArtifactSection;
}

export const ArtifactSectionBody: React.FC<ArtifactSectionBodyProps> = ({
  labelProfile,
  section,
}) => {
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
