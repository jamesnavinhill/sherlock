import { cleanEntityName } from '@/utils/text';

export const normalizeGraphId = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getEntityGraphNodeId = (entityName: string) =>
  `entity-${normalizeGraphId(cleanEntityName(entityName))}`;

// Keep artifact-node ids stable for existing hidden/flagged graph references.
export const getReportGraphNodeId = (artifactId: string) => `case-${artifactId}`;

export const getDeletedNodeToken = (nodeId: string) => `deleted:${nodeId}`;

export const replaceNodeReference = (values: string[], references: string[], nextValue: string) => {
  const shouldReplace = values.some((value) => references.includes(value));
  if (!shouldReplace) return values;

  const next = new Set(values.filter((value) => !references.includes(value)));
  next.add(nextValue);
  return Array.from(next);
};

export const removeNodeReferences = (values: string[], references: string[]) =>
  values.filter((value) => !references.includes(value));
