import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  ChevronDown,
  Clock3,
  Download,
  FileJson,
  FileText,
  Filter,
  Fingerprint,
  MessageSquare,
  PanelRight,
  Radio,
  Save,
  Search,
  Workflow,
} from 'lucide-react';
import type { Artifact, ChatOpenRequest, TimelineRange } from '../../types';
import { buildWorkspaceTimelinePath } from '../../app/routes';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { Accordion } from '../ui/Accordion';
import { EmptyState } from '../ui/EmptyState';
import { InspectorActionRow } from '../ui/InspectorActionRow';
import { OsintSelect } from '../ui/OsintSelect';
import { sanitizeDisplayTitle } from '../../domain';
import {
  getTrackCount,
} from './Timeline/timelineEvents';
import {
  buildTimelineSearchPlaceholder,
  formatEventTime,
  getEventIcon,
  getEventTone,
  getFocusedButtonClass,
  getMetadataValue,
  getPrimaryRefId,
  LEFT_PANEL_SECTION_SCROLL_CLASS,
  toggleExclusiveSection,
  TRACK_OPTIONS,
} from './Timeline/timelineViewUtils';
import { useTimelineViewController } from './Timeline/useTimelineViewController';

interface TimelineViewProps {
  onOpenReport: (report: Artifact) => void;
  onOpenChat: (request: ChatOpenRequest) => void;
}


