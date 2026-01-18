import { create } from 'zustand';
import { Shot } from '../../../lib/api-client';

interface StoryboardState {
    selectedShotId: number | null;
    shots: Shot[];
    setSelectedShotId: (id: number | null) => void;
    setShots: (shots: Shot[]) => void;
    addShot: (shot: Shot) => void;
    updateShot: (id: number, updates: Partial<Shot>) => void;
    deleteShot: (id: number) => void;
    reorderShots: (newShots: Shot[]) => void;
}

export const useStoryboardStore = create<StoryboardState>((set) => ({
    selectedShotId: null,
    shots: [],
    setSelectedShotId: (id) => set({ selectedShotId: id }),
    setShots: (shots) => set({ shots }),
    addShot: (shot) => set((state) => {
        // ✅ 防止添加重复的 shot（根据 ID 检查）
        const exists = state.shots.some(s => s.id === shot.id);
        if (exists) {
            console.warn(`Shot with id ${shot.id} already exists, skipping duplicate`);
            return state; // 不做任何更改
        }
        return { shots: [...state.shots, shot] };
    }),
    updateShot: (id, updates) => set((state) => ({
        shots: state.shots.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
    deleteShot: (id) => set((state) => ({
        shots: state.shots.filter((s) => s.id !== id),
        selectedShotId: state.selectedShotId === id ? null : state.selectedShotId
    })),
    reorderShots: (newShots) => set({ shots: newShots }),
}));
