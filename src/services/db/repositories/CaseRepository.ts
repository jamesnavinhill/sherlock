import { eq, desc } from 'drizzle-orm';
import { getDB } from '../client';
import { cases, reports, entities, sources, leads } from '../schema';
import type { Case, InvestigationReport, Entity, Headline } from '@/types';

interface RawReportPayload {
    summary?: string;
    entities?: unknown;
    sources?: unknown;
    agendas?: unknown;
    leads?: unknown;
}

const parseRawReportPayload = (rawText: string | null): RawReportPayload => {
    if (!rawText) return {};
    try {
        const parsed = JSON.parse(rawText) as RawReportPayload;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const toEntityList = (value: unknown): Entity[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item): Entity | null => {
            if (typeof item === 'string') {
                return { name: item, type: 'UNKNOWN' };
            }
            if (!item || typeof item !== 'object') return null;
            const entity = item as Partial<Entity>;
            if (!entity.name || typeof entity.name !== 'string') return null;
            return {
                name: entity.name,
                type: entity.type === 'PERSON' || entity.type === 'ORGANIZATION' ? entity.type : 'UNKNOWN',
                role: typeof entity.role === 'string' ? entity.role : undefined,
                sentiment: entity.sentiment === 'POSITIVE' || entity.sentiment === 'NEGATIVE' || entity.sentiment === 'NEUTRAL'
                    ? entity.sentiment
                    : undefined
            };
        })
        .filter((item): item is Entity => !!item);
};

const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const toSourceList = (value: unknown): InvestigationReport['sources'] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((item): { title: string; url: string } | null => {
            if (!item || typeof item !== 'object') return null;
            const source = item as { title?: unknown; url?: unknown; uri?: unknown };
            const title = typeof source.title === 'string' && source.title.trim().length > 0 ? source.title.trim() : 'Untitled Source';
            const rawUrl = typeof source.url === 'string' ? source.url : (typeof source.uri === 'string' ? source.uri : '');
            if (!rawUrl) return null;
            return { title, url: rawUrl };
        })
        .filter((item): item is { title: string; url: string } => !!item);
};

export class CaseRepository {
    // --- CASES ---
    static async getAllCases(): Promise<Case[]> {
        const db = getDB();
        const rows = await db.select().from(cases).orderBy(desc(cases.updatedAt));

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            status: row.status as 'ACTIVE' | 'CLOSED',
            dateOpened: row.dateOpened,
            description: row.description || undefined,
        }));
    }

    static async getCaseById(id: string): Promise<Case | null> {
        const db = getDB();
        const result = await db.select().from(cases).where(eq(cases.id, id));

        if (result.length === 0) return null;

        return {
            id: result[0].id,
            title: result[0].title,
            status: result[0].status as 'ACTIVE' | 'CLOSED',
            dateOpened: result[0].dateOpened,
            description: result[0].description || undefined,
        };
    }

    static async createCase(caseData: Case): Promise<void> {
        const db = getDB();
        const now = Date.now();
        await db.insert(cases).values({
            id: caseData.id,
            title: caseData.title,
            status: caseData.status,
            dateOpened: caseData.dateOpened,
            description: caseData.description,
            createdAt: now,
            updatedAt: now
        });
    }

    // --- REPORTS ---
    static async getAllReports(): Promise<InvestigationReport[]> {
        const db = getDB();
        // Join reports with entities and sources would be ideal, but for now we fetch reports and hydrate
        // Drizzle's with query is powerful for this if relationships are defined, but here we'll keep it simple for now

        // Fetch all reports
        const reportRows = await db.select().from(reports).orderBy(desc(reports.createdAt));

        // This N+1 query pattern is inefficient for large datasets, but okay for MVP client-side DB 
        // Optimization: Use separate queries to fetch all entities/sources and map them in memory
        const allEntities = await db.select().from(entities);
        const allSources = await db.select().from(sources);

        return reportRows.map(row => {
            const rawPayload = parseRawReportPayload(row.rawText);

            const reportEntities = allEntities.filter(e => e.reportId === row.id).map(e => ({
                name: e.name,
                type: e.type as Entity['type'],
                role: e.role || undefined,
                sentiment: e.sentiment as Entity['sentiment']
            }));
            const parsedEntities = toEntityList(rawPayload.entities);

            const reportSources = allSources.filter(s => s.reportId === row.id).map(s => ({
                title: s.title,
                url: s.url
            }));
            const parsedSources = toSourceList(rawPayload.sources);
            const parsedAgendas = toStringList(rawPayload.agendas);
            const parsedLeads = toStringList(rawPayload.leads);

            return {
                id: row.id,
                caseId: row.caseId || undefined,
                topic: row.topic,
                dateStr: row.dateStr || undefined,
                summary: row.summary || '',
                rawText: row.rawText || '',
                parentTopic: row.parentTopic || undefined,
                config: row.configJson ? JSON.parse(row.configJson) : undefined,
                entities: reportEntities.length > 0 ? reportEntities : parsedEntities,
                sources: reportSources.length > 0 ? reportSources : parsedSources,
                agendas: parsedAgendas,
                leads: parsedLeads
            };
        });
    }

    static async createReport(report: InvestigationReport): Promise<void> {
        const db = getDB();
        const now = Date.now();
        if (!report.id) {
            throw new Error('Report must have an id before persistence.');
        }
        const reportId = report.id;

        // Insert Report (wa-sqlite handles its own transactions, explicit drizzle transactions conflict)
        await db.insert(reports).values({
            id: reportId,
            caseId: report.caseId,
            topic: report.topic,
            dateStr: report.dateStr,
            summary: report.summary,
            rawText: report.rawText,
            parentTopic: report.parentTopic,
            configJson: report.config ? JSON.stringify(report.config) : null,
            createdAt: now
        });

        // Insert Entities
        if (report.entities && report.entities.length > 0) {
            for (const entity of report.entities) {
                const entityObj = typeof entity === 'string'
                    ? { name: entity, type: 'UNKNOWN' as const }
                    : entity;

                await db.insert(entities).values({
                    id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    reportId,
                    name: entityObj.name,
                    type: entityObj.type,
                    role: entityObj.role,
                    sentiment: entityObj.sentiment
                });
            }
        }

        // Insert Sources
        if (report.sources && report.sources.length > 0) {
            for (const source of report.sources) {
                await db.insert(sources).values({
                    id: `src-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    reportId,
                    title: source.title,
                    url: source.url
                });
            }
        }


        // Update parent case timestamp
        if (report.caseId) {
            await db.update(cases)
                .set({ updatedAt: now })
                .where(eq(cases.id, report.caseId));
        }
    }

    // --- LEADS ---
    static async getHeadlines(): Promise<Headline[]> {
        const db = getDB();
        const rows = await db.select().from(leads);

        return rows.map(row => ({
            id: row.id,
            caseId: row.caseId || '',
            content: row.content,
            source: row.source || '',
            timestamp: row.timestamp || new Date().toISOString(),
            type: 'NEWS' as const, // Default for now
            status: row.status as Headline['status'],
            threatLevel: (row.threatLevel as Headline['threatLevel']) || 'INFO',
            linkedReportId: row.linkedReportId || undefined
        }));
    }
}
