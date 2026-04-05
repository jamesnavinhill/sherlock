import { describe, expect, it } from 'vitest';
import { AppView } from '@/types';
import { buildPathForAppView } from './navigation';
import {
  DEFAULT_APP_PATH,
  buildRunPath,
  buildWorkspaceArtifactPath,
  buildWorkspaceChatSessionPath,
  buildWorkspaceSurfacePath,
  getRouteDefinition,
  getWorkspaceRouteDefinitions,
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
});
