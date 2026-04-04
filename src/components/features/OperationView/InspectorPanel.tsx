import React, { useState } from 'react';
import {
    User, Building2, Network, X, Star, Search, FileText, Newspaper, Globe, ExternalLink, MessageSquare, Shapes, Microscope
} from 'lucide-react';
import type { Entity, Headline, Artifact } from '../../../types';
import { EditableTitle } from '../../ui/EditableTitle';
import { Accordion } from '../../ui/Accordion';
import { InspectorActionRow, type InspectorActionItem } from '../../ui/InspectorActionRow';
import { getEntityToneClass } from '../../../utils/entityPalette';

interface InspectorPanelProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'ENTITY' | 'HEADLINE' | null;
    entity: Entity | null;
    headline: Headline | null;
    reports: Artifact[]; // For mentions/connections
    onEntitySave: (newName: string) => void;
    onFlagEntity: (entityName: string) => void;
    onInvestigateEntity: (entityName: string) => void;
    onInvestigateHeadline: () => void;
    onOpenEntityChat: (entityName: string) => void;
    onOpenHeadlineChat: () => void;
    onNavigate: (reportId: string) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
    isOpen,
    onClose,
    mode,
    entity,
    headline,
    reports,
    onEntitySave,
    onFlagEntity,
    onInvestigateEntity,
    onInvestigateHeadline,
    onOpenEntityChat,
    onOpenHeadlineChat,
    onNavigate
}) => {
    const entityToneClass = entity ? getEntityToneClass(entity.type) : getEntityToneClass('UNKNOWN');
    const entityActions: InspectorActionItem[] = entity
        ? [
              {
                  id: 'entity-chat',
                  label: 'Open In Chat',
                  icon: MessageSquare,
                  onClick: () => onOpenEntityChat(entity.name),
              },
              {
                  id: 'entity-investigate',
                  label: 'Investigate Entity',
                  icon: Microscope,
                  onClick: () => onInvestigateEntity(entity.name),
              },
              {
                  id: 'entity-google',
                  label: 'Search Google',
                  icon: Search,
                  href: `https://www.google.com/search?q=${encodeURIComponent(entity.name)}`,
                  target: '_blank',
                  rel: 'noopener noreferrer',
              },
              {
                  id: 'entity-flag',
                  label: 'Flag Entity',
                  icon: Star,
                  onClick: () => onFlagEntity(entity.name),
              },
          ]
        : [];
    // --- Internal State ---
    const [inspectorAccordions, setInspectorAccordions] = useState({
        mentions: false,
        connections: false
    });

    const toggleAccordion = (section: keyof typeof inspectorAccordions) => {
        setInspectorAccordions(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // --- Helper Logic (Moved from Parent) ---

    // Get Reports mentioning this entity
    const getEntityMentions = (entityName: string) => {
        const cleanName = entityName.trim().toLowerCase();
        return reports.filter(r =>
            (r.entities || []).some(e => {
                const name = typeof e === 'string' ? e : e.name;
                return name.trim().toLowerCase() === cleanName;
            })
        );
    };

    // Calculate connections based on co-occurrence in reports
    const getEntityConnections = (entityName: string) => {
        const cleanName = entityName.trim().toLowerCase();
        const connectedEntities = new Map<string, { entity: Entity, count: number }>();

        reports.forEach(r => {
            const hasEntity = (r.entities || []).some(e => {
                const name = typeof e === 'string' ? e : e.name;
                return name.trim().toLowerCase() === cleanName;
            });

            if (hasEntity) {
                (r.entities || []).forEach(e => {
                    const name = typeof e === 'string' ? e : e.name;
                    if (name.trim().toLowerCase() !== cleanName) {
                        const existing = connectedEntities.get(name) || { entity: typeof e === 'string' ? { name, type: 'UNKNOWN' } : e, count: 0 };
                        existing.count++;
                        connectedEntities.set(name, existing);
                    }
                });
            }
        });

        return Array.from(connectedEntities.values()).sort((a, b) => b.count - a.count);
    };

    return (
        <div className={`${isOpen ? 'translate-x-0' : 'translate-x-full lg:w-0 lg:translate-x-0'} fixed inset-y-0 right-0 z-30 w-96 lg:relative lg:z-0 lg:flex-shrink-0 transition-all duration-300 bg-black/95 backdrop-blur-md border-l border-zinc-800 overflow-hidden flex flex-col shadow-2xl lg:shadow-none ${isOpen ? 'lg:w-96' : 'lg:w-0'}`}>

            {/* --- ENTITY INSPECTOR MODE --- */}
            {mode === 'ENTITY' && entity && (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30 flex-shrink-0">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className={`p-2 border flex-shrink-0 ${entityToneClass} entity-tone-icon-panel`}>
                                {entity.type === 'PERSON' && <User className="w-5 h-5" />}
                                {entity.type === 'ORGANIZATION' && <Building2 className="w-5 h-5" />}
                                {entity.type === 'UNKNOWN' && <Network className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">{entity.type} ENTITY</span>
                                </div>
                                <EditableTitle
                                    value={entity.name}
                                    onSave={onEntitySave}
                                    className="text-base font-bold text-white leading-tight font-mono"
                                    inputClassName="text-lg font-bold leading-tight"
                                />
                            </div>
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="border-b border-zinc-800 bg-zinc-900/10 px-4 py-3">
                        <InspectorActionRow actions={entityActions} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24 custom-scrollbar">
                        {(entity.role || entity.sentiment) && (
                            <div className="bg-zinc-900/50 p-4 border border-zinc-800 space-y-3">
                                {entity.role && (
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Role</div>
                                        <div className="text-sm text-zinc-300">{entity.role}</div>
                                    </div>
                                )}
                                {entity.sentiment && (
                                    <div>
                                        <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Sentiment</div>
                                        <span className={`text-xs uppercase font-mono px-2 py-1 border ${entity.sentiment === 'NEGATIVE' ? 'border-osint-danger/40 osint-danger-text bg-osint-danger/10' : entity.sentiment === 'POSITIVE' ? 'border-green-500 text-green-500' : 'border-zinc-600 text-zinc-400'}`}>
                                            {entity.sentiment}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mentions Accordion */}
                        <Accordion
                            title="Report Mentions"
                            icon={FileText}
                            isOpen={inspectorAccordions.mentions}
                            onToggle={() => toggleAccordion('mentions')}
                        >
                            <div className="space-y-1">
                                {getEntityMentions(entity.name).length > 0 ? (
                                    getEntityMentions(entity.name).map(r => (
                                        <button key={r.id || r.topic} onClick={() => r.id && onNavigate(r.id)} className="w-full text-left p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white hover:border-osint-primary border-transparent border-l-2 transition-all flex items-center group">
                                            <FileText className="w-3 h-3 mr-2 text-zinc-600 group-hover:text-osint-primary" />
                                            <span className="truncate text-xs font-mono">{r.topic}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-zinc-600 text-xs font-mono p-2">No direct mentions found.</p>
                                )}
                            </div>
                        </Accordion>

                        {/* Connections Accordion */}
                        <Accordion
                            title="Network Connections"
                            icon={Network}
                            isOpen={inspectorAccordions.connections}
                            onToggle={() => toggleAccordion('connections')}
                        >
                            <div className="space-y-1">
                                {getEntityConnections(entity.name).length > 0 ? (
                                    getEntityConnections(entity.name).map((conn, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-zinc-900/20 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/40">
                                            <div className="flex items-center truncate max-w-[70%]">
                                                {conn.entity.type === 'PERSON'
                                                    ? <User className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`} />
                                                    : conn.entity.type === 'ORGANIZATION'
                                                        ? <Building2 className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`} />
                                                        : <Shapes className={`w-3 h-3 mr-2 ${getEntityToneClass(conn.entity.type)} entity-tone-text`} />}
                                                <span className="text-xs font-mono text-zinc-400 truncate" title={conn.entity.name}>{conn.entity.name}</span>
                                            </div>
                                            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-sm font-mono">{conn.count} Links</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-zinc-600 text-xs font-mono p-2">No connections established.</p>
                                )}
                            </div>
                        </Accordion>
                    </div>
                </div>
            )}

            {/* --- HEADLINE INSPECTOR MODE --- */}
            {mode === 'HEADLINE' && headline && (
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/30 flex-shrink-0">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="p-2 border flex-shrink-0 bg-zinc-800/50 text-white border-zinc-700">
                                <Newspaper className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">{headline.type} INTEL</span>
                                    <span className="text-[9px] bg-green-900/20 text-green-500 border border-green-900 px-1.5 py-0.5 font-mono">LIVE</span>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight font-mono truncate" title={headline.source}>{headline.source}</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="bg-zinc-900/50 p-6 border border-zinc-800 relative group">
                            <h4 className="text-[10px] text-zinc-500 font-mono uppercase mb-2">Captured Content</h4>
                            <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                                &quot;{headline.content}&quot;
                            </p>
                            <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-600 font-mono">
                                <span>TS: {headline.timestamp}</span>
                            </div>
                        </div>

                        {headline.url && (
                            <a href={headline.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-700 hover:border-osint-primary hover:bg-zinc-900 transition-all group">
                                <div className="flex items-center overflow-hidden">
                                    <Globe className="w-4 h-4 text-zinc-500 mr-3 group-hover:text-osint-primary" />
                                    <span className="text-xs font-mono text-zinc-400 group-hover:text-white truncate">{headline.url}</span>
                                </div>
                                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-white" />
                            </a>
                        )}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 mt-auto space-y-3">
                        <button
                            onClick={onOpenHeadlineChat}
                            className="w-full py-3 border border-zinc-700 text-zinc-300 hover:border-osint-primary hover:text-white transition-colors font-mono text-sm uppercase flex items-center justify-center"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Open In Chat
                        </button>
                        <button onClick={onInvestigateHeadline} className="osint-button-primary w-full py-3 font-bold font-mono text-sm uppercase flex items-center justify-center">
                            Launch Investigation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
