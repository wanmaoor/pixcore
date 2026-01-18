/**
 * Tauri API 封装模块
 * 提供与 Tauri 后端通信的类型安全接口
 */

import { invoke } from '@tauri-apps/api/core';

// ============ 类型定义 ============

export interface FileInfo {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
}

export interface SystemInfo {
  os: string;
  arch: string;
  home_dir: string | null;
  app_data_dir: string | null;
}

export type ApiProvider = 'openai' | 'anthropic' | 'replicate' | 'stability' | 'midjourney' | 'custom';

// ============ 环境检测 ============

/**
 * 检查是否在 Tauri 环境中运行
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * 确保在 Tauri 环境中运行，否则抛出错误
 */
function ensureTauri(): void {
  if (!isTauriEnvironment()) {
    throw new Error('此功能仅在 Tauri 桌面应用中可用');
  }
}

// ============ 文件系统 API ============

export const fileSystem = {
  /**
   * 获取默认存储路径 (~/PixcoreStorage)
   */
  async getDefaultStoragePath(): Promise<string> {
    ensureTauri();
    return invoke<string>('get_default_storage_path');
  },

  /**
   * 确保目录存在，如果不存在则创建
   */
  async ensureDirectory(path: string): Promise<boolean> {
    ensureTauri();
    return invoke<boolean>('ensure_directory', { path });
  },

  /**
   * 检查路径是否可写
   */
  async checkPathWritable(path: string): Promise<boolean> {
    ensureTauri();
    return invoke<boolean>('check_path_writable', { path });
  },

  /**
   * 读取文件内容（返回字节数组）
   */
  async readFile(path: string): Promise<Uint8Array> {
    ensureTauri();
    const data = await invoke<number[]>('read_file', { path });
    return new Uint8Array(data);
  },

  /**
   * 读取文件为文本
   */
  async readTextFile(path: string): Promise<string> {
    const data = await this.readFile(path);
    return new TextDecoder().decode(data);
  },

  /**
   * 读取文件为 JSON
   */
  async readJsonFile<T>(path: string): Promise<T> {
    const text = await this.readTextFile(path);
    return JSON.parse(text);
  },

  /**
   * 写入文件
   */
  async writeFile(path: string, contents: Uint8Array): Promise<void> {
    ensureTauri();
    return invoke('write_file', { path, contents: Array.from(contents) });
  },

  /**
   * 写入文本文件
   */
  async writeTextFile(path: string, contents: string): Promise<void> {
    const data = new TextEncoder().encode(contents);
    return this.writeFile(path, data);
  },

  /**
   * 写入 JSON 文件
   */
  async writeJsonFile(path: string, data: unknown): Promise<void> {
    const text = JSON.stringify(data, null, 2);
    return this.writeTextFile(path, text);
  },

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<void> {
    ensureTauri();
    return invoke('delete_file', { path });
  },

  /**
   * 列出目录内容
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    ensureTauri();
    return invoke<FileInfo[]>('list_directory', { path });
  },

  /**
   * 检查文件是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    ensureTauri();
    return invoke<boolean>('file_exists', { path });
  },

  /**
   * 获取文件大小
   */
  async getFileSize(path: string): Promise<number> {
    ensureTauri();
    return invoke<number>('get_file_size', { path });
  },

  /**
   * 保存 Blob 到文件
   */
  async saveBlobToFile(path: string, blob: Blob): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    return this.writeFile(path, data);
  },
};

// ============ 密钥存储 API ============

export const keychain = {
  /**
   * 存储 API Key 到系统密钥链
   */
  async storeApiKey(provider: ApiProvider, apiKey: string): Promise<void> {
    ensureTauri();
    return invoke('store_api_key', { provider, apiKey });
  },

  /**
   * 从系统密钥链获取 API Key
   */
  async getApiKey(provider: ApiProvider): Promise<string | null> {
    ensureTauri();
    return invoke<string | null>('get_api_key', { provider });
  },

  /**
   * 删除 API Key
   */
  async deleteApiKey(provider: ApiProvider): Promise<void> {
    ensureTauri();
    return invoke('delete_api_key', { provider });
  },

  /**
   * 检查 API Key 是否存在
   */
  async hasApiKey(provider: ApiProvider): Promise<boolean> {
    ensureTauri();
    return invoke<boolean>('has_api_key', { provider });
  },

  /**
   * 获取所有已配置的 Provider
   */
  async getConfiguredProviders(): Promise<ApiProvider[]> {
    const providers: ApiProvider[] = ['openai', 'anthropic', 'replicate', 'stability', 'midjourney'];
    const configured: ApiProvider[] = [];

    for (const provider of providers) {
      try {
        if (await this.hasApiKey(provider)) {
          configured.push(provider);
        }
      } catch {
        // 忽略错误，继续检查其他 provider
      }
    }

    return configured;
  },
};

// ============ 系统信息 API ============

export const system = {
  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<SystemInfo> {
    ensureTauri();
    return invoke<SystemInfo>('get_system_info');
  },

  /**
   * 获取操作系统类型
   */
  async getOsType(): Promise<string> {
    const info = await this.getSystemInfo();
    return info.os;
  },

  /**
   * 检查是否是 macOS
   */
  async isMacOS(): Promise<boolean> {
    const os = await this.getOsType();
    return os === 'macos';
  },

  /**
   * 检查是否是 Windows
   */
  async isWindows(): Promise<boolean> {
    const os = await this.getOsType();
    return os === 'windows';
  },

  /**
   * 检查是否是 Linux
   */
  async isLinux(): Promise<boolean> {
    const os = await this.getOsType();
    return os === 'linux';
  },
};

