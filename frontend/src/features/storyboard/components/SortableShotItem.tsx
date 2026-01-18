import { memo } from 'react';
import { CheckCircle2, Clock, AlertCircle, Trash2, GripVertical, Clapperboard } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shot } from '../../../lib/api-client';

interface SortableShotItemProps {
  shot: Shot;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  t: (key: string) => string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'generating':
      return <Clock className="w-3 h-3 text-blue-500 animate-pulse" />;
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    default:
      return <Clock className="w-3 h-3 text-muted-foreground" />;
  }
};

/**
 * ✅ 使用 React.memo 优化的可排序镜头项组件
 * 只有当 shot.id 或 isSelected 改变时才重新渲染
 */
export const SortableShotItem = memo<SortableShotItemProps>(
  ({ shot, isSelected, onSelect, onDelete, t }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: shot.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => onSelect(shot.id)}
        className={`
          w-full text-left p-3 rounded-lg border transition-all group relative select-none
          ${
            isSelected
              ? 'bg-primary/5 border-primary shadow-sm'
              : 'bg-card border-border/50 hover:border-border hover:bg-secondary/30'
          }
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground/50 hover:text-foreground active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4" />
            </div>

            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              {shot.order.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {getStatusIcon(shot.status)}
            {/* Delete Button (visible on hover or selected) */}
            <button
              onClick={(e) => onDelete(e, shot.id)}
              className={`
                p-1 rounded hover:bg-destructive hover:text-destructive-foreground transition-colors
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}
              title={t('common.delete')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="text-xs line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed pl-6">
          {shot.prompt || t('storyboard.no_prompt')}
        </p>

        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 pl-6">
          <span className="flex items-center gap-1">
            <Clapperboard className="w-3 h-3" />
            {shot.shot_type || 'N/A'}
          </span>
          <span>•</span>
          <span>{shot.duration}s</span>
        </div>
      </div>
    );
  },
  // ✅ 自定义比较函数：只有当这些属性变化时才重新渲染
  (prevProps, nextProps) =>
    prevProps.shot.id === nextProps.shot.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.shot.status === nextProps.shot.status &&
    prevProps.shot.prompt === nextProps.shot.prompt &&
    prevProps.shot.order === nextProps.shot.order
);

SortableShotItem.displayName = 'SortableShotItem';
