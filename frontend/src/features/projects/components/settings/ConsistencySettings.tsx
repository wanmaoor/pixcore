/**
 * 一致性设定组件
 * 项目级别的一致性锁定设置面板
 */

import { useState } from 'react';
import { User, Palette, Globe, Package, Lock, Info } from 'lucide-react';
import { ConsistencyLockCard, LockedAsset } from './ConsistencyLockCard';
import { AssetSelectorModal } from './AssetSelectorModal';

export interface ConsistencySettings {
  lock_character: boolean;
  lock_style: boolean;
  lock_world: boolean;
  lock_key_object: boolean;
  locked_characters: LockedAsset[];
  locked_styles: LockedAsset[];
  locked_worlds: LockedAsset[];
  locked_key_objects: LockedAsset[];
}

interface Asset {
  id: number;
  name: string;
  description: string | null;
  reference_images: string[];
  type: string;
  is_archived: boolean;
}

interface ConsistencySettingsProps {
  settings: ConsistencySettings;
  assets: Asset[];
  onSettingsChange: (updates: Partial<ConsistencySettings>) => void;
  onAssetIdsChange: (lockType: string, assetIds: number[]) => void;
}

const lockTypes = [
  {
    key: 'character',
    lockKey: 'lock_character',
    assetsKey: 'locked_characters',
    label: '角色一致性',
    description: '锁定角色外观，确保所有镜头中角色形象一致',
    icon: User,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'style',
    lockKey: 'lock_style',
    assetsKey: 'locked_styles',
    label: '风格一致性',
    description: '锁定视觉风格，保持画面风格统一',
    icon: Palette,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'world',
    lockKey: 'lock_world',
    assetsKey: 'locked_worlds',
    label: '世界观一致性',
    description: '锁定场景设定，确保环境元素一致',
    icon: Globe,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    key: 'key_object',
    lockKey: 'lock_key_object',
    assetsKey: 'locked_key_objects',
    label: '核心道具一致性',
    description: '锁定关键道具，保持道具外观一致',
    icon: Package,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
] as const;

export function ConsistencySettingsPanel({
  settings,
  assets,
  onSettingsChange,
  onAssetIdsChange,
}: ConsistencySettingsProps) {
  const [selectorModal, setSelectorModal] = useState<{
    isOpen: boolean;
    lockType: 'character' | 'style' | 'world' | 'key_object';
  }>({
    isOpen: false,
    lockType: 'character',
  });

  const handleToggle = (lockKey: string, locked: boolean) => {
    onSettingsChange({ [lockKey]: locked });
  };

  const handleAddAsset = (lockType: 'character' | 'style' | 'world' | 'key_object') => {
    setSelectorModal({ isOpen: true, lockType });
  };

  const handleRemoveAsset = (lockType: string, assetId: number) => {
    const typeConfig = lockTypes.find((t) => t.key === lockType);
    if (!typeConfig) return;

    const currentAssets = settings[typeConfig.assetsKey] as LockedAsset[];
    const newAssetIds = currentAssets
      .filter((a) => a.id !== assetId)
      .map((a) => a.id);

    onAssetIdsChange(lockType, newAssetIds);
  };

  const handleSelectorConfirm = (assetIds: number[]) => {
    onAssetIdsChange(selectorModal.lockType, assetIds);
  };

  const getSelectedAssetIds = (lockType: string): number[] => {
    const typeConfig = lockTypes.find((t) => t.key === lockType);
    if (!typeConfig) return [];
    return (settings[typeConfig.assetsKey] as LockedAsset[]).map((a) => a.id);
  };

  return (
    <div className="space-y-4">
      {/* 说明文字 */}
      <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-zinc-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-zinc-200">什么是一致性锁定？</h4>
            <p className="text-sm text-zinc-500 mt-1">
              启用一致性锁定后，AI 生成新镜头时会自动参考已锁定的资产设定，
              确保角色外观、画面风格、场景环境等元素在整个项目中保持一致。
            </p>
          </div>
        </div>
      </div>

      {/* 四类一致性锁定卡片 */}
      <div className="space-y-3">
        {lockTypes.map((type) => (
          <ConsistencyLockCard
            key={type.key}
            type={type.key}
            label={type.label}
            description={type.description}
            icon={type.icon}
            color={type.color}
            bgColor={type.bgColor}
            isLocked={settings[type.lockKey]}
            lockedAssets={settings[type.assetsKey]}
            onToggle={(locked) => handleToggle(type.lockKey, locked)}
            onAddAsset={() => handleAddAsset(type.key as any)}
            onRemoveAsset={(assetId) => handleRemoveAsset(type.key, assetId)}
          />
        ))}
      </div>

      {/* 提示信息 */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          提示：锁定的资产描述会自动注入到每个镜头的生成提示词中。
          建议为资产添加详细的外观描述以获得最佳效果。
        </p>
      </div>

      {/* 资产选择弹窗 */}
      <AssetSelectorModal
        isOpen={selectorModal.isOpen}
        onClose={() => setSelectorModal({ ...selectorModal, isOpen: false })}
        assetType={selectorModal.lockType}
        assets={assets}
        selectedAssetIds={getSelectedAssetIds(selectorModal.lockType)}
        onConfirm={handleSelectorConfirm}
      />
    </div>
  );
}
