import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3 } from 'lucide-react';

import type { Artifact, ChatOpenRequest, TimelineRange } from '@/types';
import { buildWorkspaceTimelinePath } from '@/app/routes';
import { useRegisterAppWorkbenchPanel } from '@/app/workbench/useAppWorkbenchHost';
import { PageShell } from '@/components/system/layout/PageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { getWorkspaceDisplayTitle } from '@/domain';
import { useTimelineViewController } from './Timeline/useTimelineViewController';
import { TimelineWorkbenchPanel } from './Timeline/TimelineWorkbenchPanel';
import { TimelineToolbar } from './Timeline/TimelineToolbar';
import { TimelineLibraryRail } from './Timeline/TimelineLibraryRail';
import { TimelineEventList } from './Timeline/TimelineEventList';
import { TimelineInspectorPanel } from './Timeline/TimelineInspectorPanel';

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
    canSaveCurrentView,
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
    handleSaveTimelineView,
    isLoading,
    labelProfile,
    leftPanelOpen,
    openArtifact,
    openWorkspaceChat,
    parentArtifact,
    relatedSignal,
    rightPanelOpen,
    runItems,
    searchParams,
    selectedArtifact,
    selectedChatAction,
    selectedChatLaunchContext,
    selectedChatSession,
    selectedEntityName,
    selectedEvent,
    selectedRun,
    selectedWorkspaceItem,
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
    toggleDetailSection,
    toggleDossierSection,
    toggleTrackFilter,
    updateTimelineQuery,
    visibleEvents,
    workspaces,
  } = useTimelineViewController({
    onOpenChat,
    onOpenReport,
  });
  const timelineWorkbenchPanel = React.useMemo(
    () =>
      activeWorkspace
        ? {
            id: 'timeline-workbench',
            title: 'Timeline Tools',
            description:
              'Saved-view, filter, and snapshot-export actions for the active workspace chronology.',
            defaultOpen: false,
            content: (
              <TimelineWorkbenchPanel
                workspaceTitle={getWorkspaceDisplayTitle(activeWorkspace)}
                visibleEventCount={visibleEvents.length}
                totalEventCount={allTimelineEvents.length}
                range={filters.range}
                activeTracks={filters.tracks}
                canSaveCurrentView={canSaveCurrentView}
                timelineSnapshotAvailable={!!timelineSnapshot}
                onClearFilters={clearFilters}
                onSaveView={() => {
                  void handleSaveTimelineView();
                }}
                onExportTimelineMarkdown={handleExportTimelineMarkdown}
                onExportTimelineJson={handleExportTimelineJson}
                onSaveTimelineArtifact={() => {
                  void handleSaveTimelineArtifact();
                }}
              />
            ),
          }
        : null,
    [
      activeWorkspace,
      allTimelineEvents.length,
      canSaveCurrentView,
      clearFilters,
      filters.range,
      filters.tracks,
      handleExportTimelineJson,
      handleExportTimelineMarkdown,
      handleSaveTimelineArtifact,
      handleSaveTimelineView,
      timelineSnapshot,
      visibleEvents.length,
    ]
  );

  useRegisterAppWorkbenchPanel(timelineWorkbenchPanel);

  if (isLoading) {
    return (
      <div className="osint-shell-empty flex min-h-screen w-full items-center justify-center">
        <EmptyState
          icon={Clock3}
          title="Loading Timeline"
          description="Sherlock is assembling saved workspace chronology from artifacts, runs, signals, and chat activity."
        />
      </div>
    );
  }

  return (
    <PageShell
      className="osint-shell-stage h-screen w-full"
      toolbar={
        <TimelineToolbar
          activeWorkspace={activeWorkspace}
          workspaces={workspaces}
          filters={filters}
          leftPanelOpen={leftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          showExportMenu={showExportMenu}
          showFilters={showFilters}
          timelineSnapshotAvailable={!!timelineSnapshot}
          canSaveCurrentView={canSaveCurrentView}
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
          onToggleExportMenu={() => {
            setShowExportMenu((current) => !current);
            setShowFilters(false);
          }}
          onToggleFilters={() => {
            setShowFilters((current) => !current);
            setShowExportMenu(false);
          }}
          onSaveView={() => {
            void handleSaveTimelineView();
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
      }
    >
      {leftPanelOpen || rightPanelOpen ? (
        <div
          className="osint-shell-backdrop absolute inset-0 z-20 lg:hidden"
          onClick={() => {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
          }}
        />
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <TimelineLibraryRail
          isOpen={leftPanelOpen}
          workspaceTitle={activeWorkspace ? getWorkspaceDisplayTitle(activeWorkspace) : 'Workspace'}
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
          onToggleSection={toggleDossierSection}
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

        <TimelineInspectorPanel
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
          selectedWorkspaceItem={selectedWorkspaceItem}
          selectedChatLaunchContext={selectedChatLaunchContext}
          selectedChatAction={selectedChatAction}
          labelProfile={labelProfile}
          onToggleSummary={() => toggleDetailSection('summary')}
          onToggleContext={() => toggleDetailSection('context')}
        />
      </div>
    </PageShell>
  );
};
