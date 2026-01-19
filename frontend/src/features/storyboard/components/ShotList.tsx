import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clapperboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStoryboardStore } from '../stores/storyboardStore';
import { shotApi } from '../../../lib/api';
import { SortableShotItem } from './SortableShotItem';

/**
 * ✅ 优化后的镜头列表组件
 * - 使用 useCallback 稳定化回调函数
 * - 子组件使用 React.memo 避免不必要的重渲染
 */
export const ShotList: React.FC = () => {
  const { t } = useTranslation();
  const { shots, selectedShotId, setSelectedShotId, addShot, deleteShot, reorderShots } = useStoryboardStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ✅ 使用 useCallback 避免每次渲染创建新函数
  const handleAddShot = useCallback(async () => {
    try {
      // 获取当前场景 ID（假设第一个场景）
      const sceneId = shots[0]?.scene_id || 1;
      const newShot = await shotApi.create(sceneId, { prompt: '' });
      addShot(newShot);
      setSelectedShotId(newShot.id);
      toast.success('Shot added successfully');
    } catch (error) {
      toast.error('Failed to add shot');
      console.error(error);
    }
  }, [shots, addShot, setSelectedShotId]);

  const handleDeleteShot = useCallback(
    async (e: React.MouseEvent, id: number) => {
      e.stopPropagation(); // Prevent selection when clicking delete
      if (!confirm(t('common.delete') + '?')) return;

      try {
        await shotApi.delete(id);
        deleteShot(id);
        toast.success('Shot deleted');
      } catch (error) {
        toast.error('Failed to delete shot');
        console.error(error);
      }
    },
    [deleteShot, t]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = shots.findIndex((shot) => shot.id === active.id);
        const newIndex = shots.findIndex((shot) => shot.id === over?.id);

        const newShots = arrayMove(shots, oldIndex, newIndex).map((shot, index) => ({
          ...shot,
          order: index + 1, // Re-calculate order based on new position
        }));

        // Optimistic update
        reorderShots(newShots);

        // API Call - 使用当前项目 ID
        const projectId = 1; // TODO: 从 context 或 store 获取
        shotApi.reorder(projectId, newShots.map((s) => s.id)).catch((err) => {
          console.error('Failed to reorder', err);
          toast.error('Failed to save order');
        });
      }
    },
    [shots, reorderShots]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          {t('storyboard.shots')}
        </h2>
        <button
          onClick={handleAddShot}
          className="p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
          title={t('storyboard.add_shot')}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {shots.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={shots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {shots.map((shot) => (
                <SortableShotItem
                  key={shot.id}
                  shot={shot}
                  isSelected={selectedShotId === shot.id}
                  onSelect={setSelectedShotId}
                  onDelete={handleDeleteShot}
                  t={t}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <Clapperboard className="w-8 h-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground">{t('storyboard.no_shots')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
