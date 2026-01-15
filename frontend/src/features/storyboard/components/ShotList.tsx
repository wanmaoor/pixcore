import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Clapperboard, CheckCircle2, Clock, AlertCircle, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi, Shot } from '../../../lib/api-client';

// --- Sortable Item Component ---
interface SortableShotItemProps {
    shot: Shot;
    isSelected: boolean;
    onSelect: (id: number) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
    getStatusIcon: (status: string) => React.ReactNode;
    t: (key: string) => string;
}

const SortableShotItem = ({ shot, isSelected, onSelect, onDelete, getStatusIcon, t }: SortableShotItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: shot.id });

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
                ${isSelected
                    ? 'bg-primary/5 border-primary shadow-sm'
                    : 'bg-card border-border/50 hover:border-border hover:bg-secondary/30'}
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
                    
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
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
};

// --- Main List Component ---
export const ShotList: React.FC = () => {
    const { t } = useTranslation();
    const { shots, selectedShotId, setSelectedShotId, addShot, deleteShot, reorderShots } = useStoryboardStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddShot = async () => {
        try {
            const newShot = await mockApi.createShot({});
            addShot(newShot);
            setSelectedShotId(newShot.id);
            toast.success('Shot added successfully');
        } catch (error) {
            toast.error('Failed to add shot');
            console.error(error);
        }
    };

    const handleDeleteShot = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent selection when clicking delete
        if (!confirm(t('common.delete') + '?')) return; // Simple confirmation

        try {
            await mockApi.deleteShot(id);
            deleteShot(id);
            toast.success('Shot deleted');
        } catch (error) {
            toast.error('Failed to delete shot');
            console.error(error);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = shots.findIndex((shot) => shot.id === active.id);
            const newIndex = shots.findIndex((shot) => shot.id === over?.id);

            const newShots = arrayMove(shots, oldIndex, newIndex).map((shot, index) => ({
                ...shot,
                order: index + 1 // Re-calculate order based on new position
            }));

            // Optimistic update
            reorderShots(newShots);

            // API Call
            mockApi.reorderShots(1, newShots.map(s => s.id))
                .catch(err => {
                    console.error('Failed to reorder', err);
                    toast.error('Failed to save order');
                    // Revert? For MVP we just show error
                });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
            case 'generating': return <Clock className="w-3 h-3 text-blue-500 animate-pulse" />;
            case 'failed': return <AlertCircle className="w-3 h-3 text-red-500" />;
            default: return <Clock className="w-3 h-3 text-muted-foreground" />;
        }
    };

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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={shots.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {shots.map((shot) => (
                                <SortableShotItem
                                    key={shot.id}
                                    shot={shot}
                                    isSelected={selectedShotId === shot.id}
                                    onSelect={setSelectedShotId}
                                    onDelete={handleDeleteShot}
                                    getStatusIcon={getStatusIcon}
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