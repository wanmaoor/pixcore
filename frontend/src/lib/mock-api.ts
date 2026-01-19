import type {
  ConsistencySettings,
  ConsistencySettingsUpdate,
  PromptInjection,
  Project,
  Shot,
  Version,
} from './api-client';
import { mockProjects, mockShots, mockVersions } from './mock-data';

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  getProjects: async (): Promise<Project[]> => {
    await delay(500);
    return [...mockProjects];
  },
  getProject: async (id: number): Promise<Project> => {
    await delay(300);
    const project = mockProjects.find((item) => item.id === id);
    if (!project) throw new Error('Project not found');
    return { ...project };
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
    return [...mockShots];
  },
  createShot: async (shot: Partial<Shot>): Promise<Shot> => {
    await delay(500);

    // ✅ 使用时间戳 + 随机数生成唯一 ID，避免重复
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);

    const newShot: Shot = {
      id: uniqueId,
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
      ...shot,
    };

    // ✅ 检查是否已存在相同 ID，避免重复添加
    const exists = mockShots.some((item) => item.id === newShot.id);
    if (!exists) {
      mockShots.push(newShot);
    }

    return newShot;
  },
  updateShot: async (id: number, updates: Partial<Shot>): Promise<Shot> => {
    await delay(300);
    const index = mockShots.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Shot not found');
    mockShots[index] = { ...mockShots[index], ...updates, updated_at: new Date().toISOString() };
    return mockShots[index];
  },
  getShotVersions: async (shotId: number): Promise<Version[]> => {
    await delay(300);
    return [...mockVersions.filter((item) => item.shot_id === shotId)];
  },
  generateVersion: async (shotId: number): Promise<Version> => {
    await delay(2000); // Simulate generation time
    const newVersion: Version = {
      id: Math.floor(Math.random() * 10000),
      shot_id: shotId,
      type: 'image',
      url: `https://placehold.co/600x400/${Math.floor(Math.random() * 16777215).toString(16)}/FFF?text=Generated+v${Math.floor(Math.random() * 100)}`,
      params: {},
      is_primary: true,
      created_at: new Date().toISOString(),
    };
    mockVersions.push(newVersion);
    // Mark previous versions as non-primary
    mockVersions.forEach((item) => {
      if (item.shot_id === shotId && item.id !== newVersion.id) {
        item.is_primary = false;
      }
    });
    return newVersion;
  },
  deleteShot: async (id: number): Promise<void> => {
    await delay(500);
    const index = mockShots.findIndex((item) => item.id === id);
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
    mockShots.forEach((shotItem, index) => {
      shotItem.order = index + 1;
    });
  },

  // ============ Consistency Settings API ============

  getConsistencySettings: async (projectId: number): Promise<ConsistencySettings> => {
    await delay(300);
    const project = mockProjects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found');

    // Return mock consistency settings
    return {
      lock_character: project.lock_character,
      lock_style: project.lock_style,
      lock_world: project.lock_world,
      lock_key_object: project.lock_key_object,
      locked_characters: [],
      locked_styles: [],
      locked_worlds: [],
      locked_key_objects: [],
    };
  },

  updateConsistencySettings: async (
    projectId: number,
    updates: ConsistencySettingsUpdate
  ): Promise<ConsistencySettings> => {
    await delay(500);
    const project = mockProjects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found');

    // Update lock flags
    if (updates.lock_character !== undefined) {
      project.lock_character = updates.lock_character;
    }
    if (updates.lock_style !== undefined) {
      project.lock_style = updates.lock_style;
    }
    if (updates.lock_world !== undefined) {
      project.lock_world = updates.lock_world;
    }
    if (updates.lock_key_object !== undefined) {
      project.lock_key_object = updates.lock_key_object;
    }

    // Return updated settings
    return {
      lock_character: project.lock_character,
      lock_style: project.lock_style,
      lock_world: project.lock_world,
      lock_key_object: project.lock_key_object,
      locked_characters: [],
      locked_styles: [],
      locked_worlds: [],
      locked_key_objects: [],
    };
  },

  updateLockedAssets: async (
    projectId: number,
    lockType: 'character' | 'style' | 'world' | 'key_object',
    assetIds: number[]
  ): Promise<ConsistencySettings> => {
    await delay(300);
    // In real implementation, this would update the consistency_locks table
    console.log(`Updating ${lockType} locks for project ${projectId}:`, assetIds);

    const project = mockProjects.find((item) => item.id === projectId);
    if (!project) throw new Error('Project not found');

    return {
      lock_character: project.lock_character,
      lock_style: project.lock_style,
      lock_world: project.lock_world,
      lock_key_object: project.lock_key_object,
      locked_characters: [],
      locked_styles: [],
      locked_worlds: [],
      locked_key_objects: [],
    };
  },

  getPromptInjection: async (projectId: number): Promise<PromptInjection> => {
    await delay(200);
    // In real implementation, this returns the combined prompt injection text
    return {
      project_id: projectId,
      injection_text: '',
      has_injections: false,
      active_locks: {
        character: false,
        style: false,
        world: false,
        key_object: false,
      },
    };
  },

  updateProject: async (id: number, updates: Partial<Project>): Promise<Project> => {
    await delay(300);
    const index = mockProjects.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Project not found');
    mockProjects[index] = { ...mockProjects[index], ...updates, updated_at: new Date().toISOString() };
    return mockProjects[index];
  },
};