export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenReport, onOpenChat }) => {
  const navigate = useNavigate();
  const {
    activeWorkspace,
    allTimelineEvents,
    artifactItems,
    artifactTitleById,
    chatSessionItems,
    chatTitleById,
    clearFilters,
    detailActions,
    detailSections,
    dossierSections,
    effectiveSelectedEventId,
    entityItems,
    exportMenuRef,
    filterMenuRef,
    filters,
    focusReference,
    focusedRefId,
    focusedTrack,
    groupedEvents,
    handleExportTimelineJson,
    handleExportTimelineMarkdown,
    handleSaveTimelineArtifact,
    isLoading,
    labelProfile,
    leftPanelOpen,
    openArtifact,
    openWorkspaceChat,
    parentArtifact,
    relatedSignal,
    rightPanelOpen,
    runItems,
    search,
    searchParams,
    selectedArtifact,
    selectedChatAction,
    selectedChatLaunchContext,
    selectedChatSession,
    selectedEntityName,
    selectedEvent,
    selectedRun,
    setDetailSections,
    setDossierSections,
    setLeftPanelOpen,
    setRightPanelOpen,
    setSelectedEventId,
    setShowExportMenu,
    setShowFilters,
    setTrackFocus,
    setActiveWorkspaceId,
    showExportMenu,
    showFilters,
    signalItems,
    signalTitleById,
    timelineSnapshot,
    toggleTrackFilter,
    updateTimelineQuery,
    visibleEvents,
    workspaces,
  } = useTimelineViewController({
    onOpenChat,
    onOpenReport,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <EmptyState
          icon={Clock3}
          title="Loading Timeline"
          description="Sherlock is assembling saved workspace chronology from artifacts, runs, signals, and chat activity."
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-black text-zinc-100">
      <BackgroundMatrixRain />

      <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-black/95 px-6 backdrop-blur-md">
        <div className="flex h-full min-w-0 items-center gap-3">
          <button
            onClick={() => setLeftPanelOpen((current) => !current)}
            className={`flex shrink-0 items-center justify-center border p-2 text-xs font-mono uppercase transition ${
              leftPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
            title="Toggle timeline dossier"
          >
            <Briefcase className="h-4 w-4" />
          </button>

          <div className="w-full max-w-[320px] min-w-[220px] shrink-0">
            <OsintSelect
              ariaLabel={`${labelProfile.workspaceLabel} timeline workspace`}
              value={activeWorkspace?.id || ''}
              onChange={(value) => {
                if (value) {
                  const nextSearch = searchParams.toString();
                  navigate({
                    pathname: buildWorkspaceTimelinePath(value),
                    search: nextSearch ? `?${nextSearch}` : '',
                  });
                } else {
                  setActiveWorkspaceId(null);
                }
              }}
              placeholder={`Select ${labelProfile.workspaceLabel.toLowerCase()}`}
              triggerClassName="py-1.5 pl-3 pr-8 text-xs font-mono"
              options={workspaces.map((workspace) => ({
                value: workspace.id,
                label: sanitizeDisplayTitle(workspace.title),
              }))}
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) =>
                updateTimelineQuery((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder={buildTimelineSearchPlaceholder(labelProfile.artifactLabelPlural)}
              className="w-full border border-zinc-700 bg-black py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-300 outline-none transition hover:border-osint-primary focus:border-osint-primary"
            />
          </div>

          <div className="relative shrink-0" ref={exportMenuRef}>
            <button
              onClick={() => {
                setShowExportMenu((current) => !current);
                setShowFilters(false);
              }}
              disabled={!timelineSnapshot}
              className={`flex items-center px-3 py-1.5 font-mono text-xs font-bold uppercase ${
                showExportMenu ? 'osint-button-chrome-active' : 'osint-button-chrome'
              }`}
              title="Export or save the current timeline snapshot"
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">Export</span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {showExportMenu && timelineSnapshot && (
              <div className="osint-menu-panel absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 z-50 min-w-[220px]">
                <button
                  onClick={handleExportTimelineMarkdown}
                  className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800"
                  title="Export the visible timeline snapshot as Markdown"
                >
                  <FileText className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Timeline Markdown</div>
                    <div className="text-[10px] text-zinc-500">
                      Readable visible timeline export
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleExportTimelineJson}
                  className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center border-b border-zinc-800"
                  title="Export the visible timeline snapshot as JSON"
                >
                  <FileJson className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Timeline JSON</div>
                    <div className="text-[10px] text-zinc-500">
                      Raw visible timeline data for backup
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => void handleSaveTimelineArtifact()}
                  className="osint-menu-item w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 flex items-center"
                  title="Save the current timeline snapshot as a TIMELINE artifact"
                >
                  <Save className="osint-menu-item-icon w-4 h-4 mr-3 text-zinc-500" />
                  <div>
                    <div className="font-bold">Save Snapshot</div>
                    <div className="text-[10px] text-zinc-500">Store this view in the dossier</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0" ref={filterMenuRef}>
            <button
              onClick={() => {
                setShowFilters((current) => !current);
                setShowExportMenu(false);
              }}
              className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-mono uppercase transition ${
                showFilters
                  ? 'osint-button-chrome-active'
                  : 'osint-button-chrome'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden lg:inline">Filters</span>
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] border border-zinc-700 bg-osint-panel shadow-2xl">
                <div className="border-b border-zinc-800 bg-black px-4 py-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white">
                    Timeline Filters
                  </h3>
                </div>
                <div className="space-y-5 p-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Date Range
                    </label>
                    <OsintSelect
                      ariaLabel="Timeline date range"
                      value={filters.range}
                      onChange={(value) =>
                        updateTimelineQuery((current) => ({
                          ...current,
                          filters: {
                            ...current.filters,
                            range: value as TimelineRange,
                          },
                        }))
                      }
                      triggerClassName="px-3 py-2 pr-8 text-xs font-mono"
                      options={[
                        { value: 'ALL', label: 'All Activity' },
                        { value: '7D', label: 'Last 7 Days' },
                        { value: '30D', label: 'Last 30 Days' },
                        { value: '90D', label: 'Last 90 Days' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-mono uppercase text-zinc-500">
                      Visible Tracks
                    </label>
                    <div className="space-y-2">
                      {TRACK_OPTIONS.map((option) => (
                        <label
                          key={option.track}
                          className="flex items-center justify-between border border-zinc-800 bg-black px-3 py-2 text-xs font-mono text-zinc-300"
                        >
                          <span className="flex items-center gap-2">
                            <option.icon className="h-4 w-4 text-zinc-500" />
                            {option.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={filters.tracks.includes(option.track)}
                            onChange={() => toggleTrackFilter(option.track)}
                            className="h-4 w-4 accent-[var(--osint-primary)]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-mono uppercase text-zinc-500 hover:text-white"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="osint-button-primary px-4 py-1.5 text-xs font-mono font-bold uppercase"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setRightPanelOpen((current) => !current)}
            className={`flex shrink-0 items-center justify-center border p-2 text-xs font-mono uppercase transition ${
              rightPanelOpen
                ? 'border-osint-primary/40 bg-osint-primary/10 text-osint-primary'
                : 'border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white'
            }`}
            title="Toggle event details"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {(leftPanelOpen || rightPanelOpen) && (
        <div
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      )}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={`absolute left-0 top-0 z-30 h-full overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
            leftPanelOpen
              ? 'w-[min(20rem,calc(100vw-1rem))] translate-x-0 border-r border-zinc-800'
              : 'w-[min(20rem,calc(100vw-1rem))] -translate-x-full border-r border-zinc-800 lg:w-0 lg:border-r-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Timeline Dossier
            </div>
            <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
              {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Workspace'}
            </div>
          </div>

          <div className="h-[calc(100%-72px)] overflow-y-auto p-3 custom-scrollbar">
            <Accordion
              title="Events"
              icon={Clock3}
              count={allTimelineEvents.length}
              isOpen={dossierSections.events}
              onToggle={() => setDossierSections((current) => toggleExclusiveSection(current, 'events'))}
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                <button
                  onClick={() => setTrackFocus('ALL')}
                  className={getFocusedButtonClass(focusedTrack === 'ALL' && !focusedRefId)}
                >
                  All Activity
                </button>
                {TRACK_OPTIONS.map((option) => (
                  <button
                    key={option.track}
                    onClick={() => setTrackFocus(option.track)}
                    className={getFocusedButtonClass(
                      focusedTrack === option.track && !focusedRefId
                    )}
                  >
                    {option.label} ({getTrackCount(allTimelineEvents, option.track)})
                  </button>
                ))}
              </div>
            </Accordion>

            <Accordion
              title="Runs"
              icon={Activity}
              count={runItems.length}
              isOpen={dossierSections.runs}
              onToggle={() => setDossierSections((current) => toggleExclusiveSection(current, 'runs'))}
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {runItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No workspace runs available yet.
                  </div>
                ) : (
                  runItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('RUN', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.[0] || 'RUN'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title={labelProfile.artifactLabelPlural}
              icon={FileText}
              count={artifactItems.length}
              isOpen={dossierSections.artifacts}
              onToggle={() =>
                setDossierSections((current) => toggleExclusiveSection(current, 'artifacts'))
              }
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {artifactItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No saved {labelProfile.artifactLabelPlural.toLowerCase()} yet.
                  </div>
                ) : (
                  artifactItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('ARTIFACT', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || labelProfile.artifactLabel}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Signals"
              icon={Radio}
              count={signalItems.length}
              isOpen={dossierSections.signals}
              onToggle={() =>
                setDossierSections((current) => toggleExclusiveSection(current, 'signals'))
              }
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {signalItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No saved signals in this workspace yet.
                  </div>
                ) : (
                  signalItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('SIGNAL', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'Signal'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Entities"
              icon={Fingerprint}
              count={entityItems.length}
              isOpen={dossierSections.entities}
              onToggle={() =>
                setDossierSections((current) => toggleExclusiveSection(current, 'entities'))
              }
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {entityItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No entity milestones in this workspace yet.
                  </div>
                ) : (
                  entityItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('ENTITY', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'ENTITY'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>

            <Accordion
              title="Chats"
              icon={MessageSquare}
              count={chatSessionItems.length}
              isOpen={dossierSections.chats}
              onToggle={() => setDossierSections((current) => toggleExclusiveSection(current, 'chats'))}
              contentClassName={LEFT_PANEL_SECTION_SCROLL_CLASS}
            >
              <div className="space-y-2">
                {chatSessionItems.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] font-mono text-zinc-600">
                    No workspace chats available yet.
                  </div>
                ) : (
                  chatSessionItems.map((item) => (
                    <button
                      key={item.refId}
                      onClick={() => focusReference('CHAT', item.refId)}
                      className={getFocusedButtonClass(focusedRefId === item.refId)}
                    >
                      <div className="truncate font-bold text-zinc-200">{item.title}</div>
                      <div className="mt-1 truncate text-[10px] uppercase tracking-wide text-zinc-500">
                        {item.badges?.join(' / ') || 'CHAT'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-zinc-800 bg-black/70">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!activeWorkspace ? (
              <EmptyState
                icon={Clock3}
                title={workspaces.length === 0 ? 'Timeline Unavailable' : 'No Workspace Selected'}
                description={
                  workspaces.length === 0
                    ? 'Create a workspace first. Timeline becomes useful once Sherlock has saved signals, runs, artifacts, or chat activity.'
                    : 'Select a workspace from the header to inspect its chronology.'
                }
              />
            ) : visibleEvents.length === 0 ? (
              <EmptyState
                icon={Clock3}
                title="No Timeline Events"
                description="This workspace does not match the current search and filter selection yet, including any optional entity or chat chronology tracks."
                action={{
                  label: 'Reset Timeline Filters',
                  onClick: clearFilters,
                }}
              />
            ) : (
              <div className="space-y-8">
                {groupedEvents.map((group) => (
                  <section key={group.label}>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-800" />
                      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                        {group.label}
                      </div>
                      <div className="h-px flex-1 bg-zinc-800" />
                    </div>

                    <div className="space-y-3">
                      {group.events.map((event) => {
                        const EventIcon = getEventIcon(event);
                        const relatedArtifactId =
                          getPrimaryRefId(event, 'ARTIFACT') ||
                          getMetadataValue<string>(event, 'relatedArtifactId') ||
                          getMetadataValue<string>(event, 'linkedArtifactId');
                        const sourceSignalId = getMetadataValue<string>(event, 'sourceSignalId');
                        const previousArtifactId = getMetadataValue<string>(
                          event,
                          'previousArtifactId'
                        );
                        const sessionId =
                          getPrimaryRefId(event, 'CHAT_SESSION') ||
                          getMetadataValue<string>(event, 'sessionId');

                        return (
                          <div
                            key={event.id}
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setRightPanelOpen(true);
                            }}
                            onKeyDown={(keyboardEvent) => {
                              if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
                                return;
                              }
                              keyboardEvent.preventDefault();
                              setSelectedEventId(event.id);
                              setRightPanelOpen(true);
                            }}
                            role="button"
                            tabIndex={0}
                            className={`w-full border p-4 text-left transition ${
                              effectiveSelectedEventId === event.id
                                ? 'border-osint-primary bg-zinc-900/90'
                                : 'border-zinc-800 bg-zinc-950/80 hover:border-zinc-600 hover:bg-zinc-900/80'
                            }`}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                  <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-zinc-500">
                                    {formatEventTime(event.occurredAt)}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-2 border px-2 py-1 text-[10px] font-mono uppercase tracking-wide ${getEventTone(event)}`}
                                  >
                                    <EventIcon className="h-3.5 w-3.5" />
                                    {event.track}
                                  </span>
                                  {event.badges?.map((badge) => (
                                    <span
                                      key={`${event.id}-${badge}`}
                                      className="border border-zinc-700 bg-black px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500"
                                    >
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-3 text-sm font-bold uppercase tracking-wide text-white">
                                  {event.title}
                                </div>
                                {event.summary && (
                                  <p className="mt-2 text-sm font-mono leading-relaxed text-zinc-400">
                                    {event.summary}
                                  </p>
                                )}
                                {(relatedArtifactId ||
                                  sourceSignalId ||
                                  previousArtifactId ||
                                  sessionId) && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {relatedArtifactId && event.track === 'ENTITY' && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('ARTIFACT', relatedArtifactId);
                                        }}
                                        className="border border-violet-500/30 bg-violet-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-violet-200 transition hover:border-violet-400 hover:text-white"
                                      >
                                        In{' '}
                                        {artifactTitleById.get(relatedArtifactId) ||
                                          labelProfile.artifactLabel}
                                      </button>
                                    )}
                                    {sourceSignalId && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('SIGNAL', sourceSignalId);
                                        }}
                                        className="border border-cyan-500/30 bg-cyan-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-cyan-200 transition hover:border-cyan-400 hover:text-white"
                                      >
                                        From {signalTitleById.get(sourceSignalId) || 'Signal'}
                                      </button>
                                    )}
                                    {previousArtifactId && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('ARTIFACT', previousArtifactId);
                                        }}
                                        className="border border-indigo-500/30 bg-indigo-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-indigo-200 transition hover:border-indigo-400 hover:text-white"
                                      >
                                        Previous{' '}
                                        {artifactTitleById.get(previousArtifactId) ||
                                          labelProfile.artifactLabel}
                                      </button>
                                    )}
                                    {sessionId && event.track !== 'CHAT' && (
                                      <button
                                        onClick={(clickEvent) => {
                                          clickEvent.stopPropagation();
                                          focusReference('CHAT', sessionId);
                                        }}
                                        className="border border-emerald-500/30 bg-emerald-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-emerald-200 transition hover:border-emerald-400 hover:text-white"
                                      >
                                        Chat {chatTitleById.get(sessionId) || 'Session'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {relatedArtifactId && (
                                  <button
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation();
                                      openArtifact(relatedArtifactId);
                                    }}
                                    className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                  >
                                    Open {labelProfile.artifactLabel}
                                  </button>
                                )}
                                <button
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    openWorkspaceChat(event);
                                  }}
                                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase text-zinc-300 transition hover:border-osint-primary hover:text-white"
                                >
                                  {sessionId ? 'Open Chat Session' : 'Workspace Chat'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside
          className={`absolute right-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-black/95 transition-all duration-200 lg:relative lg:translate-x-0 ${
            rightPanelOpen
              ? 'w-[min(24rem,calc(100vw-1rem))] translate-x-0 border-l border-zinc-800'
              : 'w-[min(24rem,calc(100vw-1rem))] translate-x-full border-l border-zinc-800 lg:w-0 lg:border-l-0'
          }`}
        >
          <div className="border-b border-zinc-800 px-4 py-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Event Details
            </div>
            <div className="mt-1 text-sm font-bold uppercase tracking-widest text-white">
              {selectedEvent ? selectedEvent.title : 'No event selected'}
            </div>
          </div>
          {selectedEvent && detailActions.length > 0 && (
            <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
              <InspectorActionRow actions={detailActions} />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {!selectedEvent ? (
              <EmptyState
                icon={MessageSquare}
                title="Select An Event"
                description="Pick a signal, run, artifact, entity milestone, or chat event from the chronology to inspect its context and jump into related workspace views."
                className="px-0 py-10"
                panelClassName="max-w-none px-6 py-8"
              />
            ) : (
              <>
                <Accordion
                  title="Summary"
                  icon={Clock3}
                  isOpen={detailSections.summary}
                  onToggle={() =>
                    setDetailSections((current) => ({
                      ...current,
                      summary: !current.summary,
                    }))
                  }
                >
                  <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Type</div>
                      <div className="mt-1">{selectedEvent.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Occurred</div>
                      <div className="mt-1">
                        {selectedEvent.occurredAt > 0
                          ? new Date(selectedEvent.occurredAt).toLocaleString()
                          : 'No canonical timestamp available'}
                      </div>
                    </div>
                    {selectedEvent.summary && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Summary</div>
                        <div className="mt-1 leading-relaxed text-zinc-400">
                          {selectedEvent.summary}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>

                <Accordion
                  title="Context"
                  icon={Workflow}
                  isOpen={detailSections.context}
                  onToggle={() =>
                    setDetailSections((current) => ({
                      ...current,
                      context: !current.context,
                    }))
                  }
                >
                  <div className="space-y-3 px-1 py-1 text-xs font-mono text-zinc-300">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Workspace</div>
                      <div className="mt-1">
                        {activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Unknown'}
                      </div>
                    </div>
                    {selectedChatSession && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Chat Session</div>
                        <div className="mt-1">{selectedChatSession.title || 'Workspace Chat'}</div>
                      </div>
                    )}
                    {selectedEntityName && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Entity</div>
                        <div className="mt-1">{selectedEntityName}</div>
                      </div>
                    )}
                    {selectedArtifact && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Related {labelProfile.artifactLabel}
                        </div>
                        <div className="mt-1">{sanitizeDisplayTitle(selectedArtifact.topic)}</div>
                      </div>
                    )}
                    {parentArtifact && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Parent {labelProfile.artifactLabel}
                        </div>
                        <div className="mt-1">{sanitizeDisplayTitle(parentArtifact.topic)}</div>
                      </div>
                    )}
                    {relatedSignal && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Origin Signal</div>
                        <div className="mt-1">{relatedSignal.content}</div>
                      </div>
                    )}
                    {selectedRun && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source Run</div>
                        <div className="mt-1">{sanitizeDisplayTitle(selectedRun.topic)}</div>
                      </div>
                    )}
                    {selectedChatLaunchContext?.entityName && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Pinned Entity</div>
                        <div className="mt-1">{selectedChatLaunchContext.entityName}</div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'mentionCount') ===
                      'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Artifact Mentions</div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'mentionCount')}
                        </div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'threshold') === 'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Milestone Threshold
                        </div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'threshold')} mentions
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'daysSincePrevious') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">
                          Gap Since Previous
                        </div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'daysSincePrevious')}
                        </div>
                      </div>
                    )}
                    {typeof selectedChatAction?.input?.query === 'string' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Workspace Query</div>
                        <div className="mt-1">{selectedChatAction.input.query}</div>
                      </div>
                    )}
                    {typeof selectedChatAction?.input?.topic === 'string' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Requested Topic</div>
                        <div className="mt-1">{selectedChatAction.input.topic}</div>
                      </div>
                    )}
                    {typeof getMetadataValue<number>(selectedEvent, 'citedSnippetCount') ===
                      'number' && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Citations Used</div>
                        <div className="mt-1">
                          {getMetadataValue<number>(selectedEvent, 'citedSnippetCount')}
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'source') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Source</div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'source')}
                        </div>
                      </div>
                    )}
                    {getMetadataValue<string>(selectedEvent, 'launchSource') && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Launch Source</div>
                        <div className="mt-1">
                          {getMetadataValue<string>(selectedEvent, 'launchSource')}
                        </div>
                      </div>
                    )}
                    {selectedEvent.badges && selectedEvent.badges.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase text-zinc-500">Tags</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedEvent.badges.map((badge) => (
                            <span
                              key={`${selectedEvent.id}-detail-${badge}`}
                              className="border border-zinc-700 bg-black px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
