import { create } from 'zustand';
import { Project } from '../../../lib/api-client';

interface ProjectState {
    currentProject: Project | null;
    setCurrentProject: (project: Project | null) => void;
    // Future: user settings, etc.
}

export const useProjectStore = create<ProjectState>((set) => ({
    currentProject: null,
    setCurrentProject: (project) => set({ currentProject: project }),
}));
