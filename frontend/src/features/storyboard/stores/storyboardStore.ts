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
    addShot: (shot) => set((state) => ({ shots: [...state.shots, shot] })),
    updateShot: (id, updates) => set((state) => ({
        shots: state.shots.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
    deleteShot: (id) => set((state) => ({
        shots: state.shots.filter((s) => s.id !== id),
        selectedShotId: state.selectedShotId === id ? null : state.selectedShotId
    })),
    reorderShots: (newShots) => set({ shots: newShots }),
}));
