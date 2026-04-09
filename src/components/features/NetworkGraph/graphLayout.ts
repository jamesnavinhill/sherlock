export interface StructuredLayoutNode {
  id: string;
  type: 'REPORT' | 'ENTITY';
  connections: number;
}

export interface StructuredLayoutLink {
  source: string;
  target: string;
}

export interface StructuredLayoutTarget {
  x: number;
  y: number;
  tier: number;
  componentIndex: number;
  hubId: string | null;
}

interface NodeAssignment {
  hubId: string;
  level: number;
}

const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
};

const normalizeAngle = (angle: number) => {
  let next = angle;
  while (next <= -Math.PI) next += TAU;
  while (next > Math.PI) next -= TAU;
  return next;
};

const shortestAngularDistance = (from: number, to: number) => normalizeAngle(to - from);

const averageAngles = (angles: number[]) => {
  if (angles.length === 0) return 0;

  const sums = angles.reduce(
    (accumulator, angle) => ({
      x: accumulator.x + Math.cos(angle),
      y: accumulator.y + Math.sin(angle),
    }),
    { x: 0, y: 0 }
  );

  if (Math.abs(sums.x) < 0.0001 && Math.abs(sums.y) < 0.0001) {
    return normalizeAngle(angles[0] ?? 0);
  }

  return Math.atan2(sums.y, sums.x);
};

const polarToCartesian = (x: number, y: number, angle: number, radius: number) => ({
  x: x + Math.cos(angle) * radius,
  y: y + Math.sin(angle) * radius,
});

const getNodeScore = (node: StructuredLayoutNode) =>
  node.connections + (node.type === 'REPORT' ? 0.25 : 0);

const getComponentScore = (component: StructuredLayoutNode[]) =>
  component.reduce((total, node) => total + getNodeScore(node), 0);

const compareNodesByScore = (left: StructuredLayoutNode, right: StructuredLayoutNode) => {
  const scoreDelta = getNodeScore(right) - getNodeScore(left);
  if (scoreDelta !== 0) return scoreDelta;

  const connectionDelta = right.connections - left.connections;
  if (connectionDelta !== 0) return connectionDelta;

  return left.id.localeCompare(right.id);
};

const buildAdjacency = (nodes: StructuredLayoutNode[], links: StructuredLayoutLink[]) => {
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));

  links.forEach((link) => {
    if (!adjacency.has(link.source) || !adjacency.has(link.target)) return;
    adjacency.get(link.source)?.add(link.target);
    adjacency.get(link.target)?.add(link.source);
  });

  return adjacency;
};

const collectComponents = (
  nodes: StructuredLayoutNode[],
  adjacency: Map<string, Set<string>>
) => {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const components: StructuredLayoutNode[][] = [];

  nodes
    .slice()
    .sort(compareNodesByScore)
    .forEach((node) => {
      if (visited.has(node.id)) return;

      const queue = [node.id];
      const component: StructuredLayoutNode[] = [];
      visited.add(node.id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId) continue;

        const currentNode = byId.get(currentId);
        if (!currentNode) continue;
        component.push(currentNode);

        const neighbors = Array.from(adjacency.get(currentId) ?? []).sort();
        neighbors.forEach((neighborId) => {
          if (visited.has(neighborId)) return;
          visited.add(neighborId);
          queue.push(neighborId);
        });
      }

      components.push(component.sort(compareNodesByScore));
    });

  return components.sort((left, right) => {
    const scoreDelta = getComponentScore(right) - getComponentScore(left);
    if (scoreDelta !== 0) return scoreDelta;
    return right.length - left.length;
  });
};

