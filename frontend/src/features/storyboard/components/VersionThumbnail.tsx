import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { Version } from '../../../lib/api-client';

interface VersionThumbnailProps {
  version: Version;
  isActive: boolean;
  onClick: (id: number) => void;
}

/**
 * ✅ 使用 React.memo 优化的版本缩略图组件
 * 只有当 version.id 或 isActive 改变时才重新渲染
 */
export const VersionThumbnail = memo<VersionThumbnailProps>(
  ({ version, isActive, onClick }) => {
    return (
      <button
        onClick={() => onClick(version.id)}
        className={`
          relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden border-2 transition-all
          ${isActive ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/30'}
        `}
      >
        <img
          src={version.thumb_url || version.url}
          alt={`v${version.id}`}
          loading="lazy" // ✅ 懒加载
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] text-white font-mono">
          v{version.id}
        </div>
        {version.is_primary && (
          <div className="absolute top-1 right-1 p-0.5 bg-green-500 rounded-full">
            <Check className="w-2 h-2 text-white" />
          </div>
        )}
      </button>
    );
  },
  // ✅ 自定义比较：只有这些属性变化时才重新渲染
  (prevProps, nextProps) =>
    prevProps.version.id === nextProps.version.id &&
    prevProps.isActive === nextProps.isActive
);

VersionThumbnail.displayName = 'VersionThumbnail';
