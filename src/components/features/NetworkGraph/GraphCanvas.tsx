import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { InvestigationReport, Case, EntityAliasMap, ManualConnection, ManualNode, Entity } from '../../../types';
import { cleanEntityName } from '../../../utils/text';

// Graph Types
export interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    type: 'CASE' | 'ENTITY';
    subtype?: 'PERSON' | 'ORGANIZATION' | 'UNKNOWN';
    label: string;
    data?: InvestigationReport;
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
    reports: InvestigationReport[];
    manualLinks: ManualConnection[];
    manualNodes: ManualNode[];
    cases: Case[];
    aliases: EntityAliasMap;
    hiddenNodeIds: Set<string>;
    flaggedNodeIds: Set<string>;

    // Filters
    filterCaseId: string;
    showSingletons: boolean;
    showHiddenNodes: boolean;
    showFlaggedOnly: boolean;

    // Interaction State
    isLinkingMode: boolean;
    linkSourceNode: GraphNode | null;

    // Handlers
    onNodeClick: (node: GraphNode) => void;
    onSetLinkSource: (node: GraphNode | null) => void;
    onCreateManualLink: (source: GraphNode, target: GraphNode) => void;
    onStatsUpdate: (stats: { cases: number, entities: number, links: number, hubs: number }) => void;
}

