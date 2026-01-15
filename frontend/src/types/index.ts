// Project types
export interface Project {
  id: number;
  name: string;
  type: 'story' | 'animation' | 'short';
  resolution: { width: number; height: number };
  fps: number;
  default_model?: string;
  default_params?: Record<string, unknown>;
  default_negative_prompt?: string;
  lock_character: boolean;
  lock_style: boolean;
  lock_world: boolean;
  lock_key_object: boolean;
  created_at: string;
  updated_at: string;
}

// Scene types
export interface Scene {
  id: number;
  project_id: number;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// Shot types
export interface Shot {
  id: number;
  scene_id: number;
  order: number;
  shot_type?: string;
  camera_move?: string;
  duration: number;
  composition?: string;
  lens?: string;
  story_desc?: string;
  visual_desc?: string;
  prompt: string;
  negative_prompt?: string;
  asset_refs: AssetRef[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Asset types
export interface Asset {
  id: number;
  project_id: number;
  type: 'character' | 'scene' | 'style' | 'key_object';
  name: string;
  description?: string;
  reference_images: string[];
  meta?: Record<string, unknown>;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetRef {
  type: Asset['type'];
  id: number;
  snapshot?: Partial<Asset>;
}

// Version types
export interface Version {
  id: number;
  shot_id: number;
  type: 'image' | 'video';
  url: string;
  thumb_url?: string;
  params?: Record<string, unknown>;
  is_primary: boolean;
  created_at: string;
}

// Generation task types
export interface GenerationTask {
  task_id: string;
  status: 'queued' | 'running' | 'success' | 'failed';
  progress: number;
  message?: string;
  result?: Record<string, unknown>;
}
