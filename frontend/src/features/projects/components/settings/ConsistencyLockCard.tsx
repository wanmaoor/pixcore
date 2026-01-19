/**
 * 一致性锁定卡片组件
 * 显示单个类型的一致性锁定设置
 */

import { useState } from 'react';
import { Plus, X, Eye, RefreshCw, ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

export interface LockedAsset {
  id: number;
  name: string;
  description: string | null;
  reference_images: string[];
  type: string;
}

interface ConsistencyLockCardProps {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  isLocked: boolean;
  lockedAssets: LockedAsset[];
  onToggle: (locked: boolean) => void;
  onAddAsset: () => void;
  onRemoveAsset: (assetId: number) => void;
  onViewAsset?: (asset: LockedAsset) => void;
}

export function ConsistencyLockCard({
  type,
  label,
  description,
  icon: Icon,
  color,
  bgColor,
  isLocked,
  lockedAssets,
  onToggle,
  onAddAsset,
  onRemoveAsset,
  onViewAsset,
}: ConsistencyLockCardProps) {
  const [isExpanded, setIsExpanded] = useState(isLocked && lockedAssets.length > 0);

  return (
    <div
      className={`rounded-lg border transition-all ${
        isLocked
          ? 'border-zinc-700 bg-zinc-900'
          : 'border-zinc-800 bg-zinc-900/50'
      }`}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-medium text-zinc-100">{label}</h3>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 已锁定资产数量 */}
          {isLocked && lockedAssets.length > 0 && (
            <span className="text-xs text-zinc-500">
              {lockedAssets.length} 个资产
            </span>
          )}

          {/* 锁定开关 */}
          <button
            onClick={() => onToggle(!isLocked)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isLocked ? 'bg-blue-600' : 'bg-zinc-700'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isLocked ? 'left-7' : 'left-1'
              }`}
            />
          </button>

          {/* 展开/收起 */}
          {isLocked && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-zinc-500 hover:text-zinc-300"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 展开内容 */}
      {isLocked && isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-4">
          {lockedAssets.length > 0 ? (
            <div className="space-y-2">
              {lockedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg"
                >
                  {/* 缩略图 */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                    {asset.reference_images?.[0] ? (
                      <img
                        src={asset.reference_images[0]}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className={`w-6 h-6 ${color} opacity-50`} />
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 truncate">
                      {asset.name}
                    </h4>
                    <p className="text-xs text-zinc-500 truncate">
                      {asset.description || '无描述'}
                    </p>
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-1">
                    {onViewAsset && (
                      <button
                        onClick={() => onViewAsset(asset)}
                        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveAsset(asset.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded"
                      title="移除"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* 添加更多 */}
              <button
                onClick={onAddAsset}
                className="flex items-center gap-2 w-full p-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">添加更多{label.replace('一致性', '')}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onAddAsset}
              className="flex flex-col items-center justify-center w-full p-6 border border-dashed border-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="text-sm">选择要锁定的{label.replace('一致性', '')}资产</span>
              <span className="text-xs mt-1">从资产库中选择或创建新资产</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
