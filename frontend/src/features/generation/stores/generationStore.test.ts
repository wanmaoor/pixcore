import { describe, it, expect, beforeEach } from 'vitest';
import { useGenerationStore, GenerationTask } from './generationStore';

const mockTask: GenerationTask = {
    id: 'task-1',
    type: 'text-to-image',
    status: 'queued',
    progress: 0,
    shot_id: 1,
    created_at: new Date().toISOString(),
};

describe('Generation Store', () => {
    beforeEach(() => {
        useGenerationStore.setState({ queue: [] });
    });

    it('should add task', () => {
        useGenerationStore.getState().addTask(mockTask);
        const { queue } = useGenerationStore.getState();
        expect(queue).toHaveLength(1);
        expect(queue[0]).toEqual(mockTask);
    });

    it('should update task', () => {
        useGenerationStore.getState().addTask(mockTask);
        useGenerationStore.getState().updateTask('task-1', { status: 'running', progress: 50 });
        const { queue } = useGenerationStore.getState();
        expect(queue[0].status).toBe('running');
        expect(queue[0].progress).toBe(50);
    });

    it('should remove task', () => {
        useGenerationStore.getState().addTask(mockTask);
        useGenerationStore.getState().removeTask('task-1');
        const { queue } = useGenerationStore.getState();
        expect(queue).toHaveLength(0);
    });

    it('should clear completed tasks', () => {
        const completedTask = { ...mockTask, id: 'task-2', status: 'success' as const };
        const failedTask = { ...mockTask, id: 'task-3', status: 'failed' as const };

        useGenerationStore.getState().addTask(mockTask); // queued
        useGenerationStore.getState().addTask(completedTask);
        useGenerationStore.getState().addTask(failedTask);

        useGenerationStore.getState().clearCompleted();
        const { queue } = useGenerationStore.getState();

        expect(queue).toHaveLength(1);
        expect(queue[0].id).toBe('task-1');
    });
});
