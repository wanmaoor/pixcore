import { useState } from 'react';
import { Folder, Check, RotateCcw, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useStoragePath, useTauriEnvironment } from '../../../hooks/useTauri';

import { storagePathSchema } from '../../../lib/validation';

/**
 * 存储路径设置组件
 */
export function StoragePathSettings() {
  const isTauri = useTauriEnvironment();
  const { storagePath, loading, error, isValid, setPath, resetPath, validatePath } = useStoragePath();
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedPath = inputValue.trim();
    
    // Validate with zod
    const validation = storagePathSchema.safeParse(trimmedPath);
    if (!validation.success) {
      setSaveError(validation.error.errors[0].message);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await setPath(trimmedPath);
      setInputValue('');
      setIsEditing(false);
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要重置为默认存储路径吗？')) {
      return;
    }

    try {
      await resetPath();
      setInputValue('');
      setIsEditing(false);
      setSaveError(null);
    } catch (err) {
      setSaveError(String(err));
    }
  };

  const handleValidate = async () => {
    const valid = await validatePath();
    if (valid) {
      setSaveError(null);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setIsEditing(false);
    setSaveError(null);
  };

  if (!isTauri) {
    return (
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <Folder className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-100">存储路径</span>
        </div>
        <p className="text-sm text-zinc-500">
          存储路径设置仅在桌面应用中可用。Web 版本使用服务器存储。
        </p>
      </div>
    );
  }

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
          <Folder className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-100">存储路径</span>
          {isValid ? (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded-full">
              <CheckCircle className="w-3 h-3" />
              可用
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-red-900/50 text-red-400 rounded-full">
              <AlertCircle className="w-3 h-3" />
              不可用
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-500 mb-3">
        项目文件、生成的图片和视频将存储在此目录下
      </p>

      {(error || saveError) && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-400">
          {error || saveError}
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-zinc-800 rounded font-mono text-sm text-zinc-300 truncate">
              {storagePath}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInputValue(storagePath);
                setIsEditing(true);
              }}
              className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              更改路径
            </button>
            <button
              onClick={handleValidate}
              className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              验证路径
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置为默认
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入存储路径"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
            disabled={isSaving}
          />
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
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
