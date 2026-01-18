/**
 * 资产库组件
 * 包含资产卡片流、类型切换、详情面板、删除保护等功能
 */

import { useState, useCallback } from 'react';
import {
  User,
  Palette,
  MapPin,
  Package,
  Plus,
  Search,
  Grid,
  List,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Archive,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';

// ============ 类型定义 ============

export type AssetType = 'character' | 'scene' | 'style' | 'key_object';

export interface Asset {
  id: number;
  projectId: number;
  type: AssetType;
  name: string;
  description: string;
  referenceImages: string[];
  meta: Record<string, unknown>;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetReference {
  shotId: number;
  shotOrder: number;
  sceneName: string;
}

interface AssetLibraryProps {
  assets: Asset[];
  onCreateAsset: (type: AssetType) => void;
  onUpdateAsset: (assetId: number, data: Partial<Asset>) => void;
  onDeleteAsset: (assetId: number) => Promise<{ canDelete: boolean; references?: AssetReference[] }>;
  onArchiveAsset: (assetId: number) => void;
  className?: string;
}

// ============ 资产类型配置 ============

const assetTypeConfig: Record<AssetType, { label: string; icon: typeof User; color: string }> = {
  character: { label: '角色', icon: User, color: 'text-blue-400' },
  scene: { label: '场景', icon: MapPin, color: 'text-green-400' },
  style: { label: '风格', icon: Palette, color: 'text-purple-400' },
  key_object: { label: '道具', icon: Package, color: 'text-orange-400' },
};

// ============ 主组件 ============

export function AssetLibrary({
  assets,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
  onArchiveAsset,
  className = '',
}: AssetLibraryProps) {
  const [activeType, setActiveType] = useState<AssetType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    asset: Asset;
    references: AssetReference[];
  } | null>(null);

  // 筛选资产
  const filteredAssets = assets.filter((asset) => {
    // 类型筛选
    if (activeType !== 'all' && asset.type !== activeType) return false;
    // 归档筛选
    if (!showArchived && asset.isArchived) return false;
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // 按类型统计
  const typeCounts = assets.reduce(
    (acc, asset) => {
      if (!asset.isArchived) {
        acc[asset.type] = (acc[asset.type] || 0) + 1;
        acc.all = (acc.all || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // 处理删除
  const handleDelete = useCallback(
    async (asset: Asset) => {
      const result = await onDeleteAsset(asset.id);
      if (result.canDelete) {
        // 可以直接删除
        setSelectedAsset(null);
      } else if (result.references) {
        // 有引用，显示删除保护对话框
        setDeleteDialog({ asset, references: result.references });
      }
    },
    [onDeleteAsset]
  );

  return (
    <div className={`flex h-full bg-zinc-950 ${className}`}>
      {/* 左侧：资产列表 */}
      <div className="flex-1 flex flex-col border-r border-zinc-800">
        {/* 工具栏 */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">资产库</h2>
            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <div className="flex bg-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* 新建按钮 */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg">
                  <Plus className="w-4 h-4" />
                  新建
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  {(Object.keys(assetTypeConfig) as AssetType[]).map((type) => {
                    const config = assetTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => onCreateAsset(type)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="搜索资产..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-zinc-600"
              />
              显示已归档
            </label>
          </div>
        </div>

        {/* 类型标签页 */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveType('all')}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeType === 'all'
                ? 'text-white border-blue-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            全部 ({typeCounts.all || 0})
          </button>
          {(Object.keys(assetTypeConfig) as AssetType[]).map((type) => {
            const config = assetTypeConfig[type];
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                  activeType === type
                    ? 'text-white border-blue-500'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
              >
                {config.label} ({typeCounts[type] || 0})
              </button>
            );
          })}
        </div>

        {/* 资产列表 */}
        <div className="flex-1 overflow-auto p-4">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p>暂无资产</p>
              <button
                onClick={() => onCreateAsset(activeType === 'all' ? 'character' : activeType)}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                创建第一个资产
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  onDelete={() => handleDelete(asset)}
                  onArchive={() => onArchiveAsset(asset.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAsset?.id === asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  onDelete={() => handleDelete(asset)}
                  onArchive={() => onArchiveAsset(asset.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：详情面板 */}
      {selectedAsset && (
        <AssetDetailPanel
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdate={(data) => onUpdateAsset(selectedAsset.id, data)}
          onDelete={() => handleDelete(selectedAsset)}
          onArchive={() => onArchiveAsset(selectedAsset.id)}
        />
      )}

      {/* 删除保护对话框 */}
      {deleteDialog && (
        <DeleteProtectionDialog
          asset={deleteDialog.asset}
          references={deleteDialog.references}
          onClose={() => setDeleteDialog(null)}
          onArchive={() => {
            onArchiveAsset(deleteDialog.asset.id);
            setDeleteDialog(null);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}

// ============ 资产卡片 ============

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

function AssetCard({ asset, isSelected, onClick, onDelete, onArchive }: AssetCardProps) {
  const config = assetTypeConfig[asset.type];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-zinc-800 hover:border-zinc-700'
      } ${asset.isArchived ? 'opacity-50' : ''}`}
    >
      {/* 缩略图 */}
      <div className="aspect-square bg-zinc-900">
        {asset.referenceImages.length > 0 ? (
          <img
            src={asset.referenceImages[0]}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Icon className={`w-12 h-12 ${config.color} opacity-30`} />
          </div>
        )}
      </div>

      {/* 类型标签 */}
      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs ${config.color} bg-zinc-900/80`}>
        {config.label}
      </div>

      {/* 归档标签 */}
      {asset.isArchived && (
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-900/80">
          已归档
        </div>
      )}

      {/* 信息 */}
      <div className="p-3 bg-zinc-900">
        <h3 className="font-medium text-zinc-100 truncate">{asset.name}</h3>
        <p className="text-xs text-zinc-500 truncate mt-1">{asset.description || '无描述'}</p>
      </div>

      {/* 操作菜单 */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1 bg-zinc-900/80 rounded hover:bg-zinc-800">
          <MoreHorizontal className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

// ============ 资产列表项 ============

interface AssetListItemProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onArchive: () => void;
}

function AssetListItem({ asset, isSelected, onClick, onDelete, onArchive }: AssetListItemProps) {
  const config = assetTypeConfig[asset.type];
  const Icon = config.icon;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-900/30 border border-blue-500' : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
      } ${asset.isArchived ? 'opacity-50' : ''}`}
    >
      {/* 图标 */}
      <div className={`p-2 rounded-lg bg-zinc-800 ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-zinc-100 truncate">{asset.name}</h3>
        <p className="text-xs text-zinc-500 truncate">{asset.description || '无描述'}</p>
      </div>

      {/* 标签 */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded text-xs ${config.color} bg-zinc-800`}>
          {config.label}
        </span>
        {asset.isArchived && (
          <span className="px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-800">
            已归档
          </span>
        )}
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============ 详情面板 ============

interface AssetDetailPanelProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (data: Partial<Asset>) => void;
  onDelete: () => void;
  onArchive: () => void;
}

function AssetDetailPanel({ asset, onClose, onUpdate, onDelete, onArchive }: AssetDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: asset.name, description: asset.description });
  const config = assetTypeConfig[asset.type];
  const Icon = config.icon;

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h3 className="font-medium text-zinc-100">资产详情</h3>
        <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-4">
        {/* 预览图 */}
        <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden mb-4">
          {asset.referenceImages.length > 0 ? (
            <img
              src={asset.referenceImages[0]}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Icon className={`w-16 h-16 ${config.color} opacity-30`} />
            </div>
          )}
        </div>

        {/* 类型 */}
        <div className="flex items-center gap-2 mb-4">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm ${config.color}`}>{config.label}</span>
          {asset.isArchived && (
            <span className="px-2 py-0.5 rounded text-xs text-zinc-400 bg-zinc-800">已归档</span>
          )}
        </div>

        {/* 名称 */}
        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-1">名称</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          ) : (
            <p className="text-zinc-100">{asset.name}</p>
          )}
        </div>

        {/* 描述 */}
        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-1">描述</label>
          {isEditing ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          ) : (
            <p className="text-zinc-400 text-sm">{asset.description || '无描述'}</p>
          )}
        </div>

        {/* 参考图片 */}
        {asset.referenceImages.length > 1 && (
          <div className="mb-4">
            <label className="block text-xs text-zinc-500 mb-2">参考图片</label>
            <div className="grid grid-cols-3 gap-2">
              {asset.referenceImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`参考图 ${index + 1}`}
                  className="aspect-square object-cover rounded"
                />
              ))}
            </div>
          </div>
        )}

        {/* 元数据 */}
        <div className="text-xs text-zinc-500 space-y-1">
          <p>创建时间: {new Date(asset.createdAt).toLocaleString()}</p>
          <p>更新时间: {new Date(asset.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="p-4 border-t border-zinc-800">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
            >
              保存
            </button>
            <button
              onClick={() => {
                setEditData({ name: asset.name, description: asset.description });
                setIsEditing(false);
              }}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
            <button
              onClick={onArchive}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg"
              title="归档"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 rounded-lg"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 删除保护对话框 ============

interface DeleteProtectionDialogProps {
  asset: Asset;
  references: AssetReference[];
  onClose: () => void;
  onArchive: () => void;
}

function DeleteProtectionDialog({ asset, references, onClose, onArchive }: DeleteProtectionDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-[480px] bg-zinc-900 rounded-xl shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
          <div className="p-2 bg-yellow-900/50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100">无法删除资产</h3>
            <p className="text-sm text-zinc-500">该资产正在被使用中</p>
          </div>
        </div>

        {/* 内容 */}
        <div className="p-4">
          <p className="text-sm text-zinc-300 mb-4">
            资产 <span className="font-medium text-zinc-100">"{asset.name}"</span> 被以下 {references.length} 个镜头引用，无法直接删除：
          </p>

          <div className="max-h-48 overflow-auto bg-zinc-950 rounded-lg border border-zinc-800">
            {references.map((ref, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 last:border-b-0"
              >
                <span className="text-sm text-zinc-300">
                  {ref.sceneName} - 镜头 #{ref.shotOrder}
                </span>
                <button className="text-xs text-blue-400 hover:text-blue-300">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-zinc-500 mt-4">
            您可以选择将资产归档，归档后的资产不会在列表中显示，但已使用该资产的镜头仍可正常工作。
          </p>
        </div>

        {/* 操作 */}
        <div className="flex justify-end gap-3 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            onClick={onArchive}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg"
          >
            <Archive className="w-4 h-4" />
            归档资产
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssetLibrary;
