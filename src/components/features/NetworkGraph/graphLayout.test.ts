import { describe, expect, it } from 'vitest';

import { computeStructuredGraphLayout } from './graphLayout';

describe('computeStructuredGraphLayout', () => {
  it('keeps more connected nodes closer to the center than leaves', () => {
    const layout = computeStructuredGraphLayout(
      [
        { id: 'hub', type: 'REPORT', connections: 6 },
        { id: 'bridge', type: 'ENTITY', connections: 3 },
        { id: 'leaf-a', type: 'ENTITY', connections: 1 },
        { id: 'leaf-b', type: 'ENTITY', connections: 1 },
      ],
      [
        { source: 'hub', target: 'bridge' },
        { source: 'hub', target: 'leaf-a' },
        { source: 'bridge', target: 'leaf-b' },
      ],
      900,
      700
    );

    const centerX = 450;
    const centerY = 350;
    const distanceFromCenter = (id: string) =>
      Math.hypot(layout[id].x - centerX, layout[id].y - centerY);

    expect(distanceFromCenter('hub')).toBeLessThan(distanceFromCenter('leaf-a'));
    expect(distanceFromCenter('bridge')).toBeLessThan(distanceFromCenter('leaf-b'));
  });

  it('keeps second-level nodes nearer to their own hub neighborhood', () => {
    const layout = computeStructuredGraphLayout(
      [
        { id: 'hub-a', type: 'REPORT', connections: 4 },
        { id: 'hub-b', type: 'REPORT', connections: 4 },
        { id: 'bridge-a', type: 'ENTITY', connections: 2 },
        { id: 'bridge-b', type: 'ENTITY', connections: 2 },
        { id: 'leaf-a', type: 'ENTITY', connections: 1 },
        { id: 'leaf-b', type: 'ENTITY', connections: 1 },
      ],
      [
        { source: 'hub-a', target: 'bridge-a' },
        { source: 'bridge-a', target: 'leaf-a' },
        { source: 'hub-b', target: 'bridge-b' },
        { source: 'bridge-b', target: 'leaf-b' },
        { source: 'hub-a', target: 'hub-b' },
      ],
      1000,
      720
    );

    const distanceBetween = (left: string, right: string) =>
      Math.hypot(layout[left].x - layout[right].x, layout[left].y - layout[right].y);

    expect(distanceBetween('leaf-a', 'hub-a')).toBeLessThan(distanceBetween('leaf-a', 'hub-b'));
    expect(distanceBetween('leaf-b', 'hub-b')).toBeLessThan(distanceBetween('leaf-b', 'hub-a'));
    expect(distanceBetween('bridge-a', 'hub-a')).toBeLessThan(
      distanceBetween('bridge-a', 'hub-b')
    );
  });

  it('returns deterministic targets for identical graph input', () => {
    const nodes = [
      { id: 'report-1', type: 'REPORT' as const, connections: 5 },
      { id: 'entity-1', type: 'ENTITY' as const, connections: 3 },
      { id: 'entity-2', type: 'ENTITY' as const, connections: 2 },
      { id: 'entity-3', type: 'ENTITY' as const, connections: 1 },
    ];
    const links = [
      { source: 'report-1', target: 'entity-1' },
      { source: 'report-1', target: 'entity-2' },
      { source: 'entity-2', target: 'entity-3' },
    ];

    expect(computeStructuredGraphLayout(nodes, links, 840, 640)).toEqual(
      computeStructuredGraphLayout(nodes, links, 840, 640)
    );
  });
});