export interface GraphCanvasRef {
    zoomIn: () => void;
    zoomOut: () => void;
}

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
    reports, manualLinks, manualNodes, cases, aliases, hiddenNodeIds, flaggedNodeIds,
    filterCaseId, showSingletons, showHiddenNodes, showFlaggedOnly,
    isLinkingMode, linkSourceNode,
    onNodeClick, onSetLinkSource, onCreateManualLink, onStatsUpdate
}, ref) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const gRef = useRef<SVGGElement | null>(null);

    // D3 Refs
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const simulationRef = useRef<d3.Simulation<GraphNode, undefined> | null>(null);

    // State Ref to access latest props in D3 closures
    const stateRef = useRef({ isLinkingMode, linkSourceNode });
    useEffect(() => {
        stateRef.current = { isLinkingMode, linkSourceNode };
    }, [isLinkingMode, linkSourceNode]);

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
        }
    }));

    // --- D3 Simulation ---
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const normalizeId = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const resolveEntityName = (name: string): string => aliases[name] || name;

        // Filter reports by selected case
        const activeReports = filterCaseId === 'ALL' || !filterCaseId
            ? reports
            : reports.filter(r => r.caseId === filterCaseId);

        if (!filterCaseId) {
            // If no case selected/loaded, empty graph? original logic says empty if ''
            // But existing logic handles empty arrays fine.
        }

        const rawNodes = new Map<string, GraphNode>();
        const rawLinks: GraphLink[] = [];

        // Helper to get/create node
        const getOrCreateNode = (id: string, type: 'CASE' | 'ENTITY', label: string, reportData?: InvestigationReport, isManual: boolean = false, subtype?: 'PERSON' | 'ORGANIZATION' | 'UNKNOWN') => {
            if (hiddenNodeIds.has(id) && !showHiddenNodes) return null;
            if (!rawNodes.has(id)) {
                // If it's a Manual "CASE" node but has no report data
                let data = reportData;
                if (type === 'CASE' && isManual && !data) {
                    data = {
                        id: id,
                        caseId: id,
                        topic: label,
                        summary: "Manually created report node. Content pending investigation.",
                        dateStr: new Date().toISOString().split('T')[0],
                        status: 'COMPLETED',
                        entities: [],
                        leads: [],
                        sources: []
                    };
                }

                rawNodes.set(id, {
                    id, type, subtype, label, data: data, connections: 0, isManual,
                    x: width / 2 + (Math.random() - 0.5) * 50, y: height / 2 + (Math.random() - 0.5) * 50
                });
            }
            return rawNodes.get(id)!;
        };

        // Build Graph from Manual Nodes
        manualNodes.forEach(mn => getOrCreateNode(mn.id, mn.type, mn.label, undefined, true, mn.subtype));

        // Build Graph from Reports
        activeReports.forEach(report => {
            const caseId = `case-${report.id}`;
            const caseNode = getOrCreateNode(caseId, 'CASE', report.topic, report);
            if (!caseNode) return;

            if (report.parentTopic) {
                const parentReport = activeReports.find(r => r.topic === report.parentTopic);
                if (parentReport) {
                    const pId = `case-${parentReport.id}`;
                    if (!hiddenNodeIds.has(pId)) rawLinks.push({ source: pId, target: caseId, value: 3 });
                }
            }

            report.entities.forEach(e => {
                const name = typeof e === 'string' ? e : e.name;
                const type = typeof e === 'string' ? 'UNKNOWN' : e.type;
                const clean = cleanEntityName(name);
                if (!clean) return;
                const display = resolveEntityName(clean);
                const eId = `entity-${normalizeId(display)}`;
                const eNode = getOrCreateNode(eId, 'ENTITY', display, undefined, false, type);
                if (!eNode) return;

                if (type !== 'UNKNOWN' && eNode.subtype === 'UNKNOWN') eNode.subtype = type;

                const linkExists = rawLinks.some(l => (l.source === caseId && l.target === eId) || (l.source === eId && l.target === caseId));
                if (!linkExists) {
                    rawLinks.push({ source: caseId, target: eId, value: 1 });
                    caseNode.connections++;
                    eNode.connections++;
                }
            });
        });

        // Manual Links
        manualLinks.forEach(ml => {
            if (rawNodes.has(ml.source) && rawNodes.has(ml.target)) {
                if (!rawLinks.some(l => (l.source === ml.source && l.target === ml.target) || (l.source === ml.target && l.target === ml.source))) {
                    rawLinks.push({ source: ml.source, target: ml.target, value: 4, isManual: true });
                    rawNodes.get(ml.source)!.connections++;
                    rawNodes.get(ml.target)!.connections++;
                }
            }
        });

        let nodesArray = Array.from(rawNodes.values());
        let linksArray = [...rawLinks];

        // Filters (Singletons, Flagged)
        let nodesToKeep = new Set<string>();
        let filteredNodes = nodesArray;
        let filteredLinks = linksArray;

        if (showFlaggedOnly) {
            nodesArray.forEach(n => {
                if (flaggedNodeIds.has(n.id) || n.type === 'CASE') nodesToKeep.add(n.id);
            });
            filteredNodes = nodesArray.filter(n => nodesToKeep.has(n.id));
            filteredLinks = linksArray.filter(l => nodesToKeep.has(l.source as string) && nodesToKeep.has(l.target as string));
        } else if (!showSingletons) {
            nodesArray.forEach(n => {
                if (n.isManual || n.type === 'CASE' || n.connections > 1) nodesToKeep.add(n.id);
            });
            filteredNodes = nodesArray.filter(n => nodesToKeep.has(n.id));
            filteredLinks = linksArray.filter(l => nodesToKeep.has(l.source as string) && nodesToKeep.has(l.target as string));
        } else {
            filteredNodes = nodesArray;
            filteredLinks = linksArray;
        }

        // Update Stats to Parent
        onStatsUpdate({
            cases: activeReports.length,
            entities: filteredNodes.filter(n => n.type === 'ENTITY').length,
            links: filteredLinks.length,
            hubs: filteredNodes.filter(n => n.connections > 1).length
        });

        // D3 Rendering
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();
        const g = svg.append("g");
        gRef.current = g.node();

        const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.1, 4]).on("zoom", (e) => g.attr("transform", e.transform));
        svg.call(zoom);
        zoomRef.current = zoom;

        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(filteredLinks).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("x", d3.forceX(width / 2).strength(0.08))
            .force("y", d3.forceY(height / 2).strength(0.08))
            .force("collide", d3.forceCollide().radius(30).iterations(2));
        simulationRef.current = simulation;

        const link = g.append("g").selectAll("line").data(filteredLinks).join("line")
            .attr("stroke", (d: any) => d.isManual ? "#ffffff" : "#52525b")
            .attr("stroke-width", (d: any) => d.isManual ? 2 : 1)
            .attr("stroke-dasharray", (d: any) => d.isManual ? "0" : "2,2");

        const node = g.append("g").selectAll(".node").data(filteredNodes).join("g")
            .call(d3.drag<SVGGElement, GraphNode>().on("start", (e, d: any) => {
                if (!e.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            }).on("drag", (e, d: any) => { d.fx = e.x; d.fy = e.y; })
                .on("end", (e, d: any) => {
                    if (!e.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                }) as any)
            .on("click", (e, d) => {
                e.stopPropagation();

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

        node.append("circle")
            .attr("r", (d) => d.type === 'CASE' ? 20 : Math.min(6 + d.connections * 2, 20))
            .attr("fill", (d) => {
                if (linkSourceNode && d.id === linkSourceNode.id) return '#ef4444';
                return d.type === 'CASE' ? '#000' : (d.subtype === 'PERSON' ? '#0369a1' : (d.subtype === 'ORGANIZATION' ? '#7c3aed' : '#09090b'));
            })
            .attr("stroke", (d) => {
                if (linkSourceNode && d.id === linkSourceNode.id) return '#f87171';
                return d.type === 'CASE' ? '#fff' : (d.subtype === 'PERSON' ? '#38bdf8' : (d.subtype === 'ORGANIZATION' ? '#a78bfa' : '#52525b'));
            })
            .attr("stroke-width", (d) => (linkSourceNode && d.id === linkSourceNode.id) ? 3 : 1.5)
            .classed("animate-pulse", (d) => !!linkSourceNode && d.id === linkSourceNode.id);

        // Icons
        node.each(function (d) {
            const g = d3.select(this);
            let iconPath = "";
            if (d.type === 'CASE') {
                iconPath = "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8";
            } else if (d.subtype === 'PERSON') {
                iconPath = "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z";
            } else if (d.subtype === 'ORGANIZATION') {
                iconPath = "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4";
            } else {
                iconPath = "M12 22c5.523 0 10-5 10-10S17.523 2 12 2 2 6.5 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01";
            }

            g.append("path")
                .attr("d", iconPath)
                .attr("fill", "transparent")
                .attr("stroke", (d.type === 'CASE' || d.subtype === 'UNKNOWN') ? (d.type === 'CASE' ? '#000' : '#71717a') : (d.subtype === 'PERSON' ? '#0369a1' : '#7c3aed'))
                .attr("stroke-width", 2)
                .attr("stroke-linecap", "round")
                .attr("stroke-linejoin", "round")
                .attr("transform", "translate(-7, -7) scale(0.6)");

            g.selectAll("path").attr("stroke", d.type === 'CASE' ? (linkSourceNode && d.id === linkSourceNode.id ? '#f87171' : '#fff') : (d.subtype === 'UNKNOWN' ? '#a1a1aa' : (linkSourceNode && d.id === linkSourceNode.id ? '#fff' : 'rgba(255,255,255,0.8)')));
        });

        node.append("text").attr("dy", 30).attr("text-anchor", "middle").text(d => d.label.substring(0, 15))
            .attr("fill", "#a1a1aa").style("font-size", "10px").style("font-family", "monospace");

        simulation.on("tick", () => {
            link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
            node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        return () => { simulation.stop(); };
    }, [reports, manualLinks, cases, aliases, manualNodes, hiddenNodeIds, filterCaseId, showSingletons, showHiddenNodes, flaggedNodeIds, showFlaggedOnly]);

    return (
        <div ref={containerRef} className="flex-1 w-full h-full relative z-0 bg-black cursor-move">
            <svg ref={svgRef} className="w-full h-full" onClick={() => onNodeClick(null as any)} />
        </div>
    );
});

GraphCanvas.displayName = "GraphCanvas";
