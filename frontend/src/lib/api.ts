/**
 * Real API service layer - connects to backend API
 */

import { apiClient } from './api-client';
import type {
  Project,
  Shot,
  Version,
  ConsistencySettings,
  ConsistencySettingsUpdate,
  PromptInjection,
} from './api-client';

// ============ Types ============

export interface Scene {
  id: number;
  project_id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: number;
  project_id: number;
  type: 'character' | 'scene' | 'style' | 'key_object';
  name: string;
  description: string | null;
  reference_images: string[];
  meta: Record<string, any> | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetReferences {
  asset_id: number;
  references: Array<{
    shot_id: number;
    scene_id: number;
    shot_order: number;
  }>;
  can_delete: boolean;
}

export interface GenerationTask {
  task_id: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  message: string;
  result_url?: string;
}

export interface TaskEstimate {
  estimated_time: number;
  estimated_cost: number;
}

// ============ Project API ============

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects/');
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    type?: 'story' | 'animation' | 'short';
    resolution?: { width: number; height: number };
    fps?: number;
  }): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};

// ============ Scene API ============

export const sceneApi = {
  getByProject: async (projectId: number): Promise<Scene[]> => {
    const response = await apiClient.get<Scene[]>(`/projects/${projectId}/scenes`);
    return response.data;
  },

  getById: async (id: number): Promise<Scene> => {
    const response = await apiClient.get<Scene>(`/scenes/${id}`);
    return response.data;
  },

  create: async (projectId: number, data: { name: string }): Promise<Scene> => {
    const response = await apiClient.post<Scene>(`/projects/${projectId}/scenes`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Scene>): Promise<Scene> => {
    const response = await apiClient.put<Scene>(`/scenes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/scenes/${id}`);
  },
};

// ============ Shot API ============

export const shotApi = {
  getByScene: async (sceneId: number): Promise<Shot[]> => {
    const response = await apiClient.get<Shot[]>(`/scenes/${sceneId}/shots`);
    return response.data;
  },

  getByProject: async (projectId: number): Promise<Shot[]> => {
    const response = await apiClient.get<Shot[]>(`/projects/${projectId}/shots`);
    return response.data;
  },

  getById: async (id: number): Promise<Shot> => {
    const response = await apiClient.get<Shot>(`/shots/${id}`);
    return response.data;
  },

  create: async (sceneId: number, data: Partial<Shot>): Promise<Shot> => {
    const response = await apiClient.post<Shot>(`/scenes/${sceneId}/shots`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Shot>): Promise<Shot> => {
    const response = await apiClient.put<Shot>(`/shots/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/shots/${id}`);
  },

  reorder: async (projectId: number, shotIds: number[]): Promise<void> => {
    await apiClient.put(`/projects/${projectId}/shots/reorder`, { shot_ids: shotIds });
  },
};

// ============ Version API ============

export const versionApi = {
  getByShot: async (shotId: number): Promise<Version[]> => {
    const response = await apiClient.get<Version[]>(`/shots/${shotId}/versions`);
    return response.data;
  },

  getById: async (id: number): Promise<Version> => {
    const response = await apiClient.get<Version>(`/versions/${id}`);
    return response.data;
  },

  setPrimary: async (id: number): Promise<Version> => {
    const response = await apiClient.post<Version>(`/versions/${id}/set-primary`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/versions/${id}`);
  },
};

// ============ Asset API ============

export const assetApi = {
  getByProject: async (projectId: number, includeArchived = false): Promise<Asset[]> => {
    const response = await apiClient.get<Asset[]>(`/projects/${projectId}/assets`, {
      params: { include_archived: includeArchived },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Asset> => {
    const response = await apiClient.get<Asset>(`/assets/${id}`);
    return response.data;
  },

  create: async (projectId: number, data: {
    name: string;
    type: Asset['type'];
    description?: string;
    reference_images?: string[];
  }): Promise<Asset> => {
    const response = await apiClient.post<Asset>(`/projects/${projectId}/assets`, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Asset>): Promise<Asset> => {
    const response = await apiClient.put<Asset>(`/assets/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/assets/${id}`);
  },

  getReferences: async (id: number): Promise<AssetReferences> => {
    const response = await apiClient.get<AssetReferences>(`/assets/${id}/references`);
    return response.data;
  },
};

// ============ Consistency API ============

export const consistencyApi = {
  getSettings: async (projectId: number): Promise<ConsistencySettings> => {
    const response = await apiClient.get<ConsistencySettings>(
      `/projects/${projectId}/consistency`
    );
    return response.data;
  },

  updateSettings: async (
    projectId: number,
    data: ConsistencySettingsUpdate
  ): Promise<ConsistencySettings> => {
    const response = await apiClient.put<ConsistencySettings>(
      `/projects/${projectId}/consistency`,
      data
    );
    return response.data;
  },

  getPromptInjection: async (projectId: number): Promise<PromptInjection> => {
    const response = await apiClient.get<PromptInjection>(
      `/projects/${projectId}/consistency/prompt-injection`
    );
    return response.data;
  },
};

// ============ Generation API ============

export const generationApi = {
  textToImage: async (data: {
    shot_id: number;
    prompt: string;
    negative_prompt?: string;
    model?: string;
    params?: Record<string, any>;
  }): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await apiClient.post('/generation/text-to-image', data);
    return response.data;
  },

  textToVideo: async (data: {
    shot_id: number;
    prompt: string;
    negative_prompt?: string;
    model?: string;
    params?: Record<string, any>;
  }): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await apiClient.post('/generation/text-to-video', data);
    return response.data;
  },

  imageToVideo: async (data: {
    shot_id: number;
    image_url: string;
    prompt?: string;
    model?: string;
    params?: Record<string, any>;
  }): Promise<{ task_id: string; status: string; message: string }> => {
    const response = await apiClient.post('/generation/image-to-video', data);
    return response.data;
  },

  getTaskStatus: async (taskId: string): Promise<GenerationTask> => {
    const response = await apiClient.get<GenerationTask>(`/generation/tasks/${taskId}`);
    return response.data;
  },

  estimate: async (params: Record<string, any>): Promise<TaskEstimate> => {
    const response = await apiClient.post<TaskEstimate>('/generation/estimate', params);
    return response.data;
  },
};

// ============ Settings API ============

export const settingsApi = {
  getAll: async (): Promise<Record<string, string>> => {
    const response = await apiClient.get<Record<string, string>>('/settings/');
    return response.data;
  },

  update: async (settings: Record<string, string>): Promise<void> => {
    await apiClient.put('/settings/', settings);
  },

  getByKey: async (key: string): Promise<string> => {
    const response = await apiClient.get<Record<string, string>>(`/settings/${key}`);
    return response.data[key];
  },
};

// ============ Combined API object for easy imports ============

export const api = {
  projects: projectApi,
  scenes: sceneApi,
  shots: shotApi,
  versions: versionApi,
  assets: assetApi,
  consistency: consistencyApi,
  generation: generationApi,
  settings: settingsApi,
};

export default api;
