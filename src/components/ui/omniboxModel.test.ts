import { describe, expect, it } from 'vitest';

import type { Artifact, Workspace, WorkspaceItem } from '@/types';
import {
  applyMentionSelection,
  buildMentionCandidates,
  buildOmniboxResults,
  mapWorkspaceSnippetToOmniboxResult,
  resolveMentionQuery,
} from './omniboxModel';

describe('omniboxModel', () => {
  it('maps workspace snippets and builds a mixed result set', () => {
    const workspace: Workspace = {
      id: 'ws-1',
      title: 'Atlas Workspace',
      displayTitle: 'Atlas Workspace',
      status: 'ACTIVE',
      dateOpened: '2026-04-07',
    };
    const artifact: Artifact = {
      id: 'rep-1',
      caseId: 'ws-1',
      topic: 'Atlas Brief',
      summary: 'Brief summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
      createdAt: 100,
    };

    const snippetResult = mapWorkspaceSnippetToOmniboxResult(
      {
        id: 'CTX-WORKSPACE-ITEM-item-1',
        kind: 'NOTE',
        title: 'Atlas note',
        snippet: 'Saved note',
        refId: 'item-1',
        refKind: 'NOTE',
        score: 80,
        timestamp: 120,
        metadata: {
          workspaceItemKind: 'NOTE',
        },
      },
      'ws-1'
    );

    expect(snippetResult.kind).toBe('WORKSPACE_ITEM');
    expect(snippetResult.actions).toContain('PLACE_ON_BOARD');

    const results = buildOmniboxResults({
      query: 'atlas',
      activeWorkspaceId: 'ws-1',
      artifacts: [artifact],
      chatSessions: [],
      snippets: [
        {
          id: 'CTX-REPORT-rep-1',
          kind: 'REPORT',
          title: 'Atlas Brief',
          snippet: 'Artifact summary',
          refId: 'rep-1',
          refKind: 'REPORT',
          score: 90,
          timestamp: 100,
          metadata: {},
        },
      ],
      workspaceItems: [],
      workspaceRuns: [],
      workspaces: [workspace],
    });

    expect(results.some((result) => result.kind === 'WORKSPACE')).toBe(true);
    expect(results.some((result) => result.kind === 'ARTIFACT')).toBe(true);
    expect(results.some((result) => result.kind === 'ROUTE')).toBe(true);
  });

  it('resolves mention queries and applies the selected mention', () => {
    const item: WorkspaceItem = {
      id: 'item-1',
      workspaceId: 'ws-1',
      kind: 'NOTE',
      title: 'Atlas Filing Note',
      createdAt: 100,
      updatedAt: 120,
    };

    const candidates = buildMentionCandidates({
      workspaceId: 'ws-1',
      artifacts: [],
      signals: [],
      workspaceItems: [item],
    });

    const mentionState = resolveMentionQuery('Check @atlas', 'Check @atlas'.length, candidates);
    expect(mentionState?.results[0]?.title).toBe('Atlas Filing Note');

    const applied = applyMentionSelection(
      'Check @atlas',
      'Check @atlas'.length,
      'Check @atlas'.length,
      mentionState?.results[0] || candidates[0]
    );

    expect(applied).toBe('Check @Atlas Filing Note ');
  });
});
