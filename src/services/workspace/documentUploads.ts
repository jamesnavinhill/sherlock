import { buildArtifactFollowUps, buildArtifactSections, getWorkspaceDisplayTitle } from '@/domain';
import type { Artifact, ArtifactType, Workspace, WorkspaceItem } from '@/types';
import { createLocalId } from '@/utils/id';

export type WorkspaceDocumentUploadRoute = 'WORKSPACE_ITEM' | 'ARTIFACT_DRAFT';
export type WorkspaceDocumentUploadSource = 'CHAT' | 'BOARD' | 'FILES';

export interface CommitWorkspaceDocumentUploadsResult {
  route: WorkspaceDocumentUploadRoute;
  targetWorkspaceId: string;
  savedArtifacts: Artifact[];
  savedItems: WorkspaceItem[];
}

const READABLE_TEXT_MIME_PREFIXES = ['text/'];
const READABLE_TEXT_EXTENSIONS = [
  '.csv',
  '.html',
  '.json',
  '.md',
  '.markdown',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
];

const MAX_ITEM_TEXT_LENGTH = 24000;
const MAX_ARTIFACT_TEXT_LENGTH = 32000;
const MAX_ARTIFACT_SECTION_TEXT_LENGTH = 6000;

const summarizeText = (value: string, max = 240) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 3).trimEnd()}...`;
};

const trimFileExtension = (fileName: string) => fileName.replace(/\.[^.]+$/, '').trim();

const formatArtifactTypeLabel = (artifactType: ArtifactType) =>
  artifactType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(sizeBytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  }
  if (sizeBytes >= 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${Math.max(0, sizeBytes)} B`;
};

const isReadableTextFile = (file: Pick<File, 'name' | 'type'>) => {
  const lowerFileName = file.name.toLowerCase();
  return (
    READABLE_TEXT_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix)) ||
    READABLE_TEXT_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension))
  );
};

