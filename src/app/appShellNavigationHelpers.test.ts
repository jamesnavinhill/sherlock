import { describe, expect, it } from 'vitest';

import { resolveNavigationRecord } from './appShellNavigationHelpers';

describe('appShellNavigationHelpers', () => {
  it('resolves workspace, task, and artifact navigation records deterministically', () => {
    const workspace = {
      id: 'ws-1',
      title: 'Atlas Workspace',
      status: 'ACTIVE' as const,
      dateOpened: '2026-04-06',
    };
    const task = {
      id: 'run-1',
      topic: 'Atlas Run',
      status: 'RUNNING' as const,
      startTime: 1,
      report: {
        id: 'artifact-1',
        topic: 'Atlas Report',
        summary: 'Summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'raw',
      },
    };
    const standaloneArtifact = {
      id: 'artifact-2',
      topic: 'Atlas Follow-Up',
      summary: 'Follow-up summary',
      agendas: [],
      leads: [],
      entities: [],
      sources: [],
      rawText: 'raw',
    };

    const byWorkspace = resolveNavigationRecord({
      artifacts: [task.report, standaloneArtifact],
      id: 'ws-1',
      workspaceRuns: [task],
      workspaces: [workspace],
    });
    const byTask = resolveNavigationRecord({
      artifacts: [task.report, standaloneArtifact],
      id: 'run-1',
      workspaceRuns: [task],
      workspaces: [workspace],
    });
    const byArtifact = resolveNavigationRecord({
      artifacts: [task.report, standaloneArtifact],
      id: 'artifact-2',
      workspaceRuns: [task],
      workspaces: [workspace],
    });

    expect(byWorkspace?.kind).toBe('WORKSPACE');
    expect(byTask?.kind).toBe('TASK');
    expect(byArtifact?.kind).toBe('ARTIFACT');
    expect(
      resolveNavigationRecord({
        artifacts: [task.report],
        id: 'missing',
        workspaceRuns: [task],
        workspaces: [workspace],
      })
    ).toBeNull();
  });
});
