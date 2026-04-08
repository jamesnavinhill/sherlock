import { describe, expect, it, vi } from 'vitest';

import type { Workspace } from '@/types';
import {
  buildArtifactFromUploadedFile,
  buildWorkspaceItemFromUploadedFile,
  commitWorkspaceDocumentUploads,
} from './documentUploads';

const workspace: Workspace = {
  id: 'ws-1',
  title: 'Atlas Workspace',
  status: 'ACTIVE',
  dateOpened: '2026-04-08',
  description: 'Procurement review',
};

describe('documentUploads', () => {
  it('builds searchable workspace items from readable uploaded files', async () => {
    const file = new File(['Atlas findings\nSecond line'], 'atlas-notes.md', {
      type: 'text/markdown',
    });

    const item = await buildWorkspaceItemFromUploadedFile({
      file,
      source: 'CHAT',
      workspaceId: workspace.id,
    });

    expect(item.kind).toBe('FILE');
    expect(item.title).toBe('atlas-notes.md');
    expect(item.textContent).toContain('Atlas findings');
    expect(item.provenance?.source).toBe('INGESTION');
    expect(item.provenance?.metadata).toEqual(
      expect.objectContaining({
        sourceSurface: 'CHAT',
      })
    );
  });

  it('builds artifact drafts from uploaded files with extracted body text', async () => {
    const file = new File(['Atlas findings\nSecond line'], 'atlas-notes.md', {
      type: 'text/markdown',
    });

    const artifact = await buildArtifactFromUploadedFile({
      artifactType: 'REPORT',
      file,
      source: 'FILES',
      workspace,
    });

    expect(artifact.workspaceId).toBe(workspace.id);
    expect(artifact.topic).toBe('atlas-notes');
    expect(artifact.summary).toContain('Atlas findings');
    expect(artifact.sections?.some((section) => section.title === 'Document Body')).toBe(true);
    expect(artifact.rawText).toContain('Second line');
    expect(artifact.metadata).toEqual(
      expect.objectContaining({
        source: 'UPLOAD',
        sourceSurface: 'FILES',
      })
    );
  });

  it('routes committed uploads through the selected destination flow', async () => {
    const itemFile = new File(['Atlas findings'], 'atlas-notes.md', {
      type: 'text/markdown',
    });
    const artifactFile = new File(['Atlas findings'], 'atlas-brief.md', {
      type: 'text/markdown',
    });
    const createWorkspaceItem = vi.fn(async () => undefined);
    const saveArtifact = vi.fn(async (artifact) => artifact);

    const itemResult = await commitWorkspaceDocumentUploads({
      artifactType: 'REPORT',
      createWorkspaceItem,
      files: [itemFile],
      route: 'WORKSPACE_ITEM',
      saveArtifact,
      source: 'BOARD',
      workspace,
    });
    const artifactResult = await commitWorkspaceDocumentUploads({
      artifactType: 'REPORT',
      createWorkspaceItem,
      files: [artifactFile],
      route: 'ARTIFACT_DRAFT',
      saveArtifact,
      source: 'BOARD',
      workspace,
    });

    expect(itemResult.savedItems).toHaveLength(1);
    expect(itemResult.savedArtifacts).toHaveLength(0);
    expect(artifactResult.savedArtifacts).toHaveLength(1);
    expect(createWorkspaceItem).toHaveBeenCalledTimes(1);
    expect(saveArtifact).toHaveBeenCalledTimes(1);
  });
});
