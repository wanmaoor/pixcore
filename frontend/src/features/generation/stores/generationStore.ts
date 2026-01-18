import { create } from 'zustand';

export interface GenerationTask {
    id: string;
    type: 'text-to-image' | 'text-to-video' | 'image-to-video';
    status: 'queued' | 'running' | 'success' | 'failed';
    progress: number;
    shot_id: number;
    created_at: string;
    error?: string;
}

interface GenerationStoreState {
    queue: GenerationTask[];

    addTask: (task: GenerationTask) => void;
    updateTask: (id: string, updates: Partial<GenerationTask>) => void;
    removeTask: (id: string) => void;
    clearCompleted: () => void;
}

export const useGenerationStore = create<GenerationStoreState>((set) => ({
    queue: [],

    addTask: (task) => set((state) => ({ queue: [...state.queue, task] })),

    updateTask: (id, updates) => set((state) => ({
        queue: state.queue.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

    removeTask: (id) => set((state) => ({
        queue: state.queue.filter((t) => t.id !== id),
    })),

    clearCompleted: () => set((state) => ({
        queue: state.queue.filter((t) => t.status !== 'success' && t.status !== 'failed'),
    })),
}));
