import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Settings, Share2, Layers } from 'lucide-react';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi } from '../../../lib/api-client';
import { ShotList } from './ShotList';
import { PreviewArea } from './PreviewArea';
import { EditPanel } from './EditPanel';

export const StoryboardLayout = () => {
    const { t } = useTranslation();
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { setShots, setSelectedShotId } = useStoryboardStore();

    useEffect(() => {
        const loadData = async () => {
            if (projectId) {
                try {
                    const shots = await mockApi.getShots(parseInt(projectId));
                    setShots(shots);
                    if (shots.length > 0) {
                        setSelectedShotId(shots[0].id);
                    }
                } catch (error) {
                    console.error('Failed to load project shots', error);
                }
            }
        };
        loadData();
    }, [projectId, setShots, setSelectedShotId]);

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* Top Navigation */}
            <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                        title={t('common.back')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-4 w-[1px] bg-border mx-1" />
                    <h1 className="font-semibold text-sm tracking-tight truncate max-w-[200px]">
                        Project {projectId}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
                        <Layers className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button className="ml-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>{t('common.share')}</span>
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Shot List */}
                <aside className="w-64 border-r flex flex-col bg-secondary/5">
                    <ShotList />
                </aside>

                {/* Middle: Preview Area */}
                <section className="flex-1 flex flex-col min-w-0 bg-background">
                    <PreviewArea />
                </section>

                {/* Right: Edit Panel */}
                <aside className="w-80 border-l flex flex-col bg-card">
                    <EditPanel />
                </aside>
            </main>
        </div>
    );
};