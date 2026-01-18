import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Film, MoreVertical } from 'lucide-react';
import { Project } from '../../../lib/api-client';

// ✅ 静态 JSX 提升到组件外部
const PROJECT_TYPE_ICONS = {
  story: 'Clapperboard',
  animation: 'Film',
  short: 'Video',
} as const;

interface ProjectCardProps {
  project: Project;
  getProjectTypeIcon: (type: Project['type']) => React.ReactNode;
}

/**
 * ✅ 使用 React.memo 优化的项目卡片组件
 * 只有当 project.id 改变时才重新渲染
 */
export const ProjectCard = memo<ProjectCardProps>(
  ({ project, getProjectTypeIcon }) => {
    const { t } = useTranslation();

    return (
      <Link
        to={`/project/${project.id}`}
        className="group block relative bg-card hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-border/50"
      >
        {/* Cover Image */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {project.cover_url ? (
            <img
              src={project.cover_url}
              alt={project.name}
              loading="lazy" // ✅ 懒加载图片
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Film className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg leading-tight truncate pr-2 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault(); // 防止触发 Link 导航
                // TODO: 添加菜单逻辑
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50">
              {getProjectTypeIcon(project.type)}
              <span className="capitalize">{t(`projects.types.${project.type}`)}</span>
            </div>
            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>
    );
  },
  // ✅ 自定义比较函数：仅当 project.id 变化时才重新渲染
  (prevProps, nextProps) => prevProps.project.id === nextProps.project.id
);

ProjectCard.displayName = 'ProjectCard';
