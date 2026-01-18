/**
 * Tauri 相关的 React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { tauri, isTauriEnvironment, SystemInfo, ApiProvider, FileInfo } from '../lib/tauri';

// ============ 环境检测 Hook ============

/**
 * 检测是否在 Tauri 环境中运行
 */
export function useTauriEnvironment(): boolean {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  return isTauri;
}

// ============ 系统信息 Hook ============

interface UseSystemInfoResult {
  systemInfo: SystemInfo | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 获取系统信息
 */
export function useSystemInfo(): UseSystemInfoResult {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useTauriEnvironment();

  const fetchSystemInfo = useCallback(async () => {
    if (!isTauri) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const info = await tauri.system.getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isTauri]);

  useEffect(() => {
    fetchSystemInfo();
  }, [fetchSystemInfo]);

  return { systemInfo, loading, error, refetch: fetchSystemInfo };
}

// ============ API Key 管理 Hooks ============

interface UseApiKeyResult {
  apiKey: string | null;
  hasKey: boolean;
  loading: boolean;
  error: string | null;
  saveKey: (key: string) => Promise<void>;
  deleteKey: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * 管理单个 Provider 的 API Key
 */
export function useApiKey(provider: ApiProvider): UseApiKeyResult {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useTauriEnvironment();

  const fetchKey = useCallback(async () => {
    if (!isTauri) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const key = await tauri.keychain.getApiKey(provider);
      setApiKey(key);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isTauri, provider]);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  const saveKey = useCallback(
    async (key: string) => {
      if (!isTauri) {
        throw new Error('此功能仅在 Tauri 桌面应用中可用');
      }

      try {
        setError(null);
        await tauri.keychain.storeApiKey(provider, key);
        setApiKey(key);
      } catch (err) {
        const errorMsg = String(err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [isTauri, provider]
  );

  const deleteKey = useCallback(async () => {
    if (!isTauri) {
      throw new Error('此功能仅在 Tauri 桌面应用中可用');
    }

    try {
      setError(null);
      await tauri.keychain.deleteApiKey(provider);
      setApiKey(null);
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isTauri, provider]);

  return {
    apiKey,
    hasKey: apiKey !== null,
    loading,
    error,
    saveKey,
    deleteKey,
    refetch: fetchKey,
  };
}

interface UseApiKeysResult {
  configuredProviders: ApiProvider[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 获取所有已配置的 API Provider
 */
export function useApiKeys(): UseApiKeysResult {
  const [configuredProviders, setConfiguredProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useTauriEnvironment();

  const fetchProviders = useCallback(async () => {
    if (!isTauri) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const providers = await tauri.keychain.getConfiguredProviders();
      setConfiguredProviders(providers);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isTauri]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { configuredProviders, loading, error, refetch: fetchProviders };
}

// ============ 存储路径管理 Hooks ============

interface UseStoragePathResult {
  storagePath: string;
  loading: boolean;
  error: string | null;
  isValid: boolean;
  setPath: (path: string) => Promise<void>;
  resetPath: () => Promise<void>;
  validatePath: () => Promise<boolean>;
}

/**
 * 管理存储路径
 */
export function useStoragePath(): UseStoragePathResult {
  const [storagePath, setStoragePath] = useState('~/PixcoreStorage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const isTauri = useTauriEnvironment();

  const fetchPath = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const path = await tauri.appSettings.getStoragePath();
      setStoragePath(path);

      if (isTauri) {
        const { valid } = await tauri.appSettings.validateStoragePath();
        setIsValid(valid);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isTauri]);

  useEffect(() => {
    fetchPath();
  }, [fetchPath]);

  const setPath = useCallback(
    async (path: string) => {
      if (!isTauri) {
        throw new Error('此功能仅在 Tauri 桌面应用中可用');
      }

      try {
        setError(null);
        await tauri.appSettings.setStoragePath(path);
        setStoragePath(path);
        setIsValid(true);
      } catch (err) {
        const errorMsg = String(err);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [isTauri]
  );

  const resetPath = useCallback(async () => {
    try {
      setError(null);
      const defaultPath = await tauri.appSettings.resetStoragePath();
      setStoragePath(defaultPath);
      setIsValid(true);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const validatePath = useCallback(async () => {
    if (!isTauri) {
      return true;
    }

    try {
      const { valid, error: validationError } = await tauri.appSettings.validateStoragePath();
      setIsValid(valid);
      if (!valid && validationError) {
        setError(validationError);
      }
      return valid;
    } catch (err) {
      setError(String(err));
      setIsValid(false);
      return false;
    }
  }, [isTauri]);

  return {
    storagePath,
    loading,
    error,
    isValid,
    setPath,
    resetPath,
    validatePath,
  };
}

// ============ 文件系统 Hooks ============

interface UseDirectoryResult {
  files: FileInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 列出目录内容
 */
export function useDirectory(path: string): UseDirectoryResult {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useTauriEnvironment();

  const fetchFiles = useCallback(async () => {
    if (!isTauri || !path) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fileList = await tauri.fileSystem.listDirectory(path);
      setFiles(fileList);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [isTauri, path]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, loading, error, refetch: fetchFiles };
}

// ============ 媒体文件管理 Hooks ============

interface UseProjectMediaResult {
  mediaPath: string | null;
  loading: boolean;
  error: string | null;
  initializeStorage: () => Promise<void>;
  saveImage: (shotId: string | number, versionId: string | number, blob: Blob) => Promise<string>;
  saveVideo: (shotId: string | number, versionId: string | number, blob: Blob) => Promise<string>;
  saveThumbnail: (shotId: string | number, versionId: string | number, blob: Blob) => Promise<string>;
}

/**
 * 管理项目媒体文件
 */
export function useProjectMedia(projectId: string | number | null): UseProjectMediaResult {
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isTauri = useTauriEnvironment();

  useEffect(() => {
    async function fetchPath() {
      if (!isTauri || !projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const path = await tauri.media.getProjectMediaPath(projectId);
        setMediaPath(path);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchPath();
  }, [isTauri, projectId]);

  const initializeStorage = useCallback(async () => {
    if (!isTauri || !projectId) {
      throw new Error('无法初始化存储');
    }

    try {
      setError(null);
      await tauri.media.initializeProjectStorage(projectId);
    } catch (err) {
      const errorMsg = String(err);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isTauri, projectId]);

  const saveImage = useCallback(
    async (shotId: string | number, versionId: string | number, blob: Blob) => {
      if (!isTauri || !projectId) {
        throw new Error('无法保存图片');
      }
      return tauri.media.saveGeneratedImage(projectId, shotId, versionId, blob);
    },
    [isTauri, projectId]
  );

  const saveVideo = useCallback(
    async (shotId: string | number, versionId: string | number, blob: Blob) => {
      if (!isTauri || !projectId) {
        throw new Error('无法保存视频');
      }
      return tauri.media.saveGeneratedVideo(projectId, shotId, versionId, blob);
    },
    [isTauri, projectId]
  );

  const saveThumbnail = useCallback(
    async (shotId: string | number, versionId: string | number, blob: Blob) => {
      if (!isTauri || !projectId) {
        throw new Error('无法保存缩略图');
      }
      return tauri.media.saveThumbnail(projectId, shotId, versionId, blob);
    },
    [isTauri, projectId]
  );

  return {
    mediaPath,
    loading,
    error,
    initializeStorage,
    saveImage,
    saveVideo,
    saveThumbnail,
  };
}
