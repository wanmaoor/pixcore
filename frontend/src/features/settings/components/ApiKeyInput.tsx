import { useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2, Key, Trash2 } from 'lucide-react';
import { useApiKey } from '../../../hooks/useTauri';
import { ApiProvider } from '../../../lib/tauri';

interface ApiKeyInputProps {
  provider: ApiProvider;
  label: string;
  description?: string;
}

import { apiKeySchema } from '../../../lib/validation';

/**
 * API Key 输入组件
 * 支持密钥的安全存储、显示/隐藏、验证状态显示
 */
export function ApiKeyInput({ provider, label, description }: ApiKeyInputProps) {
  const { apiKey, hasKey, loading, error, saveKey, deleteKey } = useApiKey(provider);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedKey = inputValue.trim();
    
    // Validate with zod
    const validation = apiKeySchema.safeParse(trimmedKey);
    if (!validation.success) {
      setSaveError(validation.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveKey(trimmedKey);
      setInputValue('');
      setIsEditing(false);
    } catch (err) {
      setSaveError(String(err));
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`确定要删除 ${label} 的 API Key 吗？`)) {
      return;
    }

    try {
      await deleteKey();
      setInputValue('');
    } catch (err) {
      setSaveError(String(err));
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setIsEditing(false);
    setSaveError(null);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-zinc-900 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        <span className="text-zinc-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-100">{label}</span>
          {hasKey && (
            <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded-full">
              已配置
            </span>
          )}
        </div>
        {hasKey && !isEditing && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
            title="删除 API Key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {description && <p className="text-sm text-zinc-500 mb-3">{description}</p>}

      {error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
          {error}
        </div>
      )}

      {hasKey && !isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-zinc-800 rounded font-mono text-sm text-zinc-300">
            {showKey ? apiKey : maskKey(apiKey || '')}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            title={showKey ? '隐藏' : '显示'}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            更换
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`输入 ${label} API Key`}
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
              disabled={isSaving}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title={showKey ? '隐藏' : '显示'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {saveError && (
            <p className="text-sm text-red-400">{saveError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !inputValue.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              保存
            </button>
            {isEditing && (
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
