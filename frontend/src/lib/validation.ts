import { z } from 'zod';

// ============ Project Schemas ============

export const projectSchema = z.object({
  name: z.string()
    .min(2, 'projects.create_dialog.name_too_short')
    .max(50, 'projects.create_dialog.name_too_long'),
  type: z.enum(['story', 'animation', 'short']).default('story'),
  resolution: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).default({ width: 1920, height: 1080 }),
  fps: z.number().int().min(1).max(120).default(24),
  default_model: z.string().optional(),
  default_params: z.record(z.string(), z.any()).optional(),
  default_negative_prompt: z.string().optional(),
  lock_character: z.boolean().default(false),
  lock_style: z.boolean().default(false),
  lock_world: z.boolean().default(false),
  lock_key_object: z.boolean().default(false),
});

export const projectUpdateSchema = projectSchema.partial();

// ============ Scene Schemas ============

export const sceneSchema = z.object({
  name: z.string().min(1).max(100),
  order: z.number().int().min(0).default(0),
  project_id: z.number().int(),
});

export const sceneUpdateSchema = sceneSchema.partial().omit({ project_id: true });

// ============ Shot Schemas ============

export const shotSchema = z.object({
  scene_id: z.number().int(),
  order: z.number().int().min(0).default(0),
  shot_type: z.string().nullable().optional(),
  camera_move: z.string().nullable().optional(),
  duration: z.number().gt(0, 'Duration must be positive').default(5.0),
  composition: z.string().nullable().optional(),
  lens: z.string().nullable().optional(),
  story_desc: z.string().nullable().optional(),
  visual_desc: z.string().nullable().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
  negative_prompt: z.string().nullable().optional(),
  asset_refs: z.array(z.record(z.string(), z.any())).default([]),
});

export const shotUpdateSchema = shotSchema.partial().omit({ scene_id: true }).extend({
  status: z.enum(['pending', 'generating', 'completed', 'failed']).optional(),
});

// ============ Asset Schemas ============

export const assetSchema = z.object({
  project_id: z.number().int(),
  type: z.enum(['character', 'scene', 'style', 'key_object']),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  reference_images: z.array(z.string()).default([]),
  meta: z.record(z.string(), z.any()).nullable().optional(),
});

export const assetUpdateSchema = assetSchema.partial().omit({ project_id: true });

// ============ Settings Schemas ============

export const storagePathSchema = z.string()
  .min(1, 'Path is required')
  .regex(/^(\/|([a-zA-Z]:\\))/, 'Invalid path format');

export const apiKeySchema = z.string().min(1, 'API key is required');

// ============ Generation Schemas ============

export const textToImageSchema = z.object({
  shot_id: z.number().int(),
  prompt: z.string().min(1),
  negative_prompt: z.string().optional(),
  params: z.record(z.string(), z.any()).default({}),
  resolution: z.tuple([z.number().int(), z.number().int()]).default([1024, 1024]),
});

export const textToVideoSchema = z.object({
  shot_id: z.number().int(),
  prompt: z.string().min(1),
  negative_prompt: z.string().optional(),
  params: z.record(z.string(), z.any()).default({}),
  duration: z.number().gt(0).max(30).default(5.0),
  fps: z.number().int().min(1).max(60).default(24),
});

// ============ Type Inference ============



export type ProjectFormValues = z.infer<typeof projectSchema>;

export type SceneFormValues = z.infer<typeof sceneSchema>;

export type ShotFormValues = z.infer<typeof shotSchema>;

export type AssetFormValues = z.infer<typeof assetSchema>;


