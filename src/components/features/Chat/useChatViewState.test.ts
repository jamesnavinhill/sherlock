import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useChatViewState } from './useChatViewState';

describe('useChatViewState', () => {
  beforeEach(() => {
    (window as Window & { innerWidth: number }).innerWidth = 1280;
  });

  it('defaults to desktop panel visibility and keeps artifact expansion scoped to the active workspace', () => {
    const { result, rerender } = renderHook(
      ({ activeWorkspaceId }) => useChatViewState({ activeWorkspaceId }),
      {
        initialProps: {
          activeWorkspaceId: 'ws-1' as string | null,
        },
      }
    );

    expect(result.current.leftPanelOpen).toBe(true);
    expect(result.current.rightPanelOpen).toBe(false);

    act(() => {
      result.current.toggleArtifactCard('artifact-1');
    });

    expect(result.current.artifactCardState).toEqual({
      expanded: { 'artifact-1': true },
      workspaceId: 'ws-1',
    });

    rerender({ activeWorkspaceId: 'ws-2' });

    act(() => {
      result.current.toggleArtifactCard('artifact-2');
    });

    expect(result.current.artifactCardState).toEqual({
      expanded: { 'artifact-2': true },
      workspaceId: 'ws-2',
    });
  });
});
