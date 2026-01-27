import { eq } from 'drizzle-orm';
import { getDB } from '../client';
import { manualNodes, manualLinks } from '../schema';
import type { ManualNode, ManualConnection } from '@/types';

export class ManualDataRepository {
    // --- NODES ---
    static async getAllNodes(): Promise<ManualNode[]> {
        const db = getDB();
        const rows = await db.select().from(manualNodes);
        return rows.map(row => ({
            id: row.id,
            label: row.label,
            type: row.type as 'CASE' | 'ENTITY',
            subtype: row.subtype as 'PERSON' | 'ORGANIZATION' | undefined,
            timestamp: row.timestamp
        }));
    }

    static async saveAllNodes(nodes: ManualNode[]): Promise<void> {
        const db = getDB();
        await db.transaction(async (tx) => {
            await tx.delete(manualNodes);
            if (nodes.length > 0) {
                for (const node of nodes) {
                    await tx.insert(manualNodes).values({
                        id: node.id,
                        label: node.label,
                        type: node.type,
                        subtype: node.subtype,
                        timestamp: node.timestamp
                    });
                }
            }
        });
    }

    static async addNode(node: ManualNode): Promise<void> {
        const db = getDB();
        await db.insert(manualNodes).values({
            id: node.id,
            label: node.label,
            type: node.type,
            subtype: node.subtype,
            timestamp: node.timestamp
        });
    }

    static async removeNode(id: string): Promise<void> {
        const db = getDB();
        await db.delete(manualNodes).where(eq(manualNodes.id, id));
    }

    // --- LINKS ---
    static async getAllLinks(): Promise<ManualConnection[]> {
        const db = getDB();
        const rows = await db.select().from(manualLinks);
        return rows.map(row => ({
            source: row.source,
            target: row.target,
            timestamp: row.timestamp
        }));
    }

    static async saveAllLinks(links: ManualConnection[]): Promise<void> {
        const db = getDB();
        await db.transaction(async (tx) => {
            await tx.delete(manualLinks);
            if (links.length > 0) {
                for (const link of links) {
                    await tx.insert(manualLinks).values({
                        source: link.source,
                        target: link.target,
                        timestamp: link.timestamp
                    });
                }
            }
        });
    }
}
