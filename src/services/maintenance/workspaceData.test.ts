import { describe, expect, it } from 'vitest';
import {
    buildWorkspaceDataBackup,
    filterManualGraphForWorkspaceRemoval,
    normalizeWorkspaceDataBackup,
} from './workspaceData';

describe('workspaceData maintenance helpers', () => {
    it('builds the canonical workspace-data backup payload without app settings', () => {
        const payload = buildWorkspaceDataBackup({
            workspaces: [{ id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' }],
            artifacts: [{ id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' }],
            runs: [{ id: 'run-1', topic: 'Alpha', status: 'COMPLETED', startTime: 1, workspaceId: 'case-1' }],
            chatSessions: [{ id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 1 }],
            chatMessagesBySessionId: {
                'chat-1': [{ id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'hello', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            chatActionsBySessionId: {
                'chat-1': [{ id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            headlines: [{ id: 'head-1', caseId: 'case-1', content: 'Signal', source: 'Desk', timestamp: '2026-04-03T00:00:00.000Z', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' }],
            manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
            manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
            templates: [{ id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 }],
            exportedAt: '2026-04-03T00:00:00.000Z',
        });

        expect(payload).toEqual({
            workspaces: [{ id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' }],
            artifacts: [{ id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' }],
            runs: [{ id: 'run-1', topic: 'Alpha', status: 'COMPLETED', startTime: 1, workspaceId: 'case-1' }],
            chat: {
                sessions: [{ id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 1 }],
                messages: [{ id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'hello', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
                actions: [{ id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            signals: {
                headlines: [{ id: 'head-1', caseId: 'case-1', content: 'Signal', source: 'Desk', timestamp: '2026-04-03T00:00:00.000Z', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' }],
            },
            graph: {
                manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
                manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
            },
            templates: [{ id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 }],
            metadata: {
                kind: 'SHERLOCK_WORKSPACE_DATA',
                formatVersion: 1,
                exportedAt: '2026-04-03T00:00:00.000Z',
            },
        });
        expect(payload).not.toHaveProperty('config');
    });

    it('normalizes legacy backups into the canonical workspace-data shape', () => {
        const payload = normalizeWorkspaceDataBackup({
            cases: [{ id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' }],
            archives: [{ id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' }],
            tasks: [{ id: 'run-1', topic: 'Alpha', status: 'COMPLETED', startTime: 1, report: { caseId: 'case-1' } }],
            chatSessions: [{ id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 1 }],
            chatMessagesBySessionId: {
                'chat-1': [{ id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'hello', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            chatActionsBySessionId: {
                'chat-1': [{ id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            headlines: [{ id: 'head-1', caseId: 'case-1', content: 'Signal', source: 'Desk', timestamp: '2026-04-03T00:00:00.000Z', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' }],
            templates: [{ id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 }],
            manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
            manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
            config: { theme: '#fff', quietMode: true },
            timestamp: '2026-04-03T00:00:00.000Z',
        });

        expect(payload.runs[0].workspaceId).toBe('case-1');
        expect(payload.chat.messages).toHaveLength(1);
        expect(payload.chat.actions).toHaveLength(1);
        expect(payload.metadata.exportedAt).toBe('2026-04-03T00:00:00.000Z');
        expect(payload).not.toHaveProperty('config');
    });

    it('normalizes workspace export JSON into the canonical workspace-data shape', () => {
        const payload = normalizeWorkspaceDataBackup({
            case: { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
            reports: [{ id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' }],
            exportedAt: '2026-04-03T00:00:00.000Z',
        });

        expect(payload.workspaces).toEqual([
            { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
        ]);
        expect(payload.artifacts).toEqual([
            { id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' },
        ]);
        expect(payload.runs).toEqual([]);
        expect(payload.chat.sessions).toEqual([]);
        expect(payload.metadata.exportedAt).toBe('2026-04-03T00:00:00.000Z');
    });

    it('filters workspace-linked graph references during purge cleanup', () => {
        const next = filterManualGraphForWorkspaceRemoval({
            workspaceId: 'case-1',
            artifactIds: ['rep-1'],
            manualNodes: [
                { id: 'case-rep-1', label: 'Artifact Node', type: 'CASE', timestamp: 1 },
                { id: 'manual-keep', label: 'Keep', type: 'ENTITY', timestamp: 2 },
            ],
            manualLinks: [
                { source: 'case-rep-1', target: 'manual-keep', timestamp: 1 },
                { source: 'manual-keep', target: 'external', timestamp: 2 },
            ],
            hiddenNodeIds: ['case-rep-1', 'manual-keep'],
            flaggedNodeIds: ['case-rep-1', 'manual-keep'],
        });

        expect(next.manualNodes).toEqual([{ id: 'manual-keep', label: 'Keep', type: 'ENTITY', timestamp: 2 }]);
        expect(next.manualLinks).toEqual([{ source: 'manual-keep', target: 'external', timestamp: 2 }]);
        expect(next.hiddenNodeIds).toEqual(['manual-keep']);
        expect(next.flaggedNodeIds).toEqual(['manual-keep']);
    });
});
