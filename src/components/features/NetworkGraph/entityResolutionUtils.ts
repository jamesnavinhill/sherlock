import type { EntityAliasMap } from '../../../types';
import { getLevenshteinDistance, getCoreName, getTokens } from '../../../utils/entityUtils';

export const detectEntityClusters = (
  allEntities: string[],
  currentAliases: EntityAliasMap,
  ignoredClusters: Set<string> = new Set()
): string[][] => {
  const resolvedSet = new Set<string>();
  allEntities.forEach((entity) => {
    const canonical = currentAliases[entity] || entity;
    resolvedSet.add(canonical);
  });

  const uniqueEntities = Array.from(resolvedSet);
  const parent: Record<string, string> = {};

  uniqueEntities.forEach((entity) => {
    parent[entity] = entity;
  });

  const find = (entity: string): string => {
    if (parent[entity] === entity) return entity;
    return find(parent[entity]);
  };

  const union = (left: string, right: string) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) {
      parent[leftRoot] = rightRoot;
    }
  };

  for (let i = 0; i < uniqueEntities.length; i += 1) {
    for (let j = i + 1; j < uniqueEntities.length; j += 1) {
      const entityA = uniqueEntities[i];
      const entityB = uniqueEntities[j];

      const coreA = getCoreName(entityA);
      const coreB = getCoreName(entityB);

      let isMatch = false;

      if (coreA === coreB && coreA.length > 0) isMatch = true;

      if (!isMatch && coreA.length > 3 && coreB.length > 3) {
        if ((coreA.includes(coreB) || coreB.includes(coreA)) && Math.min(coreA.length, coreB.length) > 4) {
          isMatch = true;
        }
      }

      if (!isMatch) {
        const distance = getLevenshteinDistance(coreA, coreB);
        const maxLength = Math.max(coreA.length, coreB.length);
        if (maxLength > 0 && distance / maxLength < 0.2) isMatch = true;
      }

      if (!isMatch) {
        const tokensA = getTokens(entityA);
        const tokensB = getTokens(entityB);
        if (tokensA.size > 0 && tokensB.size > 0) {
          const intersection = new Set([...tokensA].filter((token) => tokensB.has(token)));
          const unionSet = new Set([...tokensA, ...tokensB]);
          const jaccard = intersection.size / unionSet.size;
          if (jaccard > 0.6) isMatch = true;
        }
      }

      if (isMatch) {
        union(entityA, entityB);
      }
    }
  }

  const rawClusters: Record<string, string[]> = {};
  uniqueEntities.forEach((entity) => {
    const root = find(entity);
    if (!rawClusters[root]) rawClusters[root] = [];
    rawClusters[root].push(entity);
  });

  return Object.values(rawClusters)
    .filter((cluster) => cluster.length > 1)
    .filter((cluster) => {
      const key = cluster.sort().join('::');
      return !ignoredClusters.has(key);
    });
};
