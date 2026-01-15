import { ProjectList } from '../features/projects/components/ProjectList';
import { StoryboardLayout } from '../features/storyboard/components/StoryboardLayout';
import { AssetLibrary } from '../features/assets/components/AssetLibrary';
import { SettingsPage } from '../features/settings/components/SettingsPage';
import { useRoutes, Navigate } from 'react-router-dom';

export const AppRouter = () => {
    const routes = useRoutes([
        {
            path: '/',
            element: <ProjectList />,
        },
        {
            path: '/project/:projectId',
            element: <StoryboardLayout />,
        },
        {
            path: '/assets',
            element: <AssetLibrary />,
        },
        {
            path: '/settings',
            element: <SettingsPage />,
        },
        {
            path: '*',
            element: <Navigate to="/" replace />,
        },
    ]);

    return routes;
};
