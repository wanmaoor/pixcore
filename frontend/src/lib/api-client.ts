import axios from 'axios';

// Environment variable for API URL (to be set later, default to localhost for dev)
const API_BASE_URL = import.meta.env.VITE_API_ABSE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Consistency Settings Types ============

export interface LockedAsset {
  id: number;
  name: string;
  description: string | null;
  reference_images: string[];
  type: string;
}

export interface ConsistencySettings {
  lock_character: boolean;
  lock_style: boolean;
  lock_world: boolean;
  lock_key_object: boolean;
  locked_characters: LockedAsset[];
  locked_styles: LockedAsset[];
  locked_worlds: LockedAsset[];
  locked_key_objects: LockedAsset[];
}

export interface ConsistencySettingsUpdate {
  lock_character?: boolean;
  lock_style?: boolean;
  lock_world?: boolean;
  lock_key_object?: boolean;
  locked_character_ids?: number[];
  locked_style_ids?: number[];
  locked_world_ids?: number[];
  locked_key_object_ids?: number[];
}

export interface PromptInjection {
  project_id: number;
  injection_text: string;
  has_injections: boolean;
  active_locks: {
    character: boolean;
    style: boolean;
    world: boolean;
    key_object: boolean;
  };
}

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
