import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Film, Clapperboard, Video } from 'lucide-react';
import { mockApi, Project } from '../../../lib/api-client';
import { CreateProjectDialog } from './CreateProjectDialog';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { ProjectCard } from './ProjectCard';
import { useDebounce } from '../../../hooks/useDebounce';

// ✅ 静态 JSX 提升到组件外部，避免每次渲染重新创建
const PROJECT_TYPE_ICONS = {
  story: <Clapperboard className="w-4 h-4" />,
  animation: <Film className="w-4 h-4" />,
  short: <Video className="w-4 h-4" />,
} as const;

export const ProjectList = () => {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // ✅ 实现搜索防抖
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms 防抖

  // ✅ 使用 React Query 进行数据获取，自动处理缓存、重试和去重
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: mockApi.getProjects,
  });

  // ✅ 使用 useCallback 稳定化函数引用
  const getProjectTypeIcon = useCallback((type: Project['type']) => {
    return PROJECT_TYPE_ICONS[type];
  }, []);

  // ✅ 使用 useMemo 缓存过滤后的项目列表
  const filteredProjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return projects;

    const query = debouncedSearchQuery.toLowerCase();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query)
    );
  }, [projects, debouncedSearchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              P
            </div>
            <span className="font-bold text-lg hidden sm:block">Pixcore</span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('projects.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // ✅ 实时更新搜索
                className="w-full bg-secondary/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {/* ✅ 搜索状态指示器 */}
              {searchQuery !== debouncedSearchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('projects.new_project')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            {t('projects.recent_projects')}
            {debouncedSearchQuery && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                ({filteredProjects.length} {t('projects.results')})
              </span>
            )}
          </h1>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <select className="bg-transparent border-none focus:ring-0 cursor-pointer">
              <option>{t('projects.sort.last_edited')}</option>
              <option>{t('projects.sort.name')}</option>
              <option>{t('projects.sort.date_created')}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* New Project Card (Quick Action) */}
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="group relative aspect-video bg-muted/30 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-muted/50"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium text-muted-foreground group-hover:text-foreground">{t('projects.create_new')}</span>
            </button>

            {/* ✅ 使用优化后的 ProjectCard 组件 */}
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                getProjectTypeIcon={getProjectTypeIcon}
              />
            ))}

            {/* ✅ 无搜索结果提示 */}
            {filteredProjects.length === 0 && debouncedSearchQuery && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-12 h-12 text-muted-foreground/20 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {t('projects.no_results')}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {t('projects.try_different_search')}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};
