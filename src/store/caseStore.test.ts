import { describe, it, expect, beforeEach } from 'vitest';
import { useCaseStore } from '../store/caseStore';
import { AppView } from '../types';

describe('Case Store', () => {
    beforeEach(() => {
        // Reset store state before each test if necessary
        // Since we use persist, we might need to clear it or handle it
        useCaseStore.setState({
            archives: [],
            cases: [],
            tasks: [],
            activeTaskId: null,
            toasts: [],
            currentView: AppView.DASHBOARD
        });
    });

    it('should initialize with default values', () => {
        const state = useCaseStore.getState();
        expect(state.currentView).toBe(AppView.DASHBOARD);
        expect(state.tasks).toHaveLength(0);
    });

    it('should add a task', () => {
        const { addTask } = useCaseStore.getState();
        const newTask = {
            id: 'test-task',
            topic: 'Test Topic',
            status: 'QUEUED' as const,
            startTime: Date.now()
        };

        addTask(newTask);

        expect(useCaseStore.getState().tasks).toHaveLength(1);
        expect(useCaseStore.getState().tasks[0].topic).toBe('Test Topic');
    });

    it('should add and remove toasts', () => {
        const { addToast, removeToast } = useCaseStore.getState();

        addToast('Test Message', 'SUCCESS');

        let state = useCaseStore.getState();
        expect(state.toasts).toHaveLength(1);
        expect(state.toasts[0].message).toBe('Test Message');

        const toastId = state.toasts[0].id;
        removeToast(toastId);

        expect(useCaseStore.getState().toasts).toHaveLength(0);
    });

    it('should archive a report and create a case if needed', () => {
        const { archiveReport } = useCaseStore.getState();
        const report = {
            topic: 'New Investigation',
            summary: 'Secret findings',
            agendas: [],
            leads: [],
            entities: [],
            sources: [],
            rawText: '{}'
        };

        const saved = archiveReport(report);

        const state = useCaseStore.getState();
        expect(state.archives).toHaveLength(1);
        expect(state.cases).toHaveLength(1);
        expect(state.cases[0].title).toContain('New Investigation');
        expect(saved.caseId).toBe(state.cases[0].id);
    });
});