const readPreviewUrl = async (file: File): Promise<string | undefined> => {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return undefined;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

const readFileAsTextWithReader = async (file: File): Promise<string | undefined> =>
  await new Promise<string | undefined>((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === 'string' ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsText(file);
  });

const readTextContent = async (file: File, maxLength: number): Promise<string | undefined> => {
  if (!isReadableTextFile(file)) {
    return undefined;
  }

  try {
    const text =
      typeof file.text === 'function' ? (await file.text()).trim() : '';
    if (!text) {
      const fallbackText = (await readFileAsTextWithReader(file))?.trim();
      if (!fallbackText) {
        return undefined;
      }
      return fallbackText.length <= maxLength
        ? fallbackText
        : fallbackText.slice(0, maxLength).trimEnd();
    }
    return text.length <= maxLength ? text : text.slice(0, maxLength).trimEnd();
  } catch {
    const fallbackText = (await readFileAsTextWithReader(file))?.trim();
    if (!fallbackText) {
      return undefined;
    }
    return fallbackText.length <= maxLength
      ? fallbackText
      : fallbackText.slice(0, maxLength).trimEnd();
  }
};

const buildUploadMetadataItems = (file: File) => [
  `Original file: ${file.name}`,
  `Detected type: ${file.type || 'Unknown'}`,
  `Size: ${formatFileSize(file.size)}`,
];

const buildArtifactSummary = (file: File, extractedText?: string) =>
  extractedText
    ? summarizeText(extractedText, 320)
    : summarizeText(
        `${trimFileExtension(file.name) || file.name} was uploaded from the local device as a draft artifact for workspace review.`,
        320
      );

const buildArtifactBody = (file: File, extractedText?: string) =>
  extractedText
    ? extractedText.slice(0, MAX_ARTIFACT_SECTION_TEXT_LENGTH).trimEnd()
    : `This uploaded document did not expose readable text in the browser. Review the original file metadata below and add interpretation manually if needed.`;

const buildArtifactRawText = (file: File, extractedText?: string) =>
  extractedText ||
  JSON.stringify(
    {
      fileName: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    },
    null,
    2
  );

export const buildWorkspaceItemFromUploadedFile = async (input: {
  file: File;
  source: WorkspaceDocumentUploadSource;
  workspaceId: string;
}): Promise<WorkspaceItem> => {
  const previewUrl = await readPreviewUrl(input.file);
  const textContent = await readTextContent(input.file, MAX_ITEM_TEXT_LENGTH);
  const now = Date.now();

  return {
    id: createLocalId('workspace-item'),
    workspaceId: input.workspaceId,
    kind:
      input.file.type.startsWith('image/') || input.file.type.startsWith('video/')
        ? 'MEDIA'
        : 'FILE',
    title: input.file.name,
    description:
      textContent ||
      `${input.file.name} - ${formatFileSize(input.file.size)}${
        input.file.type ? ` (${input.file.type})` : ''
      }`,
    textContent,
    mimeType: input.file.type || undefined,
    fileName: input.file.name,
    sizeBytes: input.file.size,
    previewUrl: previewUrl || undefined,
    provenance: {
      source: 'INGESTION',
      description: 'Captured from a local file upload.',
      metadata: {
        sourceSurface: input.source,
      },
    },
    metadata: {
      sourceSurface: input.source,
      readableTextExtracted: !!textContent,
    },
    createdAt: now,
    updatedAt: now,
  };
};

export const buildArtifactFromUploadedFile = async (input: {
  artifactType: ArtifactType;
  file: File;
  source: WorkspaceDocumentUploadSource;
  workspace: Workspace;
}): Promise<Artifact> => {
  const extractedText = await readTextContent(input.file, MAX_ARTIFACT_TEXT_LENGTH);
  const now = Date.now();
  const summary = buildArtifactSummary(input.file, extractedText);

  return {
    id: createLocalId('rep'),
    workspaceId: input.workspace.id,
    topic: trimFileExtension(input.file.name) || input.file.name,
    dateStr: new Date(now).toLocaleDateString(),
    summary,
    agendas: [],
    leads: [],
    followUps: buildArtifactFollowUps({ followUps: [] }),
    sections: buildArtifactSections({
      sections: [
        {
          kind: 'EXECUTIVE_SUMMARY',
          title: 'Uploaded Document Summary',
          content: summary,
        },
        {
          kind: 'CUSTOM',
          title: 'Document Body',
          content: buildArtifactBody(input.file, extractedText),
        },
        {
          kind: 'EVIDENCE',
          title: 'File Metadata',
          items: buildUploadMetadataItems(input.file),
        },
      ],
      summary,
      artifactType: input.artifactType,
    }),
    artifactType: input.artifactType,
    entities: [],
    sources: [],
    evidence: [
      {
        id: createLocalId('artifact-evidence'),
        kind: 'DATA_POINT',
        title: 'Uploaded File',
        summary: `${input.file.name} (${formatFileSize(input.file.size)})`,
        metadata: {
          fileName: input.file.name,
          mimeType: input.file.type || undefined,
          sizeBytes: input.file.size,
          sourceSurface: input.source,
        },
      },
    ],
    rawText: buildArtifactRawText(input.file, extractedText),
    labelProfileId: input.workspace.labelProfileId,
    packId: input.workspace.packId,
    purposeId: input.workspace.purposeId,
    metadata: {
      source: 'UPLOAD',
      sourceSurface: input.source,
      originalFileName: input.file.name,
      mimeType: input.file.type || undefined,
      sizeBytes: input.file.size,
      readableTextExtracted: !!extractedText,
    },
    config: {
      packId: input.workspace.packId,
      purposeId: input.workspace.purposeId,
      artifactType: input.artifactType,
      labelProfileId: input.workspace.labelProfileId,
    },
  };
};

export const commitWorkspaceDocumentUploads = async (input: {
  artifactType: ArtifactType;
  createWorkspaceItem: (item: WorkspaceItem) => Promise<unknown>;
  files: File[];
  route: WorkspaceDocumentUploadRoute;
  saveArtifact: (
    artifact: Artifact,
    parentContext?: { topic: string; summary: string }
  ) => Promise<Artifact>;
  source: WorkspaceDocumentUploadSource;
  workspace: Workspace;
}): Promise<CommitWorkspaceDocumentUploadsResult> => {
  if (input.route === 'WORKSPACE_ITEM') {
    const savedItems: WorkspaceItem[] = [];
    for (const file of input.files) {
      const item = await buildWorkspaceItemFromUploadedFile({
        file,
        source: input.source,
        workspaceId: input.workspace.id,
      });
      await input.createWorkspaceItem(item);
      savedItems.push(item);
    }

    return {
      route: input.route,
      targetWorkspaceId: input.workspace.id,
      savedArtifacts: [],
      savedItems,
    };
  }

  const savedArtifacts: Artifact[] = [];
  for (const file of input.files) {
    const artifact = await buildArtifactFromUploadedFile({
      artifactType: input.artifactType,
      file,
      source: input.source,
      workspace: input.workspace,
    });
    const savedArtifact = await input.saveArtifact(artifact, {
      topic: getWorkspaceDisplayTitle(input.workspace),
      summary:
        input.workspace.description || `${getWorkspaceDisplayTitle(input.workspace)} workspace`,
    });
    savedArtifacts.push(savedArtifact);
  }

  return {
    route: input.route,
    targetWorkspaceId: input.workspace.id,
    savedArtifacts,
    savedItems: [],
  };
};

export const getWorkspaceDocumentUploadSuccessMessage = (
  result: CommitWorkspaceDocumentUploadsResult
) => {
  if (result.route === 'WORKSPACE_ITEM') {
    return result.savedItems.length === 1
      ? 'Added uploaded document to the workspace library.'
      : `Added ${result.savedItems.length} uploaded documents to the workspace library.`;
  }

  return result.savedArtifacts.length === 1
    ? `Created ${formatArtifactTypeLabel(result.savedArtifacts[0]?.artifactType || 'REPORT')} draft from the uploaded document.`
    : `Created ${result.savedArtifacts.length} artifact drafts from the uploaded documents.`;
};
