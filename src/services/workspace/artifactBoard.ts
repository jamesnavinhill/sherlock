import type { Artifact, Headline, WorkspaceBoardItemReference } from '@/types';
import {
  buildWorkspaceArtifactReference,
  buildWorkspaceEntityReference,
  buildWorkspaceKeyFindingReference,
  buildWorkspaceSourceReference,
  buildWorkspaceSignalReference,
  boardRefKey,
  type WorkspaceLibraryEntry,
} from './library';

export interface ArtifactPackageEntries {
  artifactEntry: WorkspaceLibraryEntry;
  entityEntries: WorkspaceLibraryEntry[];
  findingEntries: WorkspaceLibraryEntry[];
  signalEntries: WorkspaceLibraryEntry[];
  sourceEntries: WorkspaceLibraryEntry[];
}

const resolveLibraryEntry = (
  libraryMap: Map<string, WorkspaceLibraryEntry>,
  ref: WorkspaceBoardItemReference
) => libraryMap.get(boardRefKey(ref)) || null;

export const buildArtifactPackageEntries = (input: {
  artifact: Artifact & { id: string; workspaceId: string };
  libraryMap: Map<string, WorkspaceLibraryEntry>;
  workspaceSignals: Headline[];
}): ArtifactPackageEntries | null => {
  const artifactRef = buildWorkspaceArtifactReference(input.artifact.workspaceId, input.artifact);
  const artifactEntry = resolveLibraryEntry(input.libraryMap, artifactRef);
  if (!artifactEntry) return null;

  const findingEntries = (input.artifact.keyFindings || [])
    .filter((finding) => typeof finding.id === 'string' && finding.id.length > 0)
    .map((finding) =>
      resolveLibraryEntry(
        input.libraryMap,
        buildWorkspaceKeyFindingReference(input.artifact.workspaceId, {
          ...finding,
          workspaceId: input.artifact.workspaceId,
          originArtifactId: finding.originArtifactId || input.artifact.id,
        })
      )
    )
    .filter((entry): entry is WorkspaceLibraryEntry => !!entry);

  const entityEntries = input.artifact.entities
    .map((entity) =>
      resolveLibraryEntry(
        input.libraryMap,
        buildWorkspaceEntityReference(
          input.artifact.workspaceId,
          typeof entity === 'string' ? { name: entity, type: 'UNKNOWN' } : entity
        )
      )
    )
    .filter((entry): entry is WorkspaceLibraryEntry => !!entry);

  const sourceEntries = input.artifact.sources
    .map((source) =>
      resolveLibraryEntry(
        input.libraryMap,
        buildWorkspaceSourceReference(input.artifact.workspaceId, source)
      )
    )
    .filter((entry): entry is WorkspaceLibraryEntry => !!entry);

  const signalEntries = input.workspaceSignals
    .filter((signal) => signal.linkedArtifactId === input.artifact.id)
    .map((signal) =>
      resolveLibraryEntry(
        input.libraryMap,
        buildWorkspaceSignalReference(input.artifact.workspaceId, signal)
      )
    )
    .filter((entry): entry is WorkspaceLibraryEntry => !!entry);

  return {
    artifactEntry,
    findingEntries,
    entityEntries,
    sourceEntries,
    signalEntries,
  };
};
