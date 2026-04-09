import React from 'react';
import { FileText, Users, Globe } from 'lucide-react';
import type { Workspace, Entity, Headline, Artifact, LabelProfile, Source } from '../../../types';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';
import {
  CHROME_NESTED_ITEM_DOT_CLASS,
  CHROME_THIN_NESTED_ITEM_CLASS,
  CHROME_THIN_ACTION_BUTTON_CLASS,
} from '../../ui/chrome';
import { LibraryRailSections } from '../LibraryRail/LibraryRailSections';
import { LibraryRailShell } from '../LibraryRail/LibraryRailShell';
import type { LibraryRailSection } from '../LibraryRail/libraryRailTypes';
import { PANEL_SECTION_ICONS } from '../../ui/panelSectionIcons';

interface DossierPanelProps {
  isOpen: boolean;
  activeCase: Workspace | null;
  labelProfile: LabelProfile;
  // Data objects
  reports: Artifact[];
  entities: Entity[];
  leads: string[];
  sources: Source[];
  headlines: Headline[];
  // State
  openSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  // Actions
  onNavigate: (id: string) => void;
  onEntityClick: (entity: Entity) => void;
  onLeadClick: (lead: string) => void;
  onHeadlineClick: (headline: Headline) => void;
  activeReportId?: string;
  overlayOnDesktop?: boolean;
  showHeaderSummary?: boolean;
}

