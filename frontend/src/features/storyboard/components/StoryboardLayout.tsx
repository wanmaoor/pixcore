import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Settings, Share2, Layers } from 'lucide-react';
import { useStoryboardStore } from '../stores/storyboardStore';
import { shotApi } from '../../../lib/api';
import { ShotList } from './ShotList';
import { PreviewArea } from './PreviewArea';
import { EditPanel } from './EditPanel';

export const StoryboardLayout = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { setShots, setSelectedShotId } = useStoryboardStore();

  // ✅ 使用 React Query 获取数据，自动处理加载、错误和缓存
  const { data: shots, isLoading, error } = useQuery({
    queryKey: ['shots', projectId],
    queryFn: () => shotApi.getByProject(parseInt(projectId!)),
    enabled: !!projectId, // 只在 projectId 存在时执行查询
  });

  // ✅ 使用单独的 effect 更新 store，避免依赖不稳定
  useEffect(() => {
    if (shots) {
      setShots(shots);
      if (shots.length > 0) {
        setSelectedShotId(shots[0].id);
      }
    }
  }, [shots]); // ✅ 只依赖数据，不依赖 setter 函数

  // ✅ 错误处理
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            {t('common.error')}
          </h2>
          <p className="text-muted-foreground mb-4">
            Failed to load project shots
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // ✅ 加载状态
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

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
