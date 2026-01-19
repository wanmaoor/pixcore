import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2, Info, Layout, Camera, Move, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStoryboardStore } from '../stores/storyboardStore';
import { shotApi, generationApi } from '../../../lib/api';
import type { Shot } from '../../../lib/api-client';

export const EditPanel: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { selectedShotId, shots, updateShot } = useStoryboardStore();
    const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

    // Sync local state when selectedShotId changes
    useEffect(() => {
        if (selectedShotId) {
            const shot = shots.find(s => s.id === selectedShotId);
            if (shot) setSelectedShot(shot);
        }
    }, [selectedShotId, shots]);

    const mutation = useMutation({
        mutationFn: (shotId: number) => {
            const shot = shots.find(s => s.id === shotId);
            if (!shot) throw new Error('Shot not found');
            return generationApi.textToImage({
                shot_id: shotId,
                prompt: shot.prompt,
                negative_prompt: shot.negative_prompt || undefined,
            });
        },
        onSuccess: (_, shotId) => {
            queryClient.invalidateQueries({ queryKey: ['versions', shotId] });
            handleUpdate('status', 'completed');
            toast.success('Generation task submitted');
        },
        onError: () => {
             handleUpdate('status', 'failed');
             toast.error('Generation failed');
        }
    });

    // Handle field updates
    const handleUpdate = async (field: keyof Shot, value: any) => {
        if (!selectedShot) return;

        // Optimistic update local state
        const updatedShot = { ...selectedShot, [field]: value };
        setSelectedShot(updatedShot);

        // Update store and backend
        try {
            updateShot(selectedShot.id, { [field]: value });
            await shotApi.update(selectedShot.id, { [field]: value });
        } catch (error) {
            console.error('Failed to update shot', error);
            toast.error('Failed to save changes');
        }
    };

    const handleGenerate = () => {
        if (!selectedShot) return;
        handleUpdate('status', 'generating');
        mutation.mutate(selectedShot.id);
    };

    const isGenerating = mutation.isPending;

    if (!selectedShot) return (
        <div className="h-full flex items-center justify-center p-8 text-center opacity-30">
            <p className="text-sm">{t('storyboard.select_shot_to_edit') || 'Select a shot to edit'}</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-card">
            <div className="p-4 border-b flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    {t('storyboard.parameters')}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Prompt Section */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight flex items-center gap-1.5">
                        {t('storyboard.prompt')}
                    </label>
                    <textarea
                        className="w-full h-32 rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none leading-relaxed"
                        placeholder={t('storyboard.prompt_placeholder')}
                        value={selectedShot.prompt}
                        onChange={(e) => handleUpdate('prompt', e.target.value)}
                    />
                </div>

                {/* Shot Language / Technical Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight flex items-center gap-1.5">
                            <Layout className="w-3 h-3" /> {t('storyboard.shot')}
                        </label>
                        <select 
                            className="w-full bg-background border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/10"
                            value={selectedShot.shot_type || ''}
                            onChange={(e) => handleUpdate('shot_type', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Close Up">Close Up</option>
                            <option value="Medium Shot">Medium Shot</option>
                            <option value="Wide Shot">Wide Shot</option>
                            <option value="Extreme Wide Shot">Extreme Wide Shot</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight flex items-center gap-1.5">
                            <Move className="w-3 h-3" /> {t('storyboard.camera')}
                        </label>
                        <select 
                            className="w-full bg-background border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/10"
                            value={selectedShot.camera_move || ''}
                            onChange={(e) => handleUpdate('camera_move', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="Static">Static</option>
                            <option value="Pan Left">Pan Left</option>
                            <option value="Pan Right">Pan Right</option>
                            <option value="Tilt Up">Tilt Up</option>
                            <option value="Zoom In">Zoom In</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight flex items-center gap-1.5">
                            <Camera className="w-3 h-3" /> {t('storyboard.lens')}
                        </label>
                        <select 
                            className="w-full bg-background border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/10"
                            value={selectedShot.lens || ''}
                            onChange={(e) => handleUpdate('lens', e.target.value)}
                        >
                            <option value="">Select...</option>
                            <option value="24mm">24mm</option>
                            <option value="35mm">35mm</option>
                            <option value="50mm">50mm</option>
                            <option value="85mm">85mm</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {t('storyboard.duration')}
                        </label>
                        <input 
                            type="number" 
                            step="0.1"
                            className="w-full bg-background border rounded-md px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary/10"
                            value={selectedShot.duration}
                            onChange={(e) => handleUpdate('duration', parseFloat(e.target.value))}
                        />
                    </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-4 pt-2 border-t">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight">
                            {t('storyboard.story_desc') || 'Story Description'}
                        </label>
                        <textarea
                            className="w-full h-20 rounded-lg border bg-background/50 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                            value={selectedShot.story_desc || ''}
                            onChange={(e) => handleUpdate('story_desc', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-tight">
                            {t('storyboard.visual_desc') || 'Visual Description'}
                        </label>
                        <textarea
                            className="w-full h-20 rounded-lg border bg-background/50 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                            value={selectedShot.visual_desc || ''}
                            onChange={(e) => handleUpdate('visual_desc', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Action Section */}
            <div className="p-4 border-t bg-secondary/5">
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedShot.prompt}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGenerating ? t('storyboard.generating') : t('storyboard.generate')}
                </button>
                <p className="text-[10px] text-center mt-3 text-muted-foreground">
                    {t('storyboard.estimated_time')}: 15s • {t('storyboard.cost')}: ~2 {t('storyboard.credits')}
                </p>
            </div>
        </div>
    );
};