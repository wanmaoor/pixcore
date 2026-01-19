import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Cpu, Clock, Save, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../../lib/api';

/**
 * 模型配置设置组件
 * 管理默认模型选择、耗时估算权重等
 */
export const ModelSettings: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_image_model: 'stable-diffusion-xl',
    default_video_model: 'stable-video-diffusion',
    quality_preset: 'standard',
    estimation_factor: '1.0',
  });

  // 加载设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingsApi.getAll();
        
        // 只有当后端返回了对应 key 时才更新，否则使用默认值
        setSettings(prev => ({
          ...prev,
          default_image_model: data.default_image_model || prev.default_image_model,
          default_video_model: data.default_video_model || prev.default_video_model,
          quality_preset: data.quality_preset || prev.quality_preset,
          estimation_factor: data.estimation_factor || prev.estimation_factor,
        }));
      } catch (error) {
        console.error('Failed to load model settings', error);
        // 不报错，可能数据库还是空的
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.update(settings);
      toast.success(t('settings.save_success') || '设置已保存');
    } catch (error) {
      console.error('Failed to save model settings', error);
      toast.error(t('settings.save_failed') || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <p className="text-sm">加载模型配置...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 默认图像模型 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            默认图像模型
          </label>
          <select
            value={settings.default_image_model}
            onChange={(e) => setSettings({ ...settings, default_image_model: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="stable-diffusion-xl">Stable Diffusion XL (本地/API)</option>
            <option value="dall-e-3">OpenAI DALL-E 3</option>
            <option value="midjourney-v6">Midjourney v6 (需代理)</option>
            <option value="playground-v2.5">Playground v2.5</option>
          </select>
          <p className="text-xs text-zinc-500">
            新建分镜时默认选中的生图模型。
          </p>
        </div>

        {/* 默认视频模型 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            默认视频模型
          </label>
          <select
            value={settings.default_video_model}
            onChange={(e) => setSettings({ ...settings, default_video_model: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="stable-video-diffusion">Stable Video Diffusion</option>
            <option value="runway-gen-2">Runway Gen-2</option>
            <option value="pika-1.0">Pika 1.0</option>
            <option value="luma-dream-machine">Luma Dream Machine</option>
          </select>
          <p className="text-xs text-zinc-500">
            用于视频生成的默认模型。
          </p>
        </div>

        {/* 质量预设 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-green-400" />
            生成质量预设
          </label>
          <select
            value={settings.quality_preset}
            onChange={(e) => setSettings({ ...settings, quality_preset: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="fast">速度优先 (Fast)</option>
            <option value="standard">标准 (Standard)</option>
            <option value="high">质量优先 (High Quality)</option>
          </select>
          <p className="text-xs text-zinc-500">
            影响步数 (Steps) 和采样器配置。
          </p>
        </div>

        {/* 耗时估算系数 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            估算时间倍率
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.estimation_factor}
              onChange={(e) => setSettings({ ...settings, estimation_factor: e.target.value })}
              className="flex-1 accent-orange-500"
            />
            <span className="text-sm font-mono text-zinc-400 w-8">{settings.estimation_factor}x</span>
          </div>
          <p className="text-xs text-zinc-500">
            根据您的网络或机器性能调整 UI 显示的预计耗时。
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存模型配置
        </button>
      </div>
    </div>
  );
};
