import { Settings, Key, Folder, Info, Monitor } from 'lucide-react';
import { ApiKeyInput } from './ApiKeyInput';
import { StoragePathSettings } from './StoragePathSettings';
import { useSystemInfo, useTauriEnvironment } from '../../../hooks/useTauri';

/**
 * 设置页面
 * 包含 API Key 管理、存储路径设置、系统信息等
 */
export const SettingsPage = () => {
  const isTauri = useTauriEnvironment();
  const { systemInfo, loading: systemLoading } = useSystemInfo();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Settings className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">设置</h1>
            <p className="text-sm text-zinc-500">管理应用配置和 API 密钥</p>
          </div>
        </div>

        {/* API Key 设置区域 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold">API 密钥</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            配置 AI 服务提供商的 API 密钥。密钥将安全存储在系统密钥链中。
          </p>

          <div className="space-y-4">
            <ApiKeyInput
              provider="openai"
              label="OpenAI"
              description="用于 DALL-E 图像生成和 GPT 文本处理"
            />
            <ApiKeyInput
              provider="anthropic"
              label="Anthropic"
              description="用于 Claude AI 文本处理"
            />
            <ApiKeyInput
              provider="replicate"
              label="Replicate"
              description="用于各种开源 AI 模型"
            />
            <ApiKeyInput
              provider="stability"
              label="Stability AI"
              description="用于 Stable Diffusion 图像生成"
            />
            <ApiKeyInput
              provider="midjourney"
              label="Midjourney"
              description="用于 Midjourney 图像生成（需要代理服务）"
            />
          </div>
        </section>

        {/* 存储设置区域 */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold">存储设置</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            配置项目文件和媒体资源的存储位置。
          </p>

          <StoragePathSettings />
        </section>

        {/* 系统信息区域 */}
        {isTauri && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-semibold">系统信息</h2>
            </div>

            <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              {systemLoading ? (
                <p className="text-zinc-500">加载中...</p>
              ) : systemInfo ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">操作系统</span>
                    <p className="text-zinc-100 font-mono">{systemInfo.os}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">架构</span>
                    <p className="text-zinc-100 font-mono">{systemInfo.arch}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">用户目录</span>
                    <p className="text-zinc-100 font-mono truncate" title={systemInfo.home_dir || ''}>
                      {systemInfo.home_dir || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">应用数据目录</span>
                    <p className="text-zinc-100 font-mono truncate" title={systemInfo.app_data_dir || ''}>
                      {systemInfo.app_data_dir || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-500">无法获取系统信息</p>
              )}
            </div>
          </section>
        )}

        {/* 关于信息 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold">关于</h2>
          </div>

          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">应用名称</span>
                <span className="text-zinc-100">Pixcore</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">版本</span>
                <span className="text-zinc-100">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">运行环境</span>
                <span className="text-zinc-100">{isTauri ? '桌面应用' : 'Web 浏览器'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
