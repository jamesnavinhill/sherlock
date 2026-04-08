import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useTimelineFeatureState } = vi.hoisted(() => ({
  useTimelineFeatureState: vi.fn(),
}));

const { buildTimelineViewModel } = vi.hoisted(() => ({
  buildTimelineViewModel: vi.fn(),
}));

vi.mock('@/store/selectors/featureSelectors', () => ({
  useTimelineFeatureState,
}));

vi.mock('./timelineViewModel', () => ({
  buildTimelineViewModel,
}));

import { useTimelineViewController } from './useTimelineViewController';

describe('useTimelineViewController', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useTimelineFeatureState.mockReturnValue({
      activeWorkspaceId: 'ws-1',
      artifacts: [
        {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Report',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
        },
      ],
      chatActionsBySessionId: {},
      chatSessions: [],
      headlines: [],
      isLoading: false,
      addToast: vi.fn(),
      ensureWorkspaceBoard: vi.fn(async () => ({ id: 'board-1' })),
      queueBoardPlacement: vi.fn(),
      saveArtifact: vi.fn(async () => ({ topic: 'Timeline Snapshot' })),
      setActiveWorkspaceId: vi.fn(),
      workspaceRuns: [],
      workspaces: [],
    });

    buildTimelineViewModel.mockReturnValue({
      activeWorkspace: { id: 'ws-1' },
      allTimelineEvents: [],
      artifactItems: [],
      artifactTitleById: {},
      chatSessionItems: [],
      chatTitleById: {},
      effectiveSelectedEventId: null,
      entityItems: [],
      groupedEvents: [],
      labelProfile: { artifactLabel: 'Artifact' },
      parentArtifact: null,
      previousArtifactId: undefined,
      relatedSignal: null,
      runItems: [],
      selectedArtifact: null,
      selectedChatAction: null,
      selectedChatLaunchContext: null,
      selectedChatSession: null,
      selectedEntityName: null,
      selectedEvent: null,
      selectedRun: null,
      signalItems: [],
      signalTitleById: {},
      timelineSnapshot: null,
      visibleEvents: [],
    });
  });

  it('opens known artifacts through the injected report handler', () => {
    const onOpenReport = vi.fn();

    const { result } = renderHook(
      () =>
        useTimelineViewController({
          onOpenChat: vi.fn(),
          onOpenReport,
        }),
      {
        wrapper: ({ children }) => React.createElement(MemoryRouter, null, children),
      }
    );

    result.current.openArtifact('artifact-1');

    expect(onOpenReport).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'artifact-1',
      })
    );
  });
});
