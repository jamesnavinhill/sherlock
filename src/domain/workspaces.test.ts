import { describe, expect, it } from 'vitest';

import {
  extractWorkspaceLaunchFields,
  getWorkspaceDisplayTitle,
  resolveWorkspaceIdentity,
} from './workspaces';

describe('workspace identity helpers', () => {
  it('derives display and launch metadata from legacy tagged titles', () => {
    const identity = extractWorkspaceLaunchFields(
      'Operation: Atlas Procurement\n\n[RUN_ANGLE]: trace shell vendors\n\n[PRIORITY_SOURCES]: sec.gov, usaspending.gov'
    );

    expect(identity).toEqual({
      displayTitle: 'Atlas Procurement',
      launchTopic: 'Atlas Procurement',
      launchAngle: 'trace shell vendors',
      prioritySourcesSummary: 'sec.gov, usaspending.gov',
    });
  });

  it('prefers persisted identity fields when they exist', () => {
    const workspace = {
      title: 'Legacy Workspace [RUN_ANGLE]: old angle',
      displayTitle: 'Atlas Workspace',
      launchTopic: 'Atlas supplier review',
      launchAngle: 'follow supplier risk',
      prioritySourcesSummary: 'sec.gov',
    };

    expect(resolveWorkspaceIdentity(workspace)).toEqual({
      displayTitle: 'Atlas Workspace',
      launchTopic: 'Atlas supplier review',
      launchAngle: 'follow supplier risk',
      prioritySourcesSummary: 'sec.gov',
    });
    expect(getWorkspaceDisplayTitle(workspace)).toBe('Atlas Workspace');
  });
});
