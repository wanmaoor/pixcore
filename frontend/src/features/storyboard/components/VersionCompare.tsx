/**
 * 版本对比视图组件
 * 支持 2/3/4 格对比、同步播放、滑动对比等功能
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Grid2X2, Grid3X3, Columns, Check, X, Play, Pause, RefreshCw } from 'lucide-react';
import { VideoPlayer } from '../../components/VideoPlayer';

interface Version {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbUrl?: string;
  createdAt: string;
  isPrimary?: boolean;
}

interface VersionCompareProps {
  versions: Version[];
  onSetPrimary?: (versionId: number) => void;
  onDelete?: (versionId: number) => void;
  className?: string;
}

type GridLayout = 2 | 3 | 4;
type CompareMode = 'grid' | 'slider' | 'overlay';

export function VersionCompare({
  versions,
  onSetPrimary,
  onDelete,
  className = '',
}: VersionCompareProps) {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [gridLayout, setGridLayout] = useState<GridLayout>(2);
  const [compareMode, setCompareMode] = useState<CompareMode>('grid');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [syncPlayback, setSyncPlayback] = useState(true);

  // 选择版本进行对比
  const toggleVersionSelection = useCallback((versionId: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length >= gridLayout) {
        return [...prev.slice(1), versionId];
      }
      return [...prev, versionId];
    });
  }, [gridLayout]);

  // 获取选中的版本对象
  const selectedVersionObjects = versions.filter((v) => selectedVersions.includes(v.id));

  // 自动选择前 N 个版本
  useEffect(() => {
    if (selectedVersions.length === 0 && versions.length > 0) {
      const initialSelection = versions.slice(0, Math.min(gridLayout, versions.length)).map((v) => v.id);
      setSelectedVersions(initialSelection);
    }
  }, [versions, gridLayout, selectedVersions.length]);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">对比模式</span>

          {/* 网格布局选择 */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setGridLayout(2)}
              className={`p-1.5 rounded ${gridLayout === 2 ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="2格对比"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridLayout(3)}
              className={`p-1.5 rounded ${gridLayout === 3 ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="3格对比"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGridLayout(4)}
              className={`p-1.5 rounded ${gridLayout === 4 ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              title="4格对比"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* 对比模式选择 */}
          {selectedVersionObjects.length === 2 && (
            <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 ml-2">
              <button
                onClick={() => setCompareMode('grid')}
                className={`px-2 py-1 text-xs rounded ${compareMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                并排
              </button>
              <button
                onClick={() => setCompareMode('slider')}
                className={`px-2 py-1 text-xs rounded ${compareMode === 'slider' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                滑动
              </button>
              <button
                onClick={() => setCompareMode('overlay')}
                className={`px-2 py-1 text-xs rounded ${compareMode === 'overlay' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                叠加
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 同步播放开关 */}
          {selectedVersionObjects.some((v) => v.type === 'video') && (
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={syncPlayback}
                onChange={(e) => setSyncPlayback(e.target.checked)}
                className="rounded border-zinc-600"
              />
              同步播放
            </label>
          )}

          {/* 清除选择 */}
          <button
            onClick={() => setSelectedVersions([])}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded"
            title="清除选择"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex">
        {/* 版本选择列表 */}
        <div className="w-48 border-r border-zinc-800 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-zinc-500 mb-2">选择版本对比 (最多 {gridLayout} 个)</p>
            <div className="space-y-2">
              {versions.map((version) => (
                <VersionSelectItem
                  key={version.id}
                  version={version}
                  isSelected={selectedVersions.includes(version.id)}
                  onToggle={() => toggleVersionSelection(version.id)}
                  onSetPrimary={onSetPrimary}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 对比视图 */}
        <div className="flex-1 p-4">
          {selectedVersionObjects.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500">
              请从左侧选择版本进行对比
            </div>
          ) : selectedVersionObjects.length === 2 && compareMode === 'slider' ? (
            <SliderCompare
              leftVersion={selectedVersionObjects[0]}
              rightVersion={selectedVersionObjects[1]}
              position={sliderPosition}
              onPositionChange={setSliderPosition}
            />
          ) : selectedVersionObjects.length === 2 && compareMode === 'overlay' ? (
            <OverlayCompare
              versions={selectedVersionObjects}
            />
          ) : (
            <GridCompare
              versions={selectedVersionObjects}
              layout={gridLayout}
              syncPlayback={syncPlayback}
              onSetPrimary={onSetPrimary}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 版本选择项 ============

interface VersionSelectItemProps {
  version: Version;
  isSelected: boolean;
  onToggle: () => void;
  onSetPrimary?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function VersionSelectItem({
  version,
  isSelected,
  onToggle,
  onSetPrimary,
  onDelete,
}: VersionSelectItemProps) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
        isSelected ? 'border-blue-500' : 'border-transparent hover:border-zinc-700'
      }`}
      onClick={onToggle}
    >
      {/* 缩略图 */}
      <div className="aspect-video bg-zinc-800">
        {version.type === 'image' ? (
          <img
            src={version.thumbUrl || version.url}
            alt={`版本 ${version.id}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={version.url}
            className="w-full h-full object-cover"
            muted
          />
        )}
      </div>

      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-1 right-1 p-0.5 bg-blue-500 rounded-full">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* 主版本标记 */}
      {version.isPrimary && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-600 rounded text-xs text-white">
          主版本
        </div>
      )}

      {/* 版本信息 */}
      <div className="p-1.5 bg-zinc-900">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">V{version.id}</span>
          <div className="flex items-center gap-1">
            {onSetPrimary && !version.isPrimary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetPrimary(version.id);
                }}
                className="p-0.5 text-zinc-500 hover:text-green-400"
                title="设为主版本"
              >
                <Check className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(version.id);
                }}
                className="p-0.5 text-zinc-500 hover:text-red-400"
                title="删除"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 网格对比 ============

interface GridCompareProps {
  versions: Version[];
  layout: GridLayout;
  syncPlayback: boolean;
  onSetPrimary?: (id: number) => void;
}

function GridCompare({ versions, layout, syncPlayback, onSetPrimary }: GridCompareProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const togglePlay = useCallback(() => {
    if (syncPlayback) {
      videoRefs.current.forEach((video) => {
        if (video) {
          if (isPlaying) {
            video.pause();
          } else {
            video.play();
          }
        }
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, syncPlayback]);

  const gridCols = layout === 2 ? 'grid-cols-2' : layout === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const gridRows = layout === 4 ? 'grid-rows-2' : '';

  return (
    <div className="h-full flex flex-col">
      {/* 同步播放控制 */}
      {syncPlayback && versions.some((v) => v.type === 'video') && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? '暂停全部' : '播放全部'}
          </button>
        </div>
      )}

      {/* 网格 */}
      <div className={`flex-1 grid ${gridCols} ${gridRows} gap-4`}>
        {versions.map((version, index) => (
          <div
            key={version.id}
            className="relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800"
          >
            {/* 版本标签 */}
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
              <span className="px-2 py-1 bg-black/60 rounded text-xs text-white">
                V{version.id}
              </span>
              {version.isPrimary && (
                <span className="px-2 py-1 bg-green-600/80 rounded text-xs text-white">
                  主版本
                </span>
              )}
            </div>

            {/* 设为主版本按钮 */}
            {onSetPrimary && !version.isPrimary && (
              <button
                onClick={() => onSetPrimary(version.id)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 hover:bg-green-600 rounded text-white transition-colors"
                title="设为主版本"
              >
                <Check className="w-4 h-4" />
              </button>
            )}

            {/* 内容 */}
            {version.type === 'image' ? (
              <img
                src={version.url}
                alt={`版本 ${version.id}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <VideoPlayer
                src={version.url}
                className="w-full h-full"
                autoPlay={false}
                loop
                muted
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ 滑动对比 ============

interface SliderCompareProps {
  leftVersion: Version;
  rightVersion: Version;
  position: number;
  onPositionChange: (position: number) => void;
}

function SliderCompare({
  leftVersion,
  rightVersion,
  position,
  onPositionChange,
}: SliderCompareProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onPositionChange(percentage);
    },
    [isDragging, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative h-full rounded-lg overflow-hidden cursor-ew-resize"
    >
      {/* 右侧图片（底层） */}
      <div className="absolute inset-0">
        {rightVersion.type === 'image' ? (
          <img src={rightVersion.url} alt="右侧版本" className="w-full h-full object-contain" />
        ) : (
          <video src={rightVersion.url} className="w-full h-full object-contain" autoPlay loop muted />
        )}
      </div>

      {/* 左侧图片（裁剪层） */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {leftVersion.type === 'image' ? (
          <img
            src={leftVersion.url}
            alt="左侧版本"
            className="h-full object-contain"
            style={{ width: containerRef.current?.offsetWidth }}
          />
        ) : (
          <video
            src={leftVersion.url}
            className="h-full object-contain"
            style={{ width: containerRef.current?.offsetWidth }}
            autoPlay
            loop
            muted
          />
        )}
      </div>

      {/* 滑动手柄 */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-zinc-400 rounded" />
            <div className="w-0.5 h-4 bg-zinc-400 rounded" />
          </div>
        </div>
      </div>

      {/* 版本标签 */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
        V{leftVersion.id}
      </div>
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
        V{rightVersion.id}
      </div>
    </div>
  );
}

// ============ 叠加对比 ============

interface OverlayCompareProps {
  versions: Version[];
}

function OverlayCompare({ versions }: OverlayCompareProps) {
  const [opacity, setOpacity] = useState(50);

  if (versions.length < 2) return null;

  const [baseVersion, overlayVersion] = versions;

  return (
    <div className="h-full flex flex-col">
      {/* 透明度控制 */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-sm text-zinc-400">V{baseVersion.id}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(e) => setOpacity(parseInt(e.target.value))}
          className="w-48"
        />
        <span className="text-sm text-zinc-400">V{overlayVersion.id}</span>
      </div>

      {/* 叠加显示 */}
      <div className="flex-1 relative rounded-lg overflow-hidden">
        {/* 底层 */}
        <div className="absolute inset-0">
          {baseVersion.type === 'image' ? (
            <img src={baseVersion.url} alt="底层版本" className="w-full h-full object-contain" />
          ) : (
            <video src={baseVersion.url} className="w-full h-full object-contain" autoPlay loop muted />
          )}
        </div>

        {/* 叠加层 */}
        <div className="absolute inset-0" style={{ opacity: opacity / 100 }}>
          {overlayVersion.type === 'image' ? (
            <img src={overlayVersion.url} alt="叠加版本" className="w-full h-full object-contain" />
          ) : (
            <video src={overlayVersion.url} className="w-full h-full object-contain" autoPlay loop muted />
          )}
        </div>
      </div>
    </div>
  );
}

export default VersionCompare;
