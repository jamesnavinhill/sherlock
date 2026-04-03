import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCaseStore } from './caseStore';
import type { InvestigationReport, CaseTemplate, WorkspaceDataBackup } from '../types';
import { AppView } from '../types';
import { TemplateRepository } from '../services/db/repositories/TemplateRepository';
import { TaskRepository } from '../services/db/repositories/TaskRepository';
import { CaseRepository } from '../services/db/repositories/CaseRepository';
import { ChatRepository } from '../services/db/repositories/ChatRepository';
import { ManualDataRepository } from '../services/db/repositories/ManualDataRepository';
import { SettingsRepository } from '../services/db/repositories/SettingsRepository';

describe('caseStore', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(TemplateRepository, 'create').mockResolvedValue();
        vi.spyOn(TemplateRepository, 'delete').mockResolvedValue();
        vi.spyOn(TemplateRepository, 'clearAll').mockResolvedValue();
        vi.spyOn(TaskRepository, 'create').mockResolvedValue();
        vi.spyOn(TaskRepository, 'updateStatus').mockResolvedValue();
        vi.spyOn(TaskRepository, 'updateWorkspace').mockResolvedValue();
        vi.spyOn(TaskRepository, 'clearWorkspace').mockResolvedValue();
        vi.spyOn(TaskRepository, 'deleteByWorkspace').mockResolvedValue();
        vi.spyOn(CaseRepository, 'purgeCase').mockResolvedValue();
        vi.spyOn(CaseRepository, 'clearCaseData').mockResolvedValue();
        vi.spyOn(CaseRepository, 'createCase').mockResolvedValue();
        vi.spyOn(CaseRepository, 'createReport').mockResolvedValue();
        vi.spyOn(CaseRepository, 'createHeadline').mockResolvedValue();
        vi.spyOn(ChatRepository, 'createSession').mockResolvedValue();
        vi.spyOn(ChatRepository, 'updateSession').mockResolvedValue();
        vi.spyOn(ChatRepository, 'deleteSession').mockResolvedValue();
        vi.spyOn(ChatRepository, 'deleteSessionsForWorkspace').mockResolvedValue();
        vi.spyOn(ChatRepository, 'clearAll').mockResolvedValue();
        vi.spyOn(ChatRepository, 'createMessage').mockResolvedValue();
        vi.spyOn(ChatRepository, 'updateMessage').mockResolvedValue();
        vi.spyOn(ChatRepository, 'replaceAttachments').mockResolvedValue();
        vi.spyOn(ChatRepository, 'createAction').mockResolvedValue();
        vi.spyOn(ManualDataRepository, 'saveAllNodes').mockResolvedValue();
        vi.spyOn(ManualDataRepository, 'saveAllLinks').mockResolvedValue();
        vi.spyOn(ManualDataRepository, 'removeWorkspaceLinkedData').mockResolvedValue();
        vi.spyOn(ManualDataRepository, 'clearAll').mockResolvedValue();
        vi.spyOn(SettingsRepository, 'setSetting').mockResolvedValue();

        // Reset store before each test
        const store = useCaseStore.getState();
        store.setArchives([]);
        store.setCases([]);
        store.setTasks([]);
        store.setChatSessions([]);
        store.setChatMessagesBySessionId({});
        useCaseStore.setState({
            chatActionsBySessionId: {},
            headlines: [],
            manualNodes: [],
            manualLinks: [],
            hiddenNodeIds: [],
            flaggedNodeIds: [],
            activeCaseId: null,
            activeTaskId: null,
            activeChatSessionId: null,
        });
        store.setCurrentView(AppView.DASHBOARD);
        store.setTemplates([]);
    });

    it('should initialize with default state', () => {
        const state = useCaseStore.getState();
        expect(state.archives).toEqual([]);
        expect(state.cases).toEqual([]);
        expect(state.currentView).toBe(AppView.DASHBOARD);
    });

    it('should add and delete templates', async () => {
        const template: CaseTemplate = {
            id: 'tpl-1',
            name: 'Test Template',
            topic: 'Test Topic',
            config: { modelId: 'test-model' },
            createdAt: Date.now()
        };

        const { addTemplate, deleteTemplate } = useCaseStore.getState();

        await addTemplate(template);
        expect(useCaseStore.getState().templates).toHaveLength(1);
        expect(useCaseStore.getState().templates[0].name).toBe('Test Template');

        await deleteTemplate('tpl-1');
        expect(useCaseStore.getState().templates).toHaveLength(0);
    });

    it('should handle task lifecycle', async () => {
        const { addTask, completeTask } = useCaseStore.getState();
        const taskId = 'task-1';

        await addTask({
            id: taskId,
            topic: 'Lifecycle test',
            status: 'RUNNING',
            startTime: Date.now()
        });

        expect(useCaseStore.getState().tasks).toHaveLength(1);
        expect(useCaseStore.getState().tasks[0].status).toBe('RUNNING');

        const report: InvestigationReport = {
            id: 'rep-1',
            topic: 'Lifecycle test',
            summary: 'Success',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: 'Test content'
        };

        await completeTask(taskId, report);
        expect(useCaseStore.getState().tasks[0].status).toBe('COMPLETED');
        expect(useCaseStore.getState().tasks[0].report?.id).toBe('rep-1');
    });

    it('should create and update chat sessions and messages', async () => {
        const store = useCaseStore.getState();
        store.setCases([
            { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
        ]);

        const session = await store.createChatSession({ workspaceId: 'case-1', title: 'Alpha Chat' });
        expect(useCaseStore.getState().chatSessions).toHaveLength(1);
        expect(session.title).toBe('Alpha Chat');

        await store.renameChatSession(session.id, 'Renamed Alpha Chat');
        expect(useCaseStore.getState().chatSessions[0].title).toBe('Renamed Alpha Chat');

        await store.addChatMessage({
            id: 'msg-1',
            sessionId: session.id,
            role: 'user',
            content: 'Hello workspace',
            status: 'COMPLETED',
            createdAt: 1,
            updatedAt: 1,
        });
        expect(useCaseStore.getState().chatMessagesBySessionId[session.id]).toHaveLength(1);

        await store.updateChatMessage('msg-1', session.id, {
            content: 'Updated workspace message',
            status: 'COMPLETED',
            updatedAt: 2,
        });
        expect(useCaseStore.getState().chatMessagesBySessionId[session.id][0].content).toBe('Updated workspace message');
    });

    it('should add toasts and remove them', () => {
        vi.useFakeTimers();
        const { addToast } = useCaseStore.getState();

        addToast('Test message', 'SUCCESS');
        expect(useCaseStore.getState().toasts).toHaveLength(1);
        expect(useCaseStore.getState().toasts[0].message).toBe('Test message');

        // Should auto-remove after 5s
        vi.advanceTimersByTime(5001);
        expect(useCaseStore.getState().toasts).toHaveLength(0);
        vi.useRealTimers();
    });

    it('should purge a case and remove related local state', async () => {
        const store = useCaseStore.getState();
        store.setCases([
            { id: 'case-1', title: 'Operation: Alpha', status: 'ACTIVE', dateOpened: '2026-02-07' },
            { id: 'case-2', title: 'Operation: Bravo', status: 'ACTIVE', dateOpened: '2026-02-07' },
        ]);
        store.setArchives([
            { id: 'rep-1', caseId: 'case-1', topic: 'A1', summary: '', agendas: [], leads: [], entities: [], sources: [], rawText: '' },
            { id: 'rep-2', caseId: 'case-2', topic: 'B1', summary: '', agendas: [], leads: [], entities: [], sources: [], rawText: '' },
            { id: 'rep-3', topic: 'Loose', summary: '', agendas: [], leads: [], entities: [], sources: [], rawText: '' },
        ]);
        store.setHeadlines([
            { id: 'h-1', caseId: 'case-1', content: 'alpha', source: 'src', timestamp: 'now', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' },
            { id: 'h-2', caseId: 'case-2', content: 'bravo', source: 'src', timestamp: 'now', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' },
        ]);
        store.setActiveCaseId('case-1');
        store.setChatSessions([
            { id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 1 },
            { id: 'chat-2', workspaceId: 'case-2', title: 'Bravo Chat', status: 'ACTIVE', createdAt: 2, updatedAt: 2 },
        ]);
        store.setChatMessagesBySessionId({
            'chat-1': [{ id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'alpha', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            'chat-2': [{ id: 'msg-2', sessionId: 'chat-2', role: 'user', content: 'bravo', status: 'COMPLETED', createdAt: 2, updatedAt: 2 }],
        });
        useCaseStore.setState({
            chatActionsBySessionId: {
                'chat-1': [{ id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
                'chat-2': [{ id: 'act-2', sessionId: 'chat-2', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 2, updatedAt: 2 }],
            },
            manualNodes: [
                { id: 'case-rep-1', label: 'Alpha Artifact', type: 'CASE', timestamp: 1 },
                { id: 'manual-keep', label: 'Keep Me', type: 'ENTITY', timestamp: 2 },
            ],
            manualLinks: [
                { source: 'case-rep-1', target: 'manual-keep', timestamp: 1 },
                { source: 'manual-keep', target: 'external', timestamp: 2 },
            ],
            hiddenNodeIds: ['case-rep-1', 'manual-keep'],
            flaggedNodeIds: ['case-rep-1', 'manual-keep'],
            activeChatSessionId: 'chat-1',
        });

        await store.purgeCase('case-1');

        expect(CaseRepository.purgeCase).toHaveBeenCalledWith('case-1');
        expect(useCaseStore.getState().cases.map((c) => c.id)).toEqual(['case-2']);
        expect(useCaseStore.getState().archives.map((r) => r.id)).toEqual(['rep-2', 'rep-3']);
        expect(useCaseStore.getState().headlines.map((h) => h.id)).toEqual(['h-2']);
        expect(useCaseStore.getState().chatSessions.map((session) => session.id)).toEqual(['chat-2']);
        expect(Object.keys(useCaseStore.getState().chatMessagesBySessionId)).toEqual(['chat-2']);
        expect(Object.keys(useCaseStore.getState().chatActionsBySessionId)).toEqual(['chat-2']);
        expect(useCaseStore.getState().manualNodes.map((node) => node.id)).toEqual(['manual-keep']);
        expect(useCaseStore.getState().manualLinks).toEqual([{ source: 'manual-keep', target: 'external', timestamp: 2 }]);
        expect(useCaseStore.getState().hiddenNodeIds).toEqual(['manual-keep']);
        expect(useCaseStore.getState().flaggedNodeIds).toEqual(['manual-keep']);
        expect(useCaseStore.getState().activeChatSessionId).toBeNull();
        expect(useCaseStore.getState().activeCaseId).toBeNull();
    });

    it('should import workspace data using the canonical backup payload', async () => {
        const store = useCaseStore.getState();
        const payload: WorkspaceDataBackup = {
            workspaces: [
                { id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' },
            ],
            artifacts: [
                { id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: 'Summary', agendas: [], leads: [], entities: [], sources: [], rawText: 'raw' },
            ],
            runs: [
                { id: 'run-1', topic: 'Alpha', status: 'COMPLETED', startTime: 1, endTime: 2, workspaceId: 'case-1' },
            ],
            chat: {
                sessions: [
                    { id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 2 },
                ],
                messages: [
                    { id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'hello', status: 'COMPLETED', createdAt: 1, updatedAt: 1 },
                ],
                actions: [
                    { id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 },
                ],
            },
            signals: {
                headlines: [
                    { id: 'head-1', caseId: 'case-1', content: 'Signal', source: 'Desk', timestamp: '2026-04-03T00:00:00.000Z', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' },
                ],
            },
            graph: {
                manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
                manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
            },
            templates: [
                { id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 },
            ],
            metadata: {
                kind: 'SHERLOCK_WORKSPACE_DATA',
                formatVersion: 1,
                exportedAt: '2026-04-03T00:00:00.000Z',
            },
        };

        await store.importWorkspaceData(payload);

        expect(CaseRepository.clearCaseData).toHaveBeenCalled();
        expect(CaseRepository.createCase).toHaveBeenCalledWith(payload.workspaces[0]);
        expect(CaseRepository.createReport).toHaveBeenCalledWith(payload.artifacts[0]);
        expect(TaskRepository.create).toHaveBeenCalledWith(payload.runs[0]);
        expect(ChatRepository.createSession).toHaveBeenCalledWith(payload.chat.sessions[0]);
        expect(ChatRepository.createMessage).toHaveBeenCalledWith(payload.chat.messages[0]);
        expect(ChatRepository.createAction).toHaveBeenCalledWith(payload.chat.actions[0]);
        expect(ManualDataRepository.saveAllNodes).toHaveBeenCalledWith(payload.graph.manualNodes);
        expect(ManualDataRepository.saveAllLinks).toHaveBeenCalledWith(payload.graph.manualLinks);
        expect(useCaseStore.getState().cases).toEqual(payload.workspaces);
        expect(useCaseStore.getState().archives).toEqual(payload.artifacts);
        expect(useCaseStore.getState().tasks).toEqual(payload.runs);
        expect(useCaseStore.getState().chatSessions).toEqual(payload.chat.sessions);
        expect(useCaseStore.getState().chatMessagesBySessionId).toEqual({ 'chat-1': payload.chat.messages });
        expect(useCaseStore.getState().chatActionsBySessionId).toEqual({ 'chat-1': payload.chat.actions });
        expect(useCaseStore.getState().hiddenNodeIds).toEqual([]);
        expect(useCaseStore.getState().flaggedNodeIds).toEqual([]);
    });

    it('should clear workspace data without touching app-level store config', async () => {
        const store = useCaseStore.getState();
        store.setCases([{ id: 'case-1', title: 'Workspace Alpha', status: 'ACTIVE', dateOpened: '2026-04-03' }]);
        store.setArchives([{ id: 'rep-1', caseId: 'case-1', topic: 'Alpha', summary: '', agendas: [], leads: [], entities: [], sources: [], rawText: '' }]);
        store.setTasks([{ id: 'run-1', topic: 'Alpha', status: 'RUNNING', startTime: 1 }]);
        store.setChatSessions([{ id: 'chat-1', workspaceId: 'case-1', title: 'Alpha Chat', status: 'ACTIVE', createdAt: 1, updatedAt: 1 }]);
        store.setChatMessagesBySessionId({
            'chat-1': [{ id: 'msg-1', sessionId: 'chat-1', role: 'user', content: 'alpha', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
        });
        store.setHeadlines([{ id: 'head-1', caseId: 'case-1', content: 'Signal', source: 'Desk', timestamp: '2026-04-03T00:00:00.000Z', type: 'NEWS', status: 'PENDING', threatLevel: 'INFO' }]);
        store.setTemplates([{ id: 'tpl-1', name: 'Template', topic: 'Topic', config: { modelId: 'x' }, createdAt: 1 }]);
        useCaseStore.setState({
            chatActionsBySessionId: {
                'chat-1': [{ id: 'act-1', sessionId: 'chat-1', type: 'SEARCH_WORKSPACE', status: 'COMPLETED', createdAt: 1, updatedAt: 1 }],
            },
            manualNodes: [{ id: 'manual-1', label: 'Entity', type: 'ENTITY', timestamp: 1 }],
            manualLinks: [{ source: 'manual-1', target: 'external', timestamp: 2 }],
            hiddenNodeIds: ['manual-1'],
            flaggedNodeIds: ['manual-1'],
            activeCaseId: 'case-1',
            activeTaskId: 'run-1',
            activeChatSessionId: 'chat-1',
        });

        await store.clearWorkspaceData();

        expect(CaseRepository.clearCaseData).toHaveBeenCalled();
        expect(useCaseStore.getState().cases).toEqual([]);
        expect(useCaseStore.getState().archives).toEqual([]);
        expect(useCaseStore.getState().tasks).toEqual([]);
        expect(useCaseStore.getState().chatSessions).toEqual([]);
        expect(useCaseStore.getState().chatMessagesBySessionId).toEqual({});
        expect(useCaseStore.getState().chatActionsBySessionId).toEqual({});
        expect(useCaseStore.getState().templates).toEqual([]);
        expect(useCaseStore.getState().manualNodes).toEqual([]);
        expect(useCaseStore.getState().manualLinks).toEqual([]);
        expect(useCaseStore.getState().hiddenNodeIds).toEqual([]);
        expect(useCaseStore.getState().flaggedNodeIds).toEqual([]);
        expect(useCaseStore.getState().activeCaseId).toBeNull();
        expect(useCaseStore.getState().activeTaskId).toBeNull();
        expect(useCaseStore.getState().activeChatSessionId).toBeNull();
    });
});
