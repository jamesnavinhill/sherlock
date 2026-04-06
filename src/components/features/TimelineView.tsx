import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3 } from 'lucide-react';

import type { Artifact, ChatOpenRequest, TimelineRange } from '@/types';
import { buildWorkspaceTimelinePath } from '@/app/routes';
import { BackgroundMatrixRain } from '@/components/ui/BackgroundMatrixRain';
import { EmptyState } from '@/components/ui/EmptyState';
import { sanitizeDisplayTitle } from '@/domain';
import { useTimelineViewController } from './Timeline/useTimelineViewController';
import { toggleExclusiveSection } from './Timeline/timelineViewUtils';
import { TimelineToolbar } from './Timeline/TimelineToolbar';
import { TimelineDossierPanel } from './Timeline/TimelineDossierPanel';
import { TimelineEventList } from './Timeline/TimelineEventList';
import { TimelineDetailRail } from './Timeline/TimelineDetailRail';

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

      <TimelineToolbar
        activeWorkspace={activeWorkspace}
        workspaces={workspaces}
        labelProfile={labelProfile}
        search={search}
        filters={filters}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        showExportMenu={showExportMenu}
        showFilters={showFilters}
        timelineSnapshotAvailable={!!timelineSnapshot}
        exportMenuRef={exportMenuRef}
        filterMenuRef={filterMenuRef}
        onToggleLeftPanel={() => setLeftPanelOpen((current) => !current)}
        onToggleRightPanel={() => setRightPanelOpen((current) => !current)}
        onWorkspaceChange={(workspaceId) => {
          if (workspaceId) {
            const nextSearch = searchParams.toString();
            navigate({
              pathname: buildWorkspaceTimelinePath(workspaceId),
              search: nextSearch ? `?${nextSearch}` : '',
            });
          } else {
            setActiveWorkspaceId(null);
          }
        }}
        onSearchChange={(value) =>
          updateTimelineQuery((current) => ({
            ...current,
            search: value,
          }))
        }
        onToggleExportMenu={() => {
          setShowExportMenu((current) => !current);
          setShowFilters(false);
        }}
        onToggleFilters={() => {
          setShowFilters((current) => !current);
          setShowExportMenu(false);
        }}
        onCloseFilters={() => setShowFilters(false)}
        onClearFilters={clearFilters}
        onRangeChange={(range) =>
          updateTimelineQuery((current) => ({
            ...current,
            filters: {
              ...current.filters,
              range: range as TimelineRange,
            },
          }))
        }
        onToggleTrackFilter={toggleTrackFilter}
        onExportTimelineMarkdown={handleExportTimelineMarkdown}
        onExportTimelineJson={handleExportTimelineJson}
        onSaveTimelineArtifact={() => {
          void handleSaveTimelineArtifact();
        }}
      />

      {leftPanelOpen || rightPanelOpen ? (
        <div
          className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <TimelineDossierPanel
          isOpen={leftPanelOpen}
          workspaceTitle={activeWorkspace ? sanitizeDisplayTitle(activeWorkspace.title) : 'Workspace'}
          labelProfile={labelProfile}
          dossierSections={dossierSections}
          allTimelineEvents={allTimelineEvents}
          runItems={runItems}
          artifactItems={artifactItems}
          signalItems={signalItems}
          entityItems={entityItems}
          chatSessionItems={chatSessionItems}
          focusedTrack={focusedTrack}
          focusedRefId={focusedRefId}
          onToggleSection={(section) =>
            setDossierSections((current) => toggleExclusiveSection(current, section))
          }
          onSetTrackFocus={setTrackFocus}
          onFocusReference={focusReference}
        />

        <TimelineEventList
          activeWorkspace={activeWorkspace}
          workspaces={workspaces}
          visibleEvents={visibleEvents}
          groupedEvents={groupedEvents}
          labelProfile={labelProfile}
          effectiveSelectedEventId={effectiveSelectedEventId}
          artifactTitleById={artifactTitleById}
          signalTitleById={signalTitleById}
          chatTitleById={chatTitleById}
          onClearFilters={clearFilters}
          onSelectEvent={(eventId) => {
            setSelectedEventId(eventId);
            setRightPanelOpen(true);
          }}
          onFocusReference={focusReference}
          onOpenArtifact={openArtifact}
          onOpenWorkspaceChat={openWorkspaceChat}
        />

        <TimelineDetailRail
          isOpen={rightPanelOpen}
          selectedEvent={selectedEvent}
          detailSections={detailSections}
          detailActions={detailActions}
          activeWorkspace={activeWorkspace}
          selectedChatSession={selectedChatSession}
          selectedEntityName={selectedEntityName}
          selectedArtifact={selectedArtifact}
          parentArtifact={parentArtifact}
          relatedSignal={relatedSignal}
          selectedRun={selectedRun}
          selectedChatLaunchContext={selectedChatLaunchContext}
          selectedChatAction={selectedChatAction}
          labelProfile={labelProfile}
          onToggleSummary={() =>
            setDetailSections((current) => ({
              ...current,
              summary: !current.summary,
            }))
          }
          onToggleContext={() =>
            setDetailSections((current) => ({
              ...current,
              context: !current.context,
            }))
          }
        />
      </div>
    </div>
  );
};
