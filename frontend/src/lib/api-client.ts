import axios from 'axios';

// Environment variable for API URL (to be set later, default to localhost for dev)
const API_BASE_URL = import.meta.env.VITE_API_ABSE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Project {
  id: number;
  name: string;
  type: 'story' | 'animation' | 'short';
  resolution: { width: number; height: number };
  fps: number;
  lock_character: boolean;
  lock_style: boolean;
  lock_world: boolean;
  lock_key_object: boolean;
  updated_at: string;
  created_at: string;
  cover_url?: string; // Optional for UI display
}

export interface Version {
  id: number;
  shot_id: number;
  type: 'image' | 'video';
  url: string;
  thumb_url?: string;
  params: Record<string, any> | null;
  is_primary: boolean;
  created_at: string;
}

export interface Shot {
  id: number;
  scene_id: number;
  order: number;
  shot_type: string | null;
  camera_move: string | null;
  duration: number;
  composition: string | null;
  lens: string | null;
  story_desc: string | null;
  visual_desc: string | null;
  prompt: string;
  negative_prompt: string | null;
  asset_refs: any[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  updated_at: string;
  created_at: string;
}

export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'The Martian Chronicles',
    type: 'story',
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    lock_character: false,
    lock_style: false,
    lock_world: false,
    lock_key_object: false,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    cover_url: 'https://placehold.co/600x400/1a1a1a/FFF?text=Martian',
  },
  {
    id: 2,
    name: 'Cyberpunk Short',
    type: 'animation',
    resolution: { width: 1920, height: 1080 },
    fps: 24,
    lock_character: true,
    lock_style: true,
    lock_world: false,
    lock_key_object: false,
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    cover_url: 'https://placehold.co/600x400/2a2a2a/FFF?text=Cyberpunk',
  },
];

export const mockShots: Shot[] = [
  {
    id: 1,
    scene_id: 1,
    order: 1,
    shot_type: 'Close Up',
    camera_move: 'Static',
    duration: 5.0,
    composition: 'Rule of Thirds',
    lens: '35mm',
    story_desc: 'The beginning of the journey.',
    visual_desc: 'Red sand blowing in the wind.',
    prompt: "A vast Martian landscape with red sand dunes.",
    negative_prompt: null,
    asset_refs: [],
    status: 'completed',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    scene_id: 1,
    order: 2,
    shot_type: 'Wide Shot',
    camera_move: 'Pan Left',
    duration: 8.0,
    composition: 'Centered',
    lens: '24mm',
    story_desc: 'Astronaut explores.',
    visual_desc: 'Low angle shot of the astronaut.',
    prompt: "A astronaut walking on the surface of Mars.",
    negative_prompt: null,
    asset_refs: [],
    status: 'completed',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
];

export const mockVersions: Version[] = [
  {
    id: 1,
    shot_id: 1,
    type: 'image',
    url: 'https://placehold.co/600x400/8B0000/FFF?text=Martian+Landscape',
    params: {},
    is_primary: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    shot_id: 2,
    type: 'image',
    url: 'https://placehold.co/600x400/4B0082/FFF?text=Astronaut+on+Mars',
    params: {},
    is_primary: true,
    created_at: new Date().toISOString()
  }
];

// Helper to simulate API delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  getProjects: async (): Promise<Project[]> => {
    await delay(500);
    return mockProjects;
  },
  getProject: async (id: number): Promise<Project> => {
    await delay(300);
    const p = mockProjects.find(p => p.id === id);
    if (!p) throw new Error('Project not found');
    return p;
  },
  createProject: async (data: Partial<Project>): Promise<Project> => {
    await delay(800);
    return {
      id: Math.floor(Math.random() * 1000),
      name: data.name || 'Untitled',
      type: data.type || 'story',
      updated_at: new Date().toISOString(),
      cover_url: 'https://placehold.co/600x400/3a3a3a/FFF?text=New+Project',
    };
  },
  getShots: async (projectId: number): Promise<Shot[]> => {
    await delay(500);
    return mockShots;
  },
  createShot: async (shot: Partial<Shot>): Promise<Shot> => {
    await delay(500);
    const newShot: Shot = {
      id: Math.floor(Math.random() * 10000),
      scene_id: 1,
      order: mockShots.length + 1,
      shot_type: null,
      camera_move: null,
      duration: 5.0,
      composition: null,
      lens: null,
      story_desc: null,
      visual_desc: null,
      prompt: '',
      negative_prompt: null,
      asset_refs: [],
      status: 'pending',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...shot
    };
    mockShots.push(newShot);
    return newShot;
  },
  updateShot: async (id: number, updates: Partial<Shot>): Promise<Shot> => {
    await delay(300);
    const index = mockShots.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Shot not found');
    mockShots[index] = { ...mockShots[index], ...updates, updated_at: new Date().toISOString() };
    return mockShots[index];
  },
  getShotVersions: async (shotId: number): Promise<Version[]> => {
    await delay(300);
    return mockVersions.filter(v => v.shot_id === shotId);
  },
  generateVersion: async (shotId: number): Promise<Version> => {
    await delay(2000); // Simulate generation time
    const newVersion: Version = {
      id: Math.floor(Math.random() * 10000),
      shot_id: shotId,
      type: 'image',
      url: `https://placehold.co/600x400/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=Generated+v${Math.floor(Math.random() * 100)}`,
      params: {},
      is_primary: true,
      created_at: new Date().toISOString()
    };
    mockVersions.push(newVersion);
    // Mark previous versions as non-primary
    mockVersions.forEach(v => {
      if (v.shot_id === shotId && v.id !== newVersion.id) {
        v.is_primary = false;
      }
    });
    return newVersion;
  },
  deleteShot: async (id: number): Promise<void> => {
    await delay(500);
    const index = mockShots.findIndex(s => s.id === id);
    if (index !== -1) {
      mockShots.splice(index, 1);
    }
  },
  reorderShots: async (projectId: number, shotIds: number[]): Promise<void> => {
    await delay(300);
    // In a real app, we would update the order field for all shots based on the new array order
    mockShots.sort((a, b) => {
        const indexA = shotIds.indexOf(a.id);
        const indexB = shotIds.indexOf(b.id);
        return indexA - indexB;
    });
    // Update order property
    mockShots.forEach((shot, index) => {
        shot.order = index + 1;
    });
  }
};