// ============ 媒体文件管理 ============

export const media = {
  /**
   * 获取项目媒体目录路径
   */
  async getProjectMediaPath(projectId: string | number): Promise<string> {
    const storagePath = await fileSystem.getDefaultStoragePath();
    return `${storagePath}/projects/${projectId}/media`;
  },

  /**
   * 获取镜头版本目录路径
   */
  async getShotVersionPath(projectId: string | number, shotId: string | number): Promise<string> {
    const mediaPath = await this.getProjectMediaPath(projectId);
    return `${mediaPath}/shots/${shotId}`;
  },

  /**
   * 获取资产目录路径
   */
  async getAssetPath(projectId: string | number): Promise<string> {
    const storagePath = await fileSystem.getDefaultStoragePath();
    return `${storagePath}/projects/${projectId}/assets`;
  },

  /**
   * 初始化项目存储目录结构
   */
  async initializeProjectStorage(projectId: string | number): Promise<void> {
    const mediaPath = await this.getProjectMediaPath(projectId);
    const assetPath = await this.getAssetPath(projectId);

    await fileSystem.ensureDirectory(mediaPath);
    await fileSystem.ensureDirectory(`${mediaPath}/shots`);
    await fileSystem.ensureDirectory(`${mediaPath}/thumbnails`);
    await fileSystem.ensureDirectory(assetPath);
  },

  /**
   * 保存生成的图片
   */
  async saveGeneratedImage(
    projectId: string | number,
    shotId: string | number,
    versionId: string | number,
    imageBlob: Blob
  ): Promise<string> {
    const shotPath = await this.getShotVersionPath(projectId, shotId);
    await fileSystem.ensureDirectory(shotPath);

    const filename = `version_${versionId}.png`;
    const fullPath = `${shotPath}/${filename}`;

    await fileSystem.saveBlobToFile(fullPath, imageBlob);
    return fullPath;
  },

  /**
   * 保存视频文件
   */
  async saveGeneratedVideo(
    projectId: string | number,
    shotId: string | number,
    versionId: string | number,
    videoBlob: Blob
  ): Promise<string> {
    const shotPath = await this.getShotVersionPath(projectId, shotId);
    await fileSystem.ensureDirectory(shotPath);

    const filename = `version_${versionId}.mp4`;
    const fullPath = `${shotPath}/${filename}`;

    await fileSystem.saveBlobToFile(fullPath, videoBlob);
    return fullPath;
  },

  /**
   * 保存缩略图
   */
  async saveThumbnail(
    projectId: string | number,
    shotId: string | number,
    versionId: string | number,
    thumbnailBlob: Blob
  ): Promise<string> {
    const mediaPath = await this.getProjectMediaPath(projectId);
    const thumbPath = `${mediaPath}/thumbnails`;
    await fileSystem.ensureDirectory(thumbPath);

    const filename = `shot_${shotId}_v${versionId}_thumb.jpg`;
    const fullPath = `${thumbPath}/${filename}`;

    await fileSystem.saveBlobToFile(fullPath, thumbnailBlob);
    return fullPath;
  },
};

// ============ 应用设置存储 ============

export const appSettings = {
  /**
   * 获取存储路径设置
   */
  async getStoragePath(): Promise<string> {
    if (!isTauriEnvironment()) {
      return '~/PixcoreStorage'; // Web 环境返回默认值
    }
    try {
      // 先尝试从本地存储读取自定义路径
      const customPath = localStorage.getItem('pixcore_storage_path');
      if (customPath) {
        return customPath;
      }
      // 否则返回默认路径
      return await fileSystem.getDefaultStoragePath();
    } catch {
      return '~/PixcoreStorage';
    }
  },

  /**
   * 设置存储路径
   */
  async setStoragePath(path: string): Promise<void> {
    if (!isTauriEnvironment()) {
      throw new Error('此功能仅在 Tauri 桌面应用中可用');
    }

    // 验证路径可写
    const writable = await fileSystem.checkPathWritable(path);
    if (!writable) {
      throw new Error('指定的路径不可写');
    }

    // 保存到本地存储
    localStorage.setItem('pixcore_storage_path', path);
  },

  /**
   * 重置存储路径为默认值
   */
  async resetStoragePath(): Promise<string> {
    localStorage.removeItem('pixcore_storage_path');
    return await fileSystem.getDefaultStoragePath();
  },

  /**
   * 验证存储路径权限
   */
  async validateStoragePath(): Promise<{ valid: boolean; error?: string }> {
    if (!isTauriEnvironment()) {
      return { valid: true }; // Web 环境跳过验证
    }

    try {
      const path = await this.getStoragePath();
      const writable = await fileSystem.checkPathWritable(path);
      return { valid: writable };
    } catch (error) {
      return { valid: false, error: String(error) };
    }
  },
};

// ============ 统一导出 ============

export const tauri = {
  isTauriEnvironment,
  fileSystem,
  keychain,
  system,
  media,
  appSettings,
};

export default tauri;
