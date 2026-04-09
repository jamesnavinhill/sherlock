import React from 'react';
import {
  FileText,
  Users,
  Lightbulb,
  Globe,
  Newspaper,
  User,
  ChevronRight,
  Link2,
} from 'lucide-react';
import type { Workspace, Entity, Headline, Artifact, LabelProfile, Source } from '../../../types';
import { Accordion } from '../../ui/Accordion';
import { getWorkspaceDisplayTitle, sanitizeDisplayTitle } from '../../../domain';
import { getEntityToneClass } from '../../../utils/entityPalette';
import {
  CHROME_COMPACT_ACTION_BUTTON_CLASS,
  CHROME_NESTED_ITEM_BUTTON_CLASS,
  CHROME_NESTED_ITEM_DOT_CLASS,
  CHROME_PANEL_CLASS,
  CHROME_PANEL_HEADER_CLASS,
  CHROME_RAIL_BODY_CLASS,
  CHROME_RAIL_SECTION_SCROLL_CLASS,
  getRailAccordionClassName,
} from '../../ui/chrome';

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
  showHeaderSummary = true,
}) => {
  const desktopLayoutClass = overlayOnDesktop
    ? isOpen
      ? 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:w-80 lg:translate-x-0'
      : 'lg:absolute lg:inset-y-0 lg:left-0 lg:z-20 lg:w-80 lg:-translate-x-full'
    : isOpen
      ? 'lg:relative lg:z-0 lg:w-80 lg:translate-x-0'
      : 'lg:relative lg:z-0 lg:w-0 lg:-translate-x-0 lg:border-r-0';

  return (
    <div
      className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-80 border-r overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${CHROME_PANEL_CLASS} ${desktopLayoutClass} ${isOpen ? 'pointer-events-auto' : 'pointer-events-none lg:pointer-events-none'} ${overlayOnDesktop ? 'lg:shadow-2xl' : 'lg:shadow-none'}`}
    >
      {activeCase && (
        <div className={CHROME_PANEL_HEADER_CLASS}>
          <div className="osint-eyebrow">Library</div>
          <h2 className="mt-1 osint-panel-title leading-tight">
            {getWorkspaceDisplayTitle(activeCase)}
          </h2>
          {showHeaderSummary ? (
            <div className="mt-3 osint-meta-label flex items-center space-x-3">
              <span className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {reports.length} {labelProfile.artifactLabelPlural}
              </span>
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {entities.length} Entities
              </span>
            </div>
          ) : null}
        </div>
      )}
      {!activeCase && (
        <div className={CHROME_PANEL_HEADER_CLASS}>
          <div className="osint-eyebrow">Library</div>
          <h2 className="mt-1 osint-panel-title text-zinc-500">{`No ${labelProfile.workspaceLabel} Selected`}</h2>
          <p className="osint-body-quiet mt-1">{`Select a ${labelProfile.workspaceLabel.toLowerCase()} from the dropdown above.`}</p>
        </div>
      )}

      <div className={`${CHROME_RAIL_BODY_CLASS} bg-black/20`}>
        {/* Reports */}
        {reports.length > 0 && (
          <Accordion
            title={labelProfile.artifactLabelPlural}
            count={reports.length}
            icon={FileText}
            isOpen={openSections.reports}
            onToggle={() => toggleSection('reports')}
            className={getRailAccordionClassName(openSections.reports)}
            contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
          >
            <div className="space-y-1">
              {reports.map((r) => (
                <button
                  key={r.id || r.topic}
                  onClick={() => r.id && onNavigate(r.id)}
                  className={`${CHROME_NESTED_ITEM_BUTTON_CLASS} flex items-center gap-3`}
                  data-active={activeReportId === r.id}
                  title={sanitizeDisplayTitle(r.topic)}
                >
                  <span className={CHROME_NESTED_ITEM_DOT_CLASS} />
                  <span className="truncate osint-meta-value">
                    {sanitizeDisplayTitle(r.topic)}
                  </span>
                </button>
              ))}
            </div>
          </Accordion>
        )}

        {/* Entities */}
        {entities.length > 0 && (
          <Accordion
            title="Identified Entities"
            count={entities.length}
            icon={User}
            isOpen={openSections.entities}
            onToggle={() => toggleSection('entities')}
            className={getRailAccordionClassName(openSections.entities)}
            contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
          >
            <div className="grid grid-cols-2 gap-1">
              {entities.map((e, idx) => (
                <button
                  key={idx}
                  onClick={() => onEntityClick(e)}
                  className={`${CHROME_NESTED_ITEM_BUTTON_CLASS} flex items-center gap-2 truncate`}
                  title={e.name}
                >
                  <span
                    className={`${CHROME_NESTED_ITEM_DOT_CLASS} ${getEntityToneClass(e.type)} entity-tone-dot`}
                  />
                  <span className="truncate osint-meta-value">{e.name}</span>
                </button>
              ))}
            </div>
          </Accordion>
        )}

        {/* Leads */}
        <Accordion
          title={labelProfile.followUpLabel}
          count={leads.length}
          icon={Lightbulb}
          isOpen={openSections.leads}
          onToggle={() => toggleSection('leads')}
          className={getRailAccordionClassName(openSections.leads)}
          contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          <div className="space-y-1">
            {leads.length === 0 ? (
              <p className="osint-body-quiet px-2 py-1 italic">{`No ${labelProfile.followUpLabel.toLowerCase()} available for this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
            ) : (
              leads.map((lead, idx) => (
                <div key={idx} className="mb-1 border border-zinc-800/50 bg-zinc-900/20 p-2">
                  <p className="mb-2 osint-meta-value leading-snug text-zinc-300">{lead}</p>
                  <div className="flex">
                    <button
                      onClick={() => onLeadClick(lead)}
                      className={`${CHROME_COMPACT_ACTION_BUTTON_CLASS} w-full justify-center`}
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Accordion>

        {reports.some((report) => (report.evidence || []).length > 0) && (
          <Accordion
            title="Evidence"
            count={reports.reduce((total, report) => total + (report.evidence?.length || 0), 0)}
            icon={Globe}
            isOpen={openSections.evidence}
            onToggle={() => toggleSection('evidence')}
            className={getRailAccordionClassName(openSections.evidence)}
            contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
          >
            <div className="space-y-1">
              {reports
                .flatMap((report) =>
                  (report.evidence || []).slice(0, 2).map((evidence) => ({
                    report,
                    evidence,
                  }))
                )
                .slice(0, 8)
                .map(({ report, evidence }) => (
                  <button
                    key={`${report.id}-${evidence.id}`}
                    onClick={() => report.id && onNavigate(report.id)}
                    className="w-full border border-zinc-800 bg-zinc-900/30 p-2 text-left transition hover:border-osint-primary"
                  >
                    <div className="osint-meta-label">{evidence.kind}</div>
                    <div className="mt-1 osint-meta-value">{evidence.title}</div>
                    <div className="mt-1 truncate osint-body-quiet">
                      {sanitizeDisplayTitle(report.topic)}
                    </div>
                  </button>
                ))}
            </div>
          </Accordion>
        )}

        {/* Sources */}
        <Accordion
          title="Sources"
          count={sources.length}
          icon={Globe}
          isOpen={openSections.sources}
          onToggle={() => toggleSection('sources')}
          className={getRailAccordionClassName(openSections.sources)}
          contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          <div className="space-y-1">
            {sources.length === 0 ? (
              <p className="osint-body-quiet px-2 py-1 italic">{`No ${labelProfile.signalLabel.toLowerCase()} captured yet.`}</p>
            ) : (
              sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="osint-link-list-item block truncate border-b border-zinc-900 p-2 last:border-0"
                >
                  <Link2 className="inline h-3 w-3 mr-1" />
                  <span className="osint-body-quiet text-zinc-400">
                    {s.title || s.url}
                  </span>
                </a>
              ))
            )}
          </div>
        </Accordion>

        {/* Headlines */}
        <Accordion
          title="Saved Signals"
          count={headlines.length}
          icon={Newspaper}
          isOpen={openSections.headlines}
          onToggle={() => toggleSection('headlines')}
          className={getRailAccordionClassName(openSections.headlines)}
          contentClassName={CHROME_RAIL_SECTION_SCROLL_CLASS}
        >
          <div className="space-y-1">
            {headlines.length === 0 ? (
              <p className="osint-body-quiet px-2 py-1 italic">{`No saved signals linked to this ${labelProfile.workspaceLabel.toLowerCase()}.`}</p>
            ) : (
              headlines.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onHeadlineClick(h)}
                  className="w-full border border-zinc-800/50 bg-zinc-900/20 p-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900 group"
                >
                  <p className="line-clamp-2 osint-body-quiet text-zinc-300 group-hover:text-white">
                    {h.content}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="osint-meta-label text-zinc-600">{h.source}</span>
                    <ChevronRight className="h-3 w-3 text-zinc-700 opacity-0 transition-all group-hover:opacity-100 group-hover:text-osint-primary" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Accordion>
      </div>
    </div>
  );
};
