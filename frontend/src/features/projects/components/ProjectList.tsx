import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreVertical, Film, Clapperboard, Video } from 'lucide-react';
import { mockApi, Project } from '../../../lib/api-client';
import { CreateProjectDialog } from './CreateProjectDialog';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';

export const ProjectList = () => {
    const { t } = useTranslation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await mockApi.getProjects();
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const getProjectTypeIcon = (type: Project['type']) => {
        switch (type) {
            case 'story': return <Clapperboard className="w-4 h-4" />;
            case 'animation': return <Film className="w-4 h-4" />;
            case 'short': return <Video className="w-4 h-4" />;
        }
    };

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
                                className="w-full bg-secondary/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
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
                    <h1 className="text-2xl font-bold">{t('projects.recent_projects')}</h1>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                        <select className="bg-transparent border-none focus:ring-0 cursor-pointer">
                            <option>{t('projects.sort.last_edited')}</option>
                            <option>{t('projects.sort.name')}</option>
                            <option>{t('projects.sort.date_created')}</option>
                        </select>
                    </div>
                </div>

                {loading ? (
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

                        {projects.map((project) => (
                            <Link
                                to={`/project/${project.id}`}
                                key={project.id}
                                className="group block relative bg-card hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden border border-border/50"
                            >
                                {/* Cover Image */}
                                <div className="aspect-video bg-muted relative overflow-hidden">
                                    {project.cover_url ? (
                                        <img
                                            src={project.cover_url}
                                            alt={project.name}
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
                                        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
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
                        ))}
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
