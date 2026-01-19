/**
 * 项目设置对话框
 * 包含基础设置、一致性锁定、生成设置等标签页
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Settings, Monitor, Lock, Wand2 } from 'lucide-react';
import { ConsistencySettingsPanel, ConsistencySettings } from './ConsistencySettings';

interface ProjectSettings {
  id: number;
  name: string;
  type: 'story' | 'animation' | 'short';
  resolution: { width: number; height: number };
  fps: number;
  default_model: string | null;
  default_negative_prompt: string | null;
  // Consistency settings
  lock_character: boolean;
  lock_style: boolean;
  lock_world: boolean;
  lock_key_object: boolean;
}

interface Asset {
  id: number;
  name: string;
  description: string | null;
  reference_images: string[];
  type: string;
  is_archived: boolean;
}

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectSettings;
  assets: Asset[];
  consistencySettings: ConsistencySettings;
  onSave: (settings: Partial<ProjectSettings>) => Promise<void>;
  onConsistencyChange: (settings: Partial<ConsistencySettings>) => void;
  onAssetIdsChange: (lockType: string, assetIds: number[]) => Promise<void>;
}

type TabKey = 'basic' | 'consistency' | 'generation';

const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'basic', label: '基础设置', icon: Monitor },
  { key: 'consistency', label: '一致性锁定', icon: Lock },
  { key: 'generation', label: '生成设置', icon: Wand2 },
];

const resolutionPresets = [
  { label: '16:9 (1920×1080)', width: 1920, height: 1080 },
  { label: '16:9 (1280×720)', width: 1280, height: 720 },
  { label: '4:3 (1440×1080)', width: 1440, height: 1080 },
  { label: '1:1 (1080×1080)', width: 1080, height: 1080 },
  { label: '9:16 (1080×1920)', width: 1080, height: 1920 },
  { label: '21:9 (2560×1080)', width: 2560, height: 1080 },
];

const fpsPresets = [24, 25, 30, 48, 60];

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  assets,
  consistencySettings,
  onSave,
  onConsistencyChange,
  onAssetIdsChange,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    type: project.type,
    resolution: project.resolution,
    fps: project.fps,
    default_model: project.default_model || '',
    default_negative_prompt: project.default_negative_prompt || '',
  });

  // 当 project 变化时更新表单
  useEffect(() => {
    setFormData({
      name: project.name,
      type: project.type,
      resolution: project.resolution,
      fps: project.fps,
      default_model: project.default_model || '',
      default_negative_prompt: project.default_negative_prompt || '',
    });
  }, [project]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name: formData.name,
        type: formData.type,
        resolution: formData.resolution,
        fps: formData.fps,
        default_model: formData.default_model || null,
        default_negative_prompt: formData.default_negative_prompt || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save project settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[85vh] translate-x-[-50%] translate-y-[-50%] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Settings className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-zinc-100">
                  项目设置
                </Dialog.Title>
                <Dialog.Description className="text-sm text-zinc-500">
                  {project.name}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* 标签页 */}
          <div className="flex border-b border-zinc-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-white border-blue-500'
                      : 'text-zinc-400 border-transparent hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 内容区 */}
          <div className="flex-1 overflow-auto p-6">
            {/* 基础设置 */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* 项目名称 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    项目名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 项目类型 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    项目类型
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['story', 'animation', 'short'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          formData.type === type
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {type === 'story' && '故事片'}
                        {type === 'animation' && '动画'}
                        {type === 'short' && '短片'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分辨率 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    分辨率
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {resolutionPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            resolution: { width: preset.width, height: preset.height },
                          })
                        }
                        className={`px-3 py-2 rounded-lg border text-xs transition-colors ${
                          formData.resolution.width === preset.width &&
                          formData.resolution.height === preset.height
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 帧率 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    帧率 (FPS)
                  </label>
                  <div className="flex gap-2">
                    {fpsPresets.map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setFormData({ ...formData, fps })}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          formData.fps === fps
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        {fps}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 一致性设置 */}
            {activeTab === 'consistency' && (
              <ConsistencySettingsPanel
                settings={consistencySettings}
                assets={assets}
                onSettingsChange={onConsistencyChange}
                onAssetIdsChange={onAssetIdsChange}
              />
            )}

            {/* 生成设置 */}
            {activeTab === 'generation' && (
              <div className="space-y-6">
                {/* 默认模型 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    默认生成模型
                  </label>
                  <select
                    value={formData.default_model}
                    onChange={(e) =>
                      setFormData({ ...formData, default_model: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">选择模型...</option>
                    <option value="dall-e-3">DALL-E 3</option>
                    <option value="stable-diffusion-xl">Stable Diffusion XL</option>
                    <option value="midjourney">Midjourney</option>
                    <option value="flux-pro">Flux Pro</option>
                  </select>
                </div>

                {/* 默认负面提示词 */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    默认负面提示词
                  </label>
                  <textarea
                    value={formData.default_negative_prompt}
                    onChange={(e) =>
                      setFormData({ ...formData, default_negative_prompt: e.target.value })
                    }
                    placeholder="输入默认负面提示词，将应用于所有镜头生成..."
                    rows={4}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    负面提示词会告诉 AI 避免生成哪些内容
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="flex justify-end gap-3 p-4 border-t border-zinc-800">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
