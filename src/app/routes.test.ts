import { describe, expect, it } from 'vitest';
import { AppView } from '@/types';
import { buildPathForAppView, getAppViewForPath } from './navigation';
import {
  DEFAULT_APP_PATH,
  buildRunPath,
  buildFilesPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceNetworkPath,
  buildWorkspaceSurfacePath,
  getRouteDefinition,
  getWorkspaceRouteDefinitions,
  parseArtifactRouteState,
  parseFilesRouteState,
  parseNetworkRouteState,
} from './routes';

describe('route contract', () => {
  it('keeps discover as the default entry path', () => {
    expect(DEFAULT_APP_PATH).toBe('/discover');
  });

  it('encodes workspace and artifact ids in generated paths', () => {
    expect(buildWorkspaceArtifactPath('workspace alpha', 'artifact/42')).toBe(
      '/workspaces/workspace%20alpha/artifacts/artifact%2F42'
    );
  });

  it('builds focus-aware files and artifact paths', () => {
    expect(buildFilesPath({ workspaceId: 'ws-1', focusItemId: 'item/42' })).toBe(
      '/files?workspaceId=ws-1&focusItemId=item%2F42'
    );
    expect(
      buildWorkspaceArtifactPath('ws-1', 'artifact-2', {
        focusSectionId: 'section-3',
        focusEvidenceId: 'evidence-9',
        inspector: 'REPORT',
      })
    ).toBe(
      '/workspaces/ws-1/artifacts/artifact-2?focusSectionId=section-3&focusEvidenceId=evidence-9&inspector=REPORT'
    );
    expect(buildWorkspaceNetworkPath('ws-1', { focusEntity: 'Atlas Holdings' })).toBe(
      '/workspaces/ws-1/network?focusEntity=Atlas+Holdings'
    );
  });

  it('builds deep-linked chat session paths', () => {
    expect(buildWorkspaceChatSessionPath('ws-1', 'session-2')).toBe(
      '/workspaces/ws-1/chat/session-2'
    );
  });

  it('builds run detail paths for active execution state', () => {
    expect(buildRunPath('run 12')).toBe('/runs/run%2012');
  });

  it('routes workspace surface targets through one canonical helper', () => {
    expect(
      buildWorkspaceSurfacePath({
        surface: 'BOARD_DOCUMENT',
        workspaceId: 'workspace-1',
        boardId: 'board-9',
      })
    ).toBe('/workspaces/workspace-1/board/board-9');
  });

  it('documents timeline filters as URL-owned state', () => {
    expect(getRouteDefinition('WORKSPACE_TIMELINE').urlQuery).toEqual([
      'search',
      'range',
      'tracks',
      'focusTrack',
      'focusRefId',
    ]);
  });

  it('documents files, artifact, and network focus query state', () => {
    expect(getRouteDefinition('FILES').urlQuery).toEqual(['workspaceId', 'focusItemId']);
    expect(getRouteDefinition('WORKSPACE_ARTIFACT').urlQuery).toEqual([
      'focusSectionId',
      'focusEvidenceId',
      'inspector',
    ]);
    expect(getRouteDefinition('WORKSPACE_NETWORK').urlQuery).toEqual(['focusEntity']);
  });

  it('keeps workspace-scoped routes grouped under the workspace prefix', () => {
    expect(getWorkspaceRouteDefinitions().every((route) => route.path.startsWith('/workspaces/'))).toBe(
      true
    );
  });

  it('preserves URL-owned query state when re-targeting the active route view', () => {
    expect(
      buildPathForAppView(AppView.TIMELINE, {
        activeWorkspaceId: 'ws-1',
        pathname: '/workspaces/ws-1/timeline',
        search: '?search=apollo&tracks=CHAT',
      })
    ).toBe('/workspaces/ws-1/timeline?search=apollo&tracks=CHAT');
  });

  it('treats the workspace landing route as part of the workspace app view', () => {
    expect(getAppViewForPath('/workspaces/ws-1')).toBe(AppView.WORKSPACE);
    expect(
      buildPathForAppView(AppView.WORKSPACE, {
        activeWorkspaceId: 'ws-1',
        pathname: '/workspaces/ws-1',
      })
    ).toBe('/workspaces/ws-1');
  });

  it('parses focus-aware files, artifact, and network query state', () => {
    expect(parseFilesRouteState(new URLSearchParams('workspaceId=ws-1&focusItemId=item-1'))).toEqual(
      {
        workspaceId: 'ws-1',
        focusItemId: 'item-1',
      }
    );
    expect(
      parseArtifactRouteState(
        new URLSearchParams(
          'focusSectionId=section-1&focusEvidenceId=evidence-2&inspector=REPORT'
        )
      )
    ).toEqual({
      focusSectionId: 'section-1',
      focusEvidenceId: 'evidence-2',
      inspector: 'REPORT',
    });
    expect(parseNetworkRouteState(new URLSearchParams('focusEntity=Atlas+Holdings'))).toEqual({
      focusEntity: 'Atlas Holdings',
    });
  });
});
