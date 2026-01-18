/**
 * 专业视频播放器组件
 * 支持逐帧控制、播放速度调整、全屏等功能
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  RotateCcw,
  Settings,
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  fps?: number; // 视频帧率，用于逐帧控制
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onFrameCapture?: (blob: Blob, timestamp: number) => void;
}

export function VideoPlayer({
  src,
  poster,
  className = '',
  autoPlay = false,
  loop = false,
  muted = false,
  fps = 24,
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  // 帧时间（秒）
  const frameTime = 1 / fps;

  // ============ 播放控制 ============

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  }, [duration]);

  const seekToStart = useCallback(() => {
    seek(0);
  }, [seek]);

  const seekToEnd = useCallback(() => {
    seek(duration);
  }, [seek, duration]);

  // ============ 逐帧控制 ============

  const stepForward = useCallback(() => {
    if (videoRef.current) {
      pause();
      const newTime = Math.min(currentTime + frameTime, duration);
      videoRef.current.currentTime = newTime;
    }
  }, [currentTime, frameTime, duration, pause]);

  const stepBackward = useCallback(() => {
    if (videoRef.current) {
      pause();
      const newTime = Math.max(currentTime - frameTime, 0);
      videoRef.current.currentTime = newTime;
    }
  }, [currentTime, frameTime, pause]);

  // ============ 音量控制 ============

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  }, []);

  // ============ 播放速度 ============

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSettings(false);
  }, []);

  // ============ 全屏控制 ============

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await containerRef.current.requestFullscreen();
    }
  }, [isFullscreen]);

  // ============ 事件处理 ============

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onTimeUpdate, onEnded]);

  // 自动隐藏控制栏
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
      if (isPlaying) {
        hideControlsTimer.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => setShowControls(false));
      container.addEventListener('mouseenter', () => setShowControls(true));
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [isPlaying]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            stepBackward();
          } else {
            seek(currentTime - 5);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            stepForward();
          } else {
            seek(currentTime + 5);
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case ',':
          stepBackward();
          break;
        case '.':
          stepForward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepBackward, stepForward, seek, currentTime, toggleFullscreen, toggleMute]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* 播放/暂停遮罩 */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 进度条 */}
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-600 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #52525b ${(currentTime / duration) * 100}%, #52525b 100%)`,
            }}
          />
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 播放/暂停 */}
            <button onClick={togglePlay} className="p-1.5 text-white hover:bg-white/20 rounded">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* 跳转到开始 */}
            <button onClick={seekToStart} className="p-1.5 text-white hover:bg-white/20 rounded">
              <SkipBack className="w-4 h-4" />
            </button>

            {/* 上一帧 */}
            <button onClick={stepBackward} className="p-1.5 text-white hover:bg-white/20 rounded" title="上一帧 (,)">
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 下一帧 */}
            <button onClick={stepForward} className="p-1.5 text-white hover:bg-white/20 rounded" title="下一帧 (.)">
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 跳转到结束 */}
            <button onClick={seekToEnd} className="p-1.5 text-white hover:bg-white/20 rounded">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* 重置 */}
            <button onClick={seekToStart} className="p-1.5 text-white hover:bg-white/20 rounded">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 时间显示 */}
            <span className="text-xs text-white/80 ml-2 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 音量 */}
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="p-1.5 text-white hover:bg-white/20 rounded">
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-zinc-600 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* 播放速度 */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 text-white hover:bg-white/20 rounded"
              >
                <Settings className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 rounded-lg p-2 shadow-lg">
                  <p className="text-xs text-zinc-400 mb-1">播放速度</p>
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`block w-full px-3 py-1 text-sm text-left rounded ${
                        playbackRate === rate ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 全屏 */}
            <button onClick={toggleFullscreen} className="p-1.5 text-white hover:bg-white/20 rounded">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 帧信息 */}
      {showControls && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white/80">
          帧 {Math.floor(currentTime * fps) + 1} / {Math.floor(duration * fps)}
        </div>
      )}
    </div>
  );
}

// ============ 辅助函数 ============

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default VideoPlayer;
