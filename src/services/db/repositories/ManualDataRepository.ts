import { eq } from 'drizzle-orm';
import { getDB, runWriteTransaction, type SherlockWriteExecutor } from '../client';
import { manualNodes, manualLinks } from '../schema';
import type { ManualNode, ManualConnection } from '@/types';
import { buildWorkspaceLinkedGraphReferenceIds } from '../../maintenance/workspaceData';

export class ManualDataRepository {
  // --- NODES ---
  static async getAllNodes(): Promise<ManualNode[]> {
    const db = getDB();
    const rows = await db.select().from(manualNodes);
    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      type: row.type as 'CASE' | 'ENTITY',
      subtype: row.subtype as ManualNode['subtype'],
      timestamp: row.timestamp,
    }));
  }

  static async saveAllNodes(
    nodes: ManualNode[],
    db?: SherlockWriteExecutor
  ): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.saveAllNodes(nodes, tx));
      return;
    }

    await db.delete(manualNodes);
    if (nodes.length > 0) {
      for (const node of nodes) {
        await db.insert(manualNodes).values({
          id: node.id,
          label: node.label,
          type: node.type,
          subtype: node.subtype,
          timestamp: node.timestamp,
        });
      }
    }
  }

  static async addNode(node: ManualNode): Promise<void> {
    const db = getDB();
    await db.insert(manualNodes).values({
      id: node.id,
      label: node.label,
      type: node.type,
      subtype: node.subtype,
      timestamp: node.timestamp,
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
    return rows.map((row) => ({
      source: row.source,
      target: row.target,
      timestamp: row.timestamp,
    }));
  }

  static async saveAllLinks(
    links: ManualConnection[],
    db?: SherlockWriteExecutor
  ): Promise<void> {
    if (!db) {
      await runWriteTransaction(async (tx) => this.saveAllLinks(links, tx));
      return;
    }

    await db.delete(manualLinks);
    if (links.length > 0) {
      for (const link of links) {
        await db.insert(manualLinks).values({
          source: link.source,
          target: link.target,
          timestamp: link.timestamp,
        });
      }
    }
  }

  static async removeWorkspaceLinkedData(
    workspaceId: string,
    artifactIds: string[],
    db: SherlockWriteExecutor = getDB()
  ): Promise<void> {
    const removableIds = buildWorkspaceLinkedGraphReferenceIds(workspaceId, artifactIds);
    const [nodes, links] = await Promise.all([
      db.select().from(manualNodes),
      db.select().from(manualLinks),
    ]);
    const nextNodes = nodes.filter((node) => !removableIds.has(node.id));
    const nextLinks = links.filter(
      (link) => !removableIds.has(link.source) && !removableIds.has(link.target)
    );

    if (nextNodes.length !== nodes.length) {
      await this.saveAllNodes(
        nextNodes.map((node) => ({
          id: node.id,
          label: node.label,
          type: node.type as 'CASE' | 'ENTITY',
          subtype: node.subtype as ManualNode['subtype'],
          timestamp: node.timestamp,
        })),
        db
      );
    }
    if (nextLinks.length !== links.length) {
      await this.saveAllLinks(
        nextLinks.map((link) => ({
          source: link.source,
          target: link.target,
          timestamp: link.timestamp,
        })),
        db
      );
    }
  }

  static async clearAll(db: SherlockWriteExecutor = getDB()): Promise<void> {
    await db.delete(manualLinks);
    await db.delete(manualNodes);
  }
}
