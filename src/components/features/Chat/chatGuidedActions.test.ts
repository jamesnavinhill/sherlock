import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildArtifactDraftFromGuidedDraft,
  buildLaunchRequestFromGuidedDraft,
  getGuidedAssistantPrompt,
  getNextGuidedStep,
  getPreviousGuidedStep,
  summarizeGuidedStep,
} = vi.hoisted(() => ({
  buildArtifactDraftFromGuidedDraft: vi.fn(),
  buildLaunchRequestFromGuidedDraft: vi.fn(),
  getGuidedAssistantPrompt: vi.fn(),
  getNextGuidedStep: vi.fn(),
  getPreviousGuidedStep: vi.fn(),
  summarizeGuidedStep: vi.fn(),
}));

vi.mock('@/services/chat/guidedMode', () => ({
  buildArtifactDraftFromGuidedDraft,
  buildLaunchRequestFromGuidedDraft,
  getGuidedAssistantPrompt,
  getNextGuidedStep,
  getPreviousGuidedStep,
  summarizeGuidedStep,
}));

import { saveGuidedChatDraft } from './chatGuidedActions';

describe('chatGuidedActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildArtifactDraftFromGuidedDraft.mockReturnValue({
      report: {
        topic: 'Guided brief',
        summary: 'Guided summary',
        agendas: [],
        leads: [],
        entities: [],
        sources: [],
        rawText: 'raw',
        config: {},
      },
    });
  });

  it('uses the resolved workspace display title when saving guided drafts into the current workspace', async () => {
    const saveArtifact = vi.fn(async (report) => ({
      ...report,
      id: 'artifact-1',
    }));
    const addChatAction = vi.fn(async () => undefined);
    const addToast = vi.fn();

    await saveGuidedChatDraft({
      activeSession: {
        id: 'session-1',
        workspaceId: 'ws-1',
        title: 'Guided session',
        createdAt: 1,
        updatedAt: 1,
      } as never,
      activeWorkspace: {
        id: 'ws-1',
        title: '[WORKSPACE]: Legacy Atlas',
        displayTitle: 'Atlas Workspace',
        status: 'ACTIVE',
        dateOpened: '2026-04-08',
      } as never,
      addChatAction,
      addToast,
      saveArtifact,
      customScopes: [],
      guidedState: {
        mode: 'GUIDED',
        step: 'REVIEW',
        draft: {
          workspaceIntent: 'CURRENT',
          topic: 'Atlas procurement anomalies',
        },
      } as never,
    });

    expect(saveArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Guided brief',
      }),
      {
        topic: 'Atlas Workspace',
        summary: 'Atlas Workspace workspace',
      }
    );
  });
});
