import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCaseStore } from './caseStore';
import type { InvestigationReport, CaseTemplate } from '../types';
import { AppView } from '../types';

describe('caseStore', () => {
    beforeEach(() => {
        // Reset store before each test
        const store = useCaseStore.getState();
        store.setArchives([]);
        store.setCases([]);
        store.setTasks([]);
        store.setCurrentView(AppView.DASHBOARD);
        store.setTemplates([]);
    });

    it('should initialize with default state', () => {
        const state = useCaseStore.getState();
        expect(state.archives).toEqual([]);
        expect(state.cases).toEqual([]);
        expect(state.currentView).toBe(AppView.DASHBOARD);
    });

    it('should add and delete templates', () => {
        const template: CaseTemplate = {
            id: 'tpl-1',
            name: 'Test Template',
            topic: 'Test Topic',
            config: { modelId: 'test-model' },
            createdAt: Date.now()
        };

        const { addTemplate, deleteTemplate } = useCaseStore.getState();

        addTemplate(template);
        expect(useCaseStore.getState().templates).toHaveLength(1);
        expect(useCaseStore.getState().templates[0].name).toBe('Test Template');

        deleteTemplate('tpl-1');
        expect(useCaseStore.getState().templates).toHaveLength(0);
    });

    it('should handle task lifecycle', () => {
        const { addTask, completeTask } = useCaseStore.getState();
        const taskId = 'task-1';

        addTask({
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

        completeTask(taskId, report);
        expect(useCaseStore.getState().tasks[0].status).toBe('COMPLETED');
        expect(useCaseStore.getState().tasks[0].report?.id).toBe('rep-1');
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
});