export const DossierPanel: React.FC<DossierPanelProps> = ({
  isOpen,
  activeCase,
  labelProfile,
  reports,
  entities,
  leads,
  sources,
  headlines,
  openSections,
  toggleSection,
  onNavigate,
  onEntityClick,
  onLeadClick,
  onHeadlineClick,
  activeReportId,
  overlayOnDesktop = false,
  showHeaderSummary = false,
}) => {
  const desktopLayoutClass = overlayOnDesktop
    ? isOpen
      ? 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:w-80 lg:translate-x-0'
      : 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:w-80 lg:-translate-x-full'
    : isOpen
      ? 'lg:relative lg:z-0 lg:w-80 lg:translate-x-0'
      : 'lg:relative lg:z-0 lg:w-0 lg:-translate-x-0 lg:border-r-0';

  const sections: LibraryRailSection[] = [];

  if (reports.length > 0) {
    sections.push({
      id: 'reports',
      title: labelProfile.artifactLabelPlural,
      count: reports.length,
      icon: PANEL_SECTION_ICONS.artifacts,
      isOpen: openSections.reports,
      onToggle: () => toggleSection('reports'),
      entries: reports.map((reportEntry) => ({
        id: reportEntry.id || reportEntry.topic,
        title: sanitizeDisplayTitle(reportEntry.topic),
        onClick: reportEntry.id ? () => onNavigate(reportEntry.id as string) : undefined,
        isActive: activeReportId === reportEntry.id,
        icon: <span className={CHROME_NESTED_ITEM_DOT_CLASS} />,
      })),
    });
  }

  if (entities.length > 0) {
    sections.push({
      id: 'entities',
      title: 'Identified Entities',
      count: entities.length,
      icon: PANEL_SECTION_ICONS.entities,
      isOpen: openSections.entities,
      onToggle: () => toggleSection('entities'),
      entries: entities.map((entity, index) => ({
        id: `${entity.name}-${index}`,
        title: entity.name,
        onClick: () => onEntityClick(entity),
        icon: (
          <span
            className={`${CHROME_NESTED_ITEM_DOT_CLASS} ${getEntityToneClass(entity.type)} entity-tone-dot`}
          />
        ),
      })),
    });
  }

  sections.push({
    id: 'leads',
    title: labelProfile.followUpLabel,
    count: leads.length,
    icon: PANEL_SECTION_ICONS.followUps,
    isOpen: openSections.leads,
    onToggle: () => toggleSection('leads'),
    content:
      leads.length === 0 ? (
        <p className="osint-body-quiet px-2 py-1 italic">{`No ${labelProfile.followUpLabel.toLowerCase()} available for this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
      ) : (
        <div className="space-y-1">
          {leads.map((lead, index) => (
            <div key={`${lead}-${index}`} className={`${CHROME_THIN_NESTED_ITEM_CLASS} space-y-2`}>
              <p className="osint-meta-value leading-snug text-zinc-300">{lead}</p>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => onLeadClick(lead)}
                  className={`${CHROME_THIN_ACTION_BUTTON_CLASS} w-full justify-center`}
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      ),
  });

  if (reports.some((reportEntry) => (reportEntry.evidence || []).length > 0)) {
    const evidenceEntries = reports
      .flatMap((reportEntry) =>
        (reportEntry.evidence || []).slice(0, 2).map((evidence) => ({
          report: reportEntry,
          evidence,
        }))
      )
      .slice(0, 8);

    sections.push({
      id: 'evidence',
      title: 'Evidence',
      count: reports.reduce((total, reportEntry) => total + (reportEntry.evidence?.length || 0), 0),
      icon: Globe,
      isOpen: openSections.evidence,
      onToggle: () => toggleSection('evidence'),
      entries: evidenceEntries.map(({ report: evidenceReport, evidence }) => ({
        id: `${evidenceReport.id || evidenceReport.topic}-${evidence.id}`,
        title: evidence.kind,
        description: evidence.title,
        meta: sanitizeDisplayTitle(evidenceReport.topic),
        onClick: evidenceReport.id ? () => onNavigate(evidenceReport.id as string) : undefined,
        variant: 'card',
      })),
    });
  }

  sections.push({
    id: 'sources',
    title: 'Sources',
    count: sources.length,
    icon: PANEL_SECTION_ICONS.sources,
    isOpen: openSections.sources,
    onToggle: () => toggleSection('sources'),
    entries: sources.map((source, index) => ({
      id: `${source.url}-${index}`,
      title: source.title || source.url,
      description: source.title ? source.url : undefined,
      href: source.url,
      target: '_blank',
      rel: 'noopener noreferrer',
    })),
    emptyState: (
      <p className="osint-body-quiet px-2 py-1 italic">{`No ${labelProfile.signalLabel.toLowerCase()} captured yet.`}</p>
    ),
  });

  sections.push({
    id: 'headlines',
    title: 'Saved Signals',
    count: headlines.length,
    icon: PANEL_SECTION_ICONS.signals,
    isOpen: openSections.headlines,
    onToggle: () => toggleSection('headlines'),
    entries: headlines.map((headline) => ({
      id: headline.id,
      title: headline.source,
      description: headline.content,
      meta: `${headline.type} Signal`,
      onClick: () => onHeadlineClick(headline),
      variant: 'card',
    })),
    emptyState: (
      <p className="osint-body-quiet px-2 py-1 italic">{`No saved signals linked to this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
    ),
  });

  const headerSummary = showHeaderSummary ? (
    <div className="osint-meta-label flex items-center space-x-3">
      <span className="flex items-center">
        <FileText className="mr-1 h-3 w-3" />
        {reports.length} {labelProfile.artifactLabelPlural}
      </span>
      <span className="flex items-center">
        <Users className="mr-1 h-3 w-3" />
        {entities.length} Entities
      </span>
    </div>
  ) : undefined;

  return (
    <LibraryRailShell
      isOpen={isOpen}
      title={
        activeCase ? (
          <h2 className="leading-tight">{getWorkspaceDisplayTitle(activeCase)}</h2>
        ) : (
          <h2 className="text-zinc-500">{`No ${labelProfile.workspaceLabel} Selected`}</h2>
        )
      }
      subtitle={
        activeCase
          ? undefined
          : `Select a ${labelProfile.workspaceLabel.toLowerCase()} from the dropdown above.`
      }
      summary={headerSummary}
      widthClassName="w-80"
      className={`${desktopLayoutClass} ${overlayOnDesktop ? 'lg:shadow-2xl' : 'lg:shadow-none'}`}
    >
      <div className="bg-black/20">
        <LibraryRailSections sections={sections} />
      </div>
    </LibraryRailShell>
  );
};
