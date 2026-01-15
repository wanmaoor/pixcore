import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, SkipBack, SkipForward, Maximize2, Layers, Check } from 'lucide-react';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi, Version } from '../../../lib/api-client';

export const PreviewArea: React.FC = () => {
    const { t } = useTranslation();
    const { selectedShotId } = useStoryboardStore();
    const [versions, setVersions] = useState<Version[]>([]);
    const [activeVersionId, setActiveVersionId] = useState<number | null>(null);

    useEffect(() => {
        const loadVersions = async () => {
            if (selectedShotId) {
                try {
                    const data = await mockApi.getShotVersions(selectedShotId);
                    setVersions(data);
                    // Only set active version if not set or if we want to auto-switch to primary
                    // For now, let's auto-switch to the primary (newest usually)
                    const primary = data.find(v => v.is_primary) || data[0];
                    if (primary) setActiveVersionId(primary.id);
                } catch (error) {
                    console.error('Failed to load versions', error);
                }
            }
        };

        loadVersions();

        // Listen for regeneration events
        const handleVersionGenerated = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.shotId === selectedShotId) {
                loadVersions();
            }
        };

        window.addEventListener('version-generated', handleVersionGenerated);
        return () => window.removeEventListener('version-generated', handleVersionGenerated);
    }, [selectedShotId]);

    const activeVersion = versions.find(v => v.id === activeVersionId);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Player / Preview Stage */}
            <div className="flex-1 bg-neutral-900/50 relative group flex items-center justify-center overflow-hidden">
                {activeVersion ? (
                    <div className="relative w-full h-full flex items-center justify-center p-8">
                        <img 
                            src={activeVersion.url} 
                            alt="Preview" 
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-black/50 text-white rounded-md hover:bg-black/70 transition-colors">
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <Play className="w-16 h-16" />
                        <span className="text-sm font-medium tracking-widest uppercase">{t('common.no_content')}</span>
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <div className="px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-mono uppercase tracking-tighter">
                        v{activeVersionId || '00'}
                    </div>
                </div>
            </div>

            {/* Version Stack / Timeline Bar */}
            <div className="h-48 border-t bg-card flex flex-col">
                <div className="h-10 border-b flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-secondary rounded-full transition-colors"><SkipBack className="w-4 h-4" /></button>
                            <button className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all shadow-sm">
                                <Play className="w-4 h-4 fill-current" />
                            </button>
                            <button className="p-1.5 hover:bg-secondary rounded-full transition-colors"><SkipForward className="w-4 h-4" /></button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors">
                            <Layers className="w-3 h-3" />
                            {t('storyboard.versions')} ({versions.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto p-4 flex gap-4 custom-scrollbar">
                    {versions.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setActiveVersionId(v.id)}
                            className={`
                                relative flex-shrink-0 w-40 aspect-video rounded-md overflow-hidden border-2 transition-all
                                ${activeVersionId === v.id ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/30'}
                            `}
                        >
                            <img src={v.thumb_url || v.url} alt={`v${v.id}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] text-white font-mono">
                                v{v.id}
                            </div>
                            {v.is_primary && (
                                <div className="absolute top-1 right-1 p-0.5 bg-green-500 rounded-full">
                                    <Check className="w-2 h-2 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};