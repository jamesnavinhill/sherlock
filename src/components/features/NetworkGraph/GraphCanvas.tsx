import React, { useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import type {
  Artifact,
  Workspace,
  EntityAliasMap,
  GraphNodeSubtype,
  ManualConnection,
  ManualNode,
} from '../../../types';
import { cleanEntityName } from '../../../utils/text';
import { getEntityToneCssVar } from '../../../utils/entityPalette';
import { getReportGraphNodeId } from './networkGraphNodeIds';
import { computeStructuredGraphLayout } from './graphLayout';

// Graph Types
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'REPORT' | 'ENTITY';
  subtype?: GraphNodeSubtype;
  label: string;
  data?: Artifact;
  connections: number;
  isManual?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  isManual?: boolean;
}

interface GraphCanvasProps {
  reports: Artifact[];
  manualLinks: ManualConnection[];
  manualNodes: ManualNode[];
  workspaces: Workspace[];
  aliases: EntityAliasMap;
  hiddenNodeIds: Set<string>;
  flaggedNodeIds: Set<string>;

  // Filters
  filterWorkspaceId: string | null;
  showSingletons: boolean;
  showHiddenNodes: boolean;
  showFlaggedOnly: boolean;

  // Interaction State
  isLinkingMode: boolean;
  linkSourceNode: GraphNode | null;

  // Handlers
  onNodeClick: (node: GraphNode | null) => void;
  onSetLinkSource: (node: GraphNode | null) => void;
  onCreateManualLink: (source: GraphNode, target: GraphNode) => void;
  onStatsUpdate: (stats: {
    workspaces: number;
    entities: number;
    links: number;
    hubs: number;
  }) => void;
  isLocked?: boolean;
}

export interface GraphCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  focusNode: (nodeId: string) => void;
}

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(
  (
    {
      reports,
      manualLinks,
      manualNodes,
      workspaces,
      aliases,
      hiddenNodeIds,
      flaggedNodeIds,
      filterWorkspaceId,
      showSingletons,
      showHiddenNodes,
      showFlaggedOnly,
      isLinkingMode,
      linkSourceNode,
      onNodeClick,
      onSetLinkSource,
      onCreateManualLink,
      onStatsUpdate,
      isLocked = false,
    },
    ref
  ) => {
    const getEntityFillColor = (subtype?: GraphNodeSubtype) =>
      `color-mix(in oklab, ${getEntityToneCssVar(subtype)} 28%, var(--osint-dark))`;
    const getEntityStrokeColor = (subtype?: GraphNodeSubtype) => getEntityToneCssVar(subtype);

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const nodePositionsRef = useRef<Record<string, Pick<GraphNode, 'x' | 'y' | 'fx' | 'fy'>>>({});
    const zoomTransformRef = useRef<d3.ZoomTransform | null>(null);

    // D3 Refs
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);

    const buildManualReportArtifact = (id: string, label: string): Artifact => ({
      id,
      workspaceId: id,
      topic: label,
      summary: 'Manually created report node. Content pending investigation.',
      dateStr: new Date().toISOString().split('T')[0],
      agendas: [],
      entities: [],
      leads: [],
      sources: [],
      rawText: '',
    });

    // State Ref to access latest props in D3 closures
    const stateRef = useRef({ isLinkingMode, linkSourceNode });
    useEffect(() => {
      stateRef.current = { isLinkingMode, linkSourceNode };
    }, [isLinkingMode, linkSourceNode]);

    const applyLinkSourceStyling = useCallback(() => {
      if (!svgRef.current) return;

      const selectedSourceId = linkSourceNode?.id || null;
      d3.select(svgRef.current)
        .selectAll<SVGGElement, GraphNode>('.node-group')
        .each((d: GraphNode, index: number, nodes: ArrayLike<SVGGElement>) => {
          const group = d3.select(nodes[index]);
          const isLinkSource = !!selectedSourceId && d.id === selectedSourceId;

          group
            .select('circle')
            .attr(
              'fill',
              isLinkSource ? '#ef4444' : d.type === 'REPORT' ? '#000' : getEntityFillColor(d.subtype)
            )
            .attr(
              'stroke',
              isLinkSource
                ? '#f87171'
                : d.type === 'REPORT'
                  ? '#fff'
                  : getEntityStrokeColor(d.subtype)
            )
            .attr('stroke-width', isLinkSource ? 3 : 1.5);

          group
            .selectAll('path')
            .attr(
              'stroke',
              d.type === 'REPORT'
                ? isLinkSource
                  ? '#f87171'
                  : '#fff'
                : isLinkSource
                  ? '#fff'
                  : getEntityStrokeColor(d.subtype)
            );
        });
    }, [linkSourceNode]);

    // Expose Zoom Methods
    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.2);
        }
      },
      zoomOut: () => {
        if (svgRef.current && zoomRef.current) {
          d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.8);
        }
      },
      focusNode: (nodeId: string) => {
        if (!svgRef.current || !zoomRef.current || !containerRef.current) return;

        const position = nodePositionsRef.current[nodeId];
        if (position?.x === undefined || position?.y === undefined) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const currentScale = zoomTransformRef.current?.k || 1;
        const nextScale = Math.max(1, currentScale);
        const transform = d3.zoomIdentity
          .translate(width / 2 - position.x * nextScale, height / 2 - position.y * nextScale)
          .scale(nextScale);

        d3.select(svgRef.current)
          .transition()
          .duration(180)
          .call(zoomRef.current.transform, transform);
      },
    }));

    // --- D3 Simulation ---
    useEffect(() => {
      applyLinkSourceStyling();
    }, [applyLinkSourceStyling]);

    useEffect(() => {
      const simulation = simulationRef.current;
      if (!simulation) return;

      if (isLocked) {
        simulation.stop();
        return;
      }

      simulation.alphaTarget(0.15).restart();
      simulation.alphaTarget(0);
    }, [isLocked]);

    useEffect(() => {
      if (!svgRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const normalizeId = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const resolveEntityName = (name: string): string => aliases[name] || name;
      const deletedNodeToken = (nodeId: string) => `deleted:${nodeId}`;
      const isNodeDeleted = (id: string, label: string) =>
        hiddenNodeIds.has(deletedNodeToken(id)) || hiddenNodeIds.has(deletedNodeToken(label));
      const isNodeHidden = (id: string, label: string) =>
        hiddenNodeIds.has(id) || hiddenNodeIds.has(label);

      // Filter reports by selected workspace
      const activeReports =
        filterWorkspaceId === 'ALL' || !filterWorkspaceId
          ? reports
          : reports.filter((r) => r.workspaceId === filterWorkspaceId);

      if (!filterWorkspaceId) {
        // No workspace selected; the empty-state path handles the blank graph.
      }

      const rawNodes = new Map<string, GraphNode>();
      const rawLinks: GraphLink[] = [];

      // Helper to get/create node
      const getOrCreateNode = (
        id: string,
        type: 'REPORT' | 'ENTITY',
        label: string,
        reportData?: Artifact,
        isManual: boolean = false,
        subtype?: GraphNodeSubtype
      ) => {
        if (isNodeDeleted(id, label) || (isNodeHidden(id, label) && !showHiddenNodes)) return null;
        if (!rawNodes.has(id)) {
          const previousPosition = nodePositionsRef.current[id];
          // If it's a manual report node but has no report data
          let data = reportData;
          if (type === 'REPORT' && isManual && !data) {
            data = buildManualReportArtifact(id, label);
          }

          rawNodes.set(id, {
            id,
            type,
            subtype,
            label,
            data: data,
            connections: 0,
            isManual,
            x: previousPosition?.x,
            y: previousPosition?.y,
            fx: previousPosition?.fx ?? null,
            fy: previousPosition?.fy ?? null,
          });
        }
        return rawNodes.get(id) ?? null;
      };

      // Build Graph from Manual Nodes
      manualNodes.forEach((mn) =>
        getOrCreateNode(mn.id, mn.type === 'CASE' ? 'REPORT' : mn.type, mn.label, undefined, true, mn.subtype)
      );

      // Build Graph from Reports
      activeReports.forEach((report) => {
        if (!report.id) return;
        const reportNodeId = getReportGraphNodeId(report.id);
        const reportNode = getOrCreateNode(reportNodeId, 'REPORT', report.topic, report);
        if (!reportNode) return;

        if (report.config?.parentArtifactId) {
          const parentReport = activeReports.find(
            (entry) => entry.id === report.config?.parentArtifactId
          );
          if (parentReport?.id) {
            const pId = getReportGraphNodeId(parentReport.id);
            if (rawNodes.has(pId)) rawLinks.push({ source: pId, target: reportNodeId, value: 3 });
          }
        }

        report.entities.forEach((e) => {
          const name = typeof e === 'string' ? e : e.name;
          const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
          const clean = cleanEntityName(name);
          if (!clean) return;
          const display = resolveEntityName(clean);
          const eId = `entity-${normalizeId(display)}`;
          const eNode = getOrCreateNode(eId, 'ENTITY', display, undefined, false, type);
          if (!eNode) return;

          if (type !== 'UNKNOWN' && eNode.subtype === 'UNKNOWN') eNode.subtype = type;

          const linkExists = rawLinks.some(
            (l) =>
              (l.source === reportNodeId && l.target === eId) ||
              (l.source === eId && l.target === reportNodeId)
          );
          if (!linkExists) {
            rawLinks.push({ source: reportNodeId, target: eId, value: 1 });
            reportNode.connections++;
            eNode.connections++;
          }
        });

        (report.sources || []).forEach((source) => {
          const sourceLabel = source.title || source.url;
          const sourceId = `source-${normalizeId(source.url || source.title)}`;
          const sourceNode = getOrCreateNode(
            sourceId,
            'ENTITY',
            sourceLabel,
            undefined,
            false,
            'SOURCE'
          );
          if (!sourceNode) return;

          const linkExists = rawLinks.some(
            (link) =>
              (link.source === reportNodeId && link.target === sourceId) ||
              (link.source === sourceId && link.target === reportNodeId)
          );
          if (!linkExists) {
            rawLinks.push({ source: reportNodeId, target: sourceId, value: 0.8 });
            reportNode.connections++;
            sourceNode.connections++;
          }
        });
      });

      // Manual Links
      manualLinks.forEach((ml) => {
        if (rawNodes.has(ml.source) && rawNodes.has(ml.target)) {
          if (
            !rawLinks.some(
              (l) =>
                (l.source === ml.source && l.target === ml.target) ||
                (l.source === ml.target && l.target === ml.source)
            )
          ) {
            rawLinks.push({ source: ml.source, target: ml.target, value: 4, isManual: true });
            const sourceNode = rawNodes.get(ml.source);
            const targetNode = rawNodes.get(ml.target);
            if (sourceNode) sourceNode.connections++;
            if (targetNode) targetNode.connections++;
          }
        }
      });

      const nodesArray = Array.from(rawNodes.values());
      const linksArray = [...rawLinks];

      // Filters (Singletons, Flagged)
      const nodesToKeep = new Set<string>();
      let filteredNodes = nodesArray;
      let filteredLinks = linksArray;

      if (showFlaggedOnly) {
        nodesArray.forEach((n) => {
          if (flaggedNodeIds.has(n.id) || flaggedNodeIds.has(n.label) || n.type === 'REPORT') {
            nodesToKeep.add(n.id);
          }
        });
        filteredNodes = nodesArray.filter((n) => nodesToKeep.has(n.id));
        filteredLinks = linksArray.filter(
          (l) => nodesToKeep.has(l.source as string) && nodesToKeep.has(l.target as string)
        );
      } else if (!showSingletons) {
        nodesArray.forEach((n) => {
          if (n.isManual || n.type === 'REPORT' || n.connections > 1) nodesToKeep.add(n.id);
        });
        filteredNodes = nodesArray.filter((n) => nodesToKeep.has(n.id));
        filteredLinks = linksArray.filter(
          (l) => nodesToKeep.has(l.source as string) && nodesToKeep.has(l.target as string)
        );
      } else {
        filteredNodes = nodesArray;
        filteredLinks = linksArray;
      }

      const layoutTargets = computeStructuredGraphLayout(
        filteredNodes.map((node) => ({
          id: node.id,
          type: node.type,
          connections: node.connections,
        })),
        filteredLinks.map((link) => ({
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id,
        })),
        width,
        height
      );

      filteredNodes.forEach((node) => {
        const previousPosition = nodePositionsRef.current[node.id];
        const target = layoutTargets[node.id] ?? {
          x: width / 2,
          y: height / 2,
        };

        node.x = previousPosition?.x ?? target.x;
        node.y = previousPosition?.y ?? target.y;
        node.fx = previousPosition?.fx ?? node.fx ?? null;
        node.fy = previousPosition?.fy ?? node.fy ?? null;
      });

      // Update Stats to Parent
      onStatsUpdate({
        workspaces: activeReports.length,
        entities: filteredNodes.filter((n) => n.type === 'ENTITY').length,
        links: filteredLinks.length,
        hubs: filteredNodes.filter((n) => n.connections > 1).length,
      });

      // D3 Rendering
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      const g = svg.append('g');
      gRef.current = g.node();

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          zoomTransformRef.current = e.transform;
          g.attr('transform', e.transform.toString());
        });
      svg.call(zoom);
      zoomRef.current = zoom;
      if (zoomTransformRef.current) {
        svg.call(zoom.transform, zoomTransformRef.current);
      }

      const nodesById = new Map(filteredNodes.map((node) => [node.id, node]));
      const resolveNodeId = (node: string | GraphNode) => (typeof node === 'string' ? node : node.id);
      const getLayoutTarget = (node: GraphNode) =>
        layoutTargets[node.id] ?? {
          x: width / 2,
          y: height / 2,
          tier: 0,
          componentIndex: 0,
          hubId: null,
        };
      const getLinkDistance = (linkDatum: GraphLink) => {
        const sourceNode = nodesById.get(resolveNodeId(linkDatum.source));
        const targetNode = nodesById.get(resolveNodeId(linkDatum.target));
        if (!sourceNode || !targetNode) return 100;

        const sourceTarget = getLayoutTarget(sourceNode);
        const targetTarget = getLayoutTarget(targetNode);
        const tierGap = Math.abs(sourceTarget.tier - targetTarget.tier);
        const componentGap = sourceTarget.componentIndex === targetTarget.componentIndex ? 0 : 30;
        const leafBias =
          Math.min(sourceNode.connections, targetNode.connections) <= 1 ? 22 : 0;
        const reportBias =
          sourceNode.type === 'REPORT' || targetNode.type === 'REPORT' ? -10 : 6;
        const manualBias = linkDatum.isManual ? -12 : 0;

        return Math.max(72, 86 + tierGap * 18 + componentGap + leafBias + reportBias + manualBias);
      };
      const getCollisionRadius = (node: GraphNode) => {
        const baseRadius = node.type === 'REPORT' ? 34 : 20;
        const connectionRadius = Math.min(node.connections, 8) * 2;
        const labelRadius = Math.min(node.label.length, 18) * 0.65;
        return baseRadius + connectionRadius + labelRadius;
      };

      const simulation = d3
        .forceSimulation(filteredNodes)
        .force(
          'link',
          d3
            .forceLink<GraphNode, GraphLink>(filteredLinks)
            .id((d) => d.id)
            .distance((linkDatum) => getLinkDistance(linkDatum))
            .strength((linkDatum) => (linkDatum.isManual ? 0.24 : 0.12))
        )
        .force(
          'charge',
          d3
            .forceManyBody<GraphNode>()
            .strength((node) => -170 - Math.min(node.connections, 9) * 26)
            .distanceMax(620)
        )
        .force(
          'x',
          d3
            .forceX<GraphNode>((node) => getLayoutTarget(node).x)
            .strength((node) => (node.type === 'REPORT' ? 0.14 : 0.1))
        )
        .force(
          'y',
          d3
            .forceY<GraphNode>((node) => getLayoutTarget(node).y)
            .strength((node) => (node.type === 'REPORT' ? 0.14 : 0.1))
        )
        .force(
          'collide',
          d3
            .forceCollide<GraphNode>()
            .radius((node) => getCollisionRadius(node))
            .iterations(2)
        )
        .alphaDecay(0.04)
        .velocityDecay(0.32);

      if (isLocked) {
        simulation.stop();
      }

      simulationRef.current = simulation;

      const link = g
        .append('g')
        .selectAll('line')
        .data(filteredLinks)
        .join('line')
        .attr('stroke', (d: GraphLink) => (d.isManual ? '#ffffff' : '#52525b'))
        .attr('stroke-width', (d: GraphLink) => (d.isManual ? 2 : 1))
        .attr('stroke-dasharray', (d: GraphLink) => (d.isManual ? '0' : '2,2'));

      const node = g
        .append('g')
        .selectAll<SVGGElement, GraphNode>('.node-group')
        .data(filteredNodes)
        .join('g')
        .attr('class', 'node-group')
        .call(
          d3
            .drag<SVGGElement, GraphNode>()
            .on(
              'start',
              (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x ?? null;
                d.fy = d.y ?? null;
              }
            )
            .on(
              'drag',
              (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
                d.fx = event.x;
                d.fy = event.y;
              }
            )
            .on('end', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        )
        .on('click', (event: MouseEvent, d: GraphNode) => {
          event.stopPropagation();

          // Manual Linking Logic
          const currentLinkSource = stateRef.current.linkSourceNode;
          const currentLinkingMode = stateRef.current.isLinkingMode;

          if (currentLinkingMode) {
            if (!currentLinkSource) {
              onSetLinkSource(d);
            } else if (currentLinkSource.id !== d.id) {
              onCreateManualLink(currentLinkSource, d);
            } else {
              onSetLinkSource(null); // Cancel if clicking same node
            }
            return;
          }

          // Normal Click
          onNodeClick(d);
        });

      node
        .append('circle')
        .attr('r', (d: GraphNode) =>
          d.type === 'REPORT' ? 20 : Math.min(6 + d.connections * 2, 20)
        );

      // Icons
      node.each((d: GraphNode, index: number, nodes: ArrayLike<SVGGElement>) => {
        const g = d3.select(nodes[index]);
        let iconPath = '';
        if (d.type === 'REPORT') {
          iconPath =
            'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8';
        } else if (d.subtype === 'PERSON') {
          iconPath = 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z';
        } else if (d.subtype === 'ORGANIZATION') {
          iconPath =
            'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4';
        } else if (d.subtype === 'SOURCE') {
          iconPath = 'M3 6h18 M6 3v6 M18 3v6 M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9z';
        } else if (d.subtype === 'CONCEPT') {
          iconPath = 'M12 2 4 7v10l8 5 8-5V7l-8-5z M12 12l8-5 M12 12 4 7 M12 12v10';
        } else {
          iconPath =
            'M12 22c5.523 0 10-5 10-10S17.523 2 12 2 2 6.5 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01';
        }

        g.append('path')
          .attr('d', iconPath)
          .attr('fill', 'transparent')
          .attr('stroke', d.type === 'REPORT' ? '#000' : getEntityStrokeColor(d.subtype))
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round')
          .attr('stroke-linejoin', 'round')
          .attr('transform', 'translate(-7, -7) scale(0.6)');

        g.selectAll('path').attr(
          'stroke',
          d.type === 'REPORT' ? '#fff' : getEntityStrokeColor(d.subtype)
        );
      });

      node
        .append('text')
        .attr('dy', 30)
        .attr('text-anchor', 'middle')
        .text((d: GraphNode) => d.label.substring(0, 15))
        .attr('fill', '#a1a1aa')
        .style('font-size', '10px')
        .style('font-family', 'monospace');

      applyLinkSourceStyling();

      simulation.on('tick', () => {
        filteredNodes.forEach((graphNode) => {
          nodePositionsRef.current[graphNode.id] = {
            x: graphNode.x,
            y: graphNode.y,
            fx: graphNode.fx ?? null,
            fy: graphNode.fy ?? null,
          };
        });
        link
          .attr('x1', (d: GraphLink) => (d.source as GraphNode).x ?? 0)
          .attr('y1', (d: GraphLink) => (d.source as GraphNode).y ?? 0)
          .attr('x2', (d: GraphLink) => (d.target as GraphNode).x ?? 0)
          .attr('y2', (d: GraphLink) => (d.target as GraphNode).y ?? 0);
        node.attr('transform', (d: GraphNode) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

      return () => {
        simulation.stop();
      };
    }, [
      reports,
      manualLinks,
      workspaces,
      aliases,
      manualNodes,
      hiddenNodeIds,
      filterWorkspaceId,
      showSingletons,
      showHiddenNodes,
      flaggedNodeIds,
      showFlaggedOnly,
      isLocked,
      onCreateManualLink,
      onNodeClick,
      onSetLinkSource,
      onStatsUpdate,
      applyLinkSourceStyling,
    ]);

    return (
      <div ref={containerRef} className="flex-1 w-full h-full relative z-0 bg-black cursor-move">
        <svg ref={svgRef} className="w-full h-full" onClick={() => onNodeClick(null)} />
      </div>
    );
  }
);

GraphCanvas.displayName = 'GraphCanvas';
