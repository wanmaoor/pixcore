/**
 * 资产选择弹窗组件
 * 用于从资产库中选择要锁定的资产
 */

import { useState, useMemo } from 'react';
import { X, Search, Check, User, Palette, Globe, Package } from 'lucide-react';
import { LockedAsset } from './ConsistencyLockCard';

interface Asset {
  id: number;
  name: string;
  description: string | null;
  reference_images: string[];
  type: string;
  is_archived: boolean;
}

interface AssetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: 'character' | 'style' | 'world' | 'key_object';
  assets: Asset[];
  selectedAssetIds: number[];
  onConfirm: (assetIds: number[]) => void;
}

const typeConfig = {
  character: { label: '角色', icon: User, color: 'text-blue-400' },
  style: { label: '风格', icon: Palette, color: 'text-purple-400' },
  world: { label: '场景', icon: Globe, color: 'text-green-400' },
  key_object: { label: '道具', icon: Package, color: 'text-orange-400' },
};

export function AssetSelectorModal({
  isOpen,
  onClose,
  assetType,
  assets,
  selectedAssetIds,
  onConfirm,
}: AssetSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<number[]>(selectedAssetIds);

  const config = typeConfig[assetType];
  const Icon = config.icon;

  // 筛选当前类型的资产
  const filteredAssets = useMemo(() => {
    // Map asset type: world -> scene in asset type
    const targetType = assetType === 'world' ? 'scene' : assetType;

    return assets.filter((asset) => {
      if (asset.type !== targetType) return false;
      if (asset.is_archived) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(query) ||
          (asset.description?.toLowerCase().includes(query) ?? false)
        );
      }
      return true;
    });
  }, [assets, assetType, searchQuery]);

  const handleToggle = (assetId: number) => {
    setSelected((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[560px] max-h-[80vh] bg-zinc-900 rounded-xl shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-zinc-800`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100">选择{config.label}资产</h3>
              <p className="text-sm text-zinc-500">
                已选择 {selected.length} 个资产
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={`搜索${config.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* 资产列表 */}
        <div className="flex-1 overflow-auto p-4">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Icon className="w-12 h-12 mb-3 opacity-30" />
              <p>暂无可用的{config.label}资产</p>
              <p className="text-sm mt-1">请先在资产库中创建{config.label}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selected.includes(asset.id);
                return (
                  <button
                    key={asset.id}
                    onClick={() => handleToggle(asset.id)}
                    className={`relative flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-800 bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* 缩略图 */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                      {asset.reference_images?.[0] ? (
                        <img
                          src={asset.reference_images[0]}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className={`w-6 h-6 ${config.color} opacity-50`} />
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-200 truncate">
                        {asset.name}
                      </h4>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                        {asset.description || '无描述'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-3 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
          >
            确认选择 ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}
