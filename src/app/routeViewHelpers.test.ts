import { describe, expect, it } from 'vitest';

import {
  buildArtifactRouteBreadcrumbs,
  resolveArtifactRouteArtifact,
  resolveBoardRouteState,
  resolveRelatedRunForArtifact,
  workspaceExistsForRoute,
} from './routeViewHelpers';

describe('routeViewHelpers', () => {
  it('builds artifact breadcrumbs from workspace and artifact context', () => {
    expect(
      buildArtifactRouteBreadcrumbs(
        {
          id: 'artifact-1',
          workspaceId: 'ws-1',
          topic: 'Atlas Brief',
          summary: 'Summary',
          agendas: [],
          leads: [],
          entities: [],
          sources: [],
          rawText: 'raw',
        },
        [{ id: 'ws-1', title: 'Atlas Workspace', status: 'ACTIVE', dateOpened: '2026-04-08' }],
        'run-1'
      )
    ).toEqual([
      { type: 'CASE', id: 'ws-1', label: 'Atlas Workspace' },
      { type: 'REPORT', id: 'artifact-1', label: 'Atlas Brief' },
    ]);
  });

  it('resolves the route artifact and related run deterministically', () => {
    const artifact = {
      id: 'artifact-1',
      workspaceId: 'ws-1',
      topic: 'Atlas Brief',
      summary: 'Summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      config: { sourceRunId: 'run-1' },
    };

    const resolvedArtifact = resolveArtifactRouteArtifact([artifact], 'ws-1', 'artifact-1');
    const resolvedRun = resolveRelatedRunForArtifact(
      [{ id: 'run-1', topic: 'Atlas', status: 'COMPLETED', startTime: 1 }],
      resolvedArtifact
    );

    expect(resolvedArtifact?.id).toBe('artifact-1');
    expect(resolvedRun?.id).toBe('run-1');
  });

  it('resolves board-route redirects to the first valid board when needed', () => {
    expect(
      resolveBoardRouteState(
        [
          {
            id: 'board-1',
            workspaceId: 'ws-1',
            name: 'Primary Board',
            sortOrder: 0,
            presentationMode: false,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        'ws-1'
      ).redirectBoardId
    ).toBe('board-1');

    expect(
      resolveBoardRouteState(
        [
          {
            id: 'board-1',
            workspaceId: 'ws-1',
            name: 'Primary Board',
            sortOrder: 0,
            presentationMode: false,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        'ws-1',
        'missing'
      ).redirectBoardId
    ).toBe('board-1');
  });

  it('checks whether the current route workspace exists', () => {
    expect(
      workspaceExistsForRoute(
        [{ id: 'ws-1', title: 'Atlas Workspace', status: 'ACTIVE', dateOpened: '2026-04-08' }],
        'ws-1'
      )
    ).toBe(true);
    expect(workspaceExistsForRoute([], 'missing')).toBe(false);
  });
});
