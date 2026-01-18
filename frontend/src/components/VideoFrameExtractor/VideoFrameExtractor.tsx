/**
 * 视频抽帧组件
 * 使用 Canvas 从视频中提取帧并生成缩略图
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoFrameExtractorProps {
  videoUrl: string;
  onFrameExtracted?: (blob: Blob, timestamp: number) => void;
  onThumbnailGenerated?: (blob: Blob) => void;
  autoExtractFirstFrame?: boolean;
  className?: string;
}

interface ExtractedFrame {
  blob: Blob;
  timestamp: number;
  dataUrl: string;
}

/**
 * 视频帧提取器组件
 */
export function VideoFrameExtractor({
  videoUrl,
  onFrameExtracted,
  onThumbnailGenerated,
  autoExtractFirstFrame = true,
  className = '',
}: VideoFrameExtractorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);

  // ============ 帧提取核心逻辑 ============

  /**
   * 从当前视频帧提取图像
   */
  const extractCurrentFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setError('视频或画布未就绪');
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('无法获取画布上下文');
      return null;
    }

    // 设置画布尺寸与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 绘制当前帧到画布
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 转换为 Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9
      );
    });
  }, []);

  /**
   * 提取指定时间点的帧
   */
  const extractFrameAtTime = useCallback(
    async (timestamp: number): Promise<Blob | null> => {
      const video = videoRef.current;
      if (!video) return null;

      return new Promise((resolve) => {
        const handleSeeked = async () => {
          video.removeEventListener('seeked', handleSeeked);
          const blob = await extractCurrentFrame();
          resolve(blob);
        };

        video.addEventListener('seeked', handleSeeked);
        video.currentTime = timestamp;
      });
    },
    [extractCurrentFrame]
  );

  /**
   * 手动提取当前帧
   */
  const handleExtractFrame = useCallback(async () => {
    setIsExtracting(true);
    setError(null);

    try {
      const blob = await extractCurrentFrame();
      if (blob) {
        const dataUrl = URL.createObjectURL(blob);
        const timestamp = videoRef.current?.currentTime || 0;

        const frame: ExtractedFrame = {
          blob,
          timestamp,
          dataUrl,
        };

        setExtractedFrames((prev) => [...prev, frame]);
        onFrameExtracted?.(blob, timestamp);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsExtracting(false);
    }
  }, [extractCurrentFrame, onFrameExtracted]);

  /**
   * 生成缩略图（首帧）
   */
  const generateThumbnail = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 缩略图尺寸
    const thumbWidth = 320;
    const thumbHeight = Math.round((video.videoHeight / video.videoWidth) * thumbWidth);

    canvas.width = thumbWidth;
    canvas.height = thumbHeight;

    // 绘制缩放后的帧
    ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);

    // 转换为 Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setThumbnailGenerated(true);
          onThumbnailGenerated?.(blob);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [onThumbnailGenerated]);

  // ============ 视频加载事件处理 ============

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setError(null);

      // 自动提取首帧作为缩略图
      if (autoExtractFirstFrame) {
        // 确保视频在第一帧
        video.currentTime = 0;
      }
    };

    const handleSeeked = () => {
      // 当 seek 到首帧时生成缩略图
      if (autoExtractFirstFrame && video.currentTime === 0 && !thumbnailGenerated) {
        generateThumbnail();
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setError('视频加载失败');
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [autoExtractFirstFrame, thumbnailGenerated, generateThumbnail]);

  // 清理 URL 对象
  useEffect(() => {
    return () => {
      extractedFrames.forEach((frame) => {
        URL.revokeObjectURL(frame.dataUrl);
      });
    };
  }, [extractedFrames]);

  return (
    <div className={`${className}`}>
      {/* 隐藏的视频和画布元素 */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="hidden"
        crossOrigin="anonymous"
        preload="metadata"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* 状态显示 */}
      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-zinc-200">视频帧提取</span>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : thumbnailGenerated ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : null}
        </div>

        {error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}

        {!isLoading && !error && (
          <>
            {/* 缩略图状态 */}
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-zinc-500">缩略图:</span>
              {thumbnailGenerated ? (
                <span className="text-green-400">已生成</span>
              ) : (
                <span className="text-yellow-400">待生成</span>
              )}
            </div>

            {/* 提取按钮 */}
            <button
              onClick={handleExtractFrame}
              disabled={isExtracting}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white text-sm rounded transition-colors"
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              提取当前帧
            </button>

            {/* 已提取的帧列表 */}
            {extractedFrames.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-zinc-500 mb-2">已提取 {extractedFrames.length} 帧</p>
                <div className="flex gap-2 overflow-x-auto">
                  {extractedFrames.map((frame, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={frame.dataUrl}
                        alt={`帧 ${index + 1}`}
                        className="w-20 h-auto rounded border border-zinc-700"
                      />
                      <p className="text-xs text-zinc-500 text-center mt-1">
                        {formatTime(frame.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============ 独立工具函数 ============

/**
 * 从视频 URL 提取首帧作为缩略图
 * 可在组件外独立使用
 */
export async function extractVideoThumbnail(
  videoUrl: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
  } = {}
): Promise<Blob> {
  const { width = 320, quality = 0.8, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建画布上下文'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    video.onloadeddata = () => {
      // 计算缩略图尺寸
      const height = Math.round((video.videoHeight / video.videoWidth) * width);
      canvas.width = width;
      canvas.height = height;

      // Seek 到首帧
      video.currentTime = 0;
    };

    video.onseeked = () => {
      // 绘制帧
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('生成缩略图失败'));
          }
          // 清理
          video.src = '';
        },
        format,
        quality
      );
    };

    video.onerror = () => {
      reject(new Error('视频加载失败'));
    };

    video.src = videoUrl;
  });
}

/**
 * 从视频提取多帧
 */
export async function extractVideoFrames(
  videoUrl: string,
  timestamps: number[],
  options: {
    width?: number;
    quality?: number;
  } = {}
): Promise<Array<{ blob: Blob; timestamp: number }>> {
  const { width, quality = 0.9 } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法创建画布上下文'));
      return;
    }

    const frames: Array<{ blob: Blob; timestamp: number }> = [];
    let currentIndex = 0;

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'metadata';

    video.onloadeddata = () => {
      // 设置画布尺寸
      if (width) {
        const height = Math.round((video.videoHeight / video.videoWidth) * width);
        canvas.width = width;
        canvas.height = height;
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // 开始提取第一帧
      if (timestamps.length > 0) {
        video.currentTime = timestamps[0];
      } else {
        resolve(frames);
      }
    };

    video.onseeked = () => {
      // 绘制当前帧
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            frames.push({
              blob,
              timestamp: timestamps[currentIndex],
            });
          }

          currentIndex++;

          // 继续提取下一帧或完成
          if (currentIndex < timestamps.length) {
            video.currentTime = timestamps[currentIndex];
          } else {
            video.src = '';
            resolve(frames);
          }
        },
        'image/jpeg',
        quality
      );
    };

    video.onerror = () => {
      reject(new Error('视频加载失败'));
    };

    video.src = videoUrl;
  });
}

// ============ 辅助函数 ============

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default VideoFrameExtractor;