const assignComponentCenters = (
  componentCount: number,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const centers: Array<{ x: number; y: number }> = [];

  if (componentCount === 0) return centers;

  centers.push({ x: centerX, y: centerY });

  if (componentCount === 1) return centers;

  const orbitRadius = clamp(Math.min(width, height) * 0.28, 150, 300);

  for (let index = 1; index < componentCount; index += 1) {
    const angle = -Math.PI / 2 + (TAU * (index - 1)) / Math.max(1, componentCount - 1);
    centers.push(polarToCartesian(centerX, centerY, angle, orbitRadius));
  }

  return centers;
};

const pickHubNodes = (component: StructuredLayoutNode[]) => {
  if (component.length === 0) return [];

  const sorted = component.slice().sort(compareNodesByScore);
  const desiredHubCount = clamp(Math.round(Math.sqrt(component.length) / 2), 1, Math.min(4, component.length));
  const eligible = sorted.filter((node) => node.connections > 1);

  return (eligible.length > 0 ? eligible : sorted).slice(0, desiredHubCount);
};

const assignNodesToHubs = (
  component: StructuredLayoutNode[],
  adjacency: Map<string, Set<string>>,
  hubs: StructuredLayoutNode[]
) => {
  const assignments = new Map<string, NodeAssignment>();
  const hubRank = new Map(hubs.map((hub, index) => [hub.id, index]));
  const queue: Array<{ id: string; hubId: string; level: number }> = [];

  hubs.forEach((hub) => {
    assignments.set(hub.id, { hubId: hub.id, level: 0 });
    queue.push({ id: hub.id, hubId: hub.id, level: 0 });
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const neighbors = Array.from(adjacency.get(current.id) ?? []).sort();
    neighbors.forEach((neighborId) => {
      const nextLevel = current.level + 1;
      const existing = assignments.get(neighborId);
      const shouldUpdate =
        !existing ||
        nextLevel < existing.level ||
        (nextLevel === existing.level &&
          (hubRank.get(current.hubId) ?? Number.MAX_SAFE_INTEGER) <
            (hubRank.get(existing.hubId) ?? Number.MAX_SAFE_INTEGER));

      if (!shouldUpdate) return;

      assignments.set(neighborId, { hubId: current.hubId, level: nextLevel });
      queue.push({ id: neighborId, hubId: current.hubId, level: nextLevel });
    });
  }

  component.forEach((node) => {
    if (!assignments.has(node.id)) {
      assignments.set(node.id, { hubId: hubs[0]?.id ?? node.id, level: hubs[0] ? 1 : 0 });
    }
  });

  return assignments;
};

export const computeStructuredGraphLayout = (
  nodes: StructuredLayoutNode[],
  links: StructuredLayoutLink[],
  width: number,
  height: number
) => {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 240);
  const adjacency = buildAdjacency(nodes, links);
  const components = collectComponents(nodes, adjacency);
  const componentCenters = assignComponentCenters(components.length, safeWidth, safeHeight);
  const targets: Record<string, StructuredLayoutTarget> = {};

  components.forEach((component, componentIndex) => {
    const componentCenter = componentCenters[componentIndex] ?? {
      x: safeWidth / 2,
      y: safeHeight / 2,
    };
    const componentRadius = clamp(
      90 + Math.sqrt(component.length) * 32,
      110,
      Math.min(safeWidth, safeHeight) * 0.35
    );
    const hubs = pickHubNodes(component);
    const assignments = assignNodesToHubs(component, adjacency, hubs);
    const positionById = new Map<string, { x: number; y: number; angle: number }>();
    const hubAngles = new Map<string, number>();
    const hubCount = Math.max(hubs.length, 1);
    const innerHubRadius = hubCount === 1 ? 0 : clamp(componentRadius * 0.24, 50, 90);
    const maxLevel = component.reduce(
      (currentMax, node) => Math.max(currentMax, assignments.get(node.id)?.level ?? 0),
      0
    );
    const ringStep = maxLevel > 0 ? clamp(componentRadius / (maxLevel + 1.15), 70, 110) : 0;
    const maxConnections = component.reduce(
      (currentMax, node) => Math.max(currentMax, node.connections),
      1
    );

    hubs.forEach((hub, hubIndex) => {
      const angle = hubCount === 1 ? -Math.PI / 2 : -Math.PI / 2 + (TAU * hubIndex) / hubCount;
      const point =
        hubCount === 1
          ? { x: componentCenter.x, y: componentCenter.y }
          : polarToCartesian(componentCenter.x, componentCenter.y, angle, innerHubRadius);

      hubAngles.set(hub.id, angle);
      positionById.set(hub.id, { ...point, angle });
      targets[hub.id] = {
        x: point.x,
        y: point.y,
        tier: 0,
        componentIndex,
        hubId: hub.id,
      };
    });

    for (let level = 1; level <= maxLevel; level += 1) {
      const nodesAtLevel = component.filter((node) => (assignments.get(node.id)?.level ?? 0) === level);

      hubs.forEach((hub) => {
        const group = nodesAtLevel
          .filter((node) => assignments.get(node.id)?.hubId === hub.id)
          .sort(compareNodesByScore);

        if (group.length === 0) return;

        const fallbackAngle = hubAngles.get(hub.id) ?? -Math.PI / 2;
        const wedgeWidth =
          hubCount === 1
            ? clamp(Math.PI * 1.55, 1.8, TAU - 0.35)
            : clamp((TAU / hubCount) * 0.86, 0.9, 1.95);

        const annotatedGroup = group.map((node) => {
          const placedNeighborAngles = Array.from(adjacency.get(node.id) ?? [])
            .map((neighborId) => positionById.get(neighborId)?.angle)
            .filter((angle): angle is number => Number.isFinite(angle));
          const preferredAngle =
            placedNeighborAngles.length > 0 ? averageAngles(placedNeighborAngles) : fallbackAngle;

          return {
            node,
            preferredAngle,
            relativeAngle: shortestAngularDistance(fallbackAngle, preferredAngle),
          };
        });

        annotatedGroup.sort((left, right) => {
          const delta = left.relativeAngle - right.relativeAngle;
          if (delta !== 0) return delta;
          return compareNodesByScore(left.node, right.node);
        });

        annotatedGroup.forEach((entry, index) => {
          const orderedOffset =
            annotatedGroup.length === 1
              ? 0
              : -wedgeWidth / 2 + (wedgeWidth * index) / (annotatedGroup.length - 1);
          const preferredOffset = clamp(entry.relativeAngle, -wedgeWidth / 2, wedgeWidth / 2);
          const finalOffset =
            annotatedGroup.length === 1
              ? preferredOffset * 0.7
              : orderedOffset * 0.62 + preferredOffset * 0.38;
          const angle = normalizeAngle(fallbackAngle + finalOffset);
          const radialBias = Math.max(0, maxConnections - entry.node.connections) * 6;
          const deterministicJitter = (hashString(entry.node.id) - 0.5) * Math.min(18, ringStep * 0.2);
          const radius = innerHubRadius + level * ringStep + radialBias + deterministicJitter;
          const point = polarToCartesian(componentCenter.x, componentCenter.y, angle, radius);

          positionById.set(entry.node.id, { ...point, angle });
          targets[entry.node.id] = {
            x: point.x,
            y: point.y,
            tier: level,
            componentIndex,
            hubId: hub.id,
          };
        });
      });
    }

    component.forEach((node) => {
      if (targets[node.id]) return;
      const fallbackAngle = normalizeAngle(hashString(node.id) * TAU - Math.PI);
      const fallbackPoint = polarToCartesian(
        componentCenter.x,
        componentCenter.y,
        fallbackAngle,
        componentRadius * 0.75
      );

      targets[node.id] = {
        x: fallbackPoint.x,
        y: fallbackPoint.y,
        tier: assignments.get(node.id)?.level ?? 0,
        componentIndex,
        hubId: assignments.get(node.id)?.hubId ?? null,
      };
    });
  });

  return targets;
};
