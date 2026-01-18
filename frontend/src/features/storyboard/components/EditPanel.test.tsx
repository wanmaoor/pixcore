import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditPanel } from './EditPanel';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi } from '../../../lib/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../lib/api-client', () => ({
  mockApi: {
    updateShot: vi.fn().mockResolvedValue({}),
    generateVersion: vi.fn().mockResolvedValue({}),
  },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('EditPanel', () => {
    beforeEach(() => {
        useStoryboardStore.setState({
            shots: [{
                id: 1,
                scene_id: 1,
                order: 1,
                shot_type: 'Close Up',
                camera_move: 'Static',
                duration: 5.0,
                composition: 'Rule of Thirds',
                lens: '35mm',
                story_desc: 'Test description',
                visual_desc: 'Test visual',
                prompt: 'Test prompt',
                negative_prompt: null,
                asset_refs: [],
                status: 'pending',
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            }],
            selectedShotId: null
        });
        queryClient.clear();
    });

    it('renders empty state when no shot selected', () => {
        render(<EditPanel />, { wrapper });
        expect(screen.getByText('storyboard.select_shot_to_edit')).toBeInTheDocument();
    });

    it('renders shot details when selected', () => {
        useStoryboardStore.setState({ selectedShotId: 1 });
        render(<EditPanel />, { wrapper });
        expect(screen.getByDisplayValue('Test prompt')).toBeInTheDocument();
    });

    it('updates prompt', async () => {
        useStoryboardStore.setState({ selectedShotId: 1 });
        render(<EditPanel />, { wrapper });
        const textarea = screen.getByDisplayValue('Test prompt');
        fireEvent.change(textarea, { target: { value: 'New prompt' } });

        // Check local update
        expect(screen.getByDisplayValue('New prompt')).toBeInTheDocument();

        // Wait for store update (which calls API)
        await waitFor(() => {
             expect(mockApi.updateShot).toHaveBeenCalledWith(1, { prompt: 'New prompt' });
        });
    });

    it('triggers generation', async () => {
        useStoryboardStore.setState({ selectedShotId: 1 });
        render(<EditPanel />, { wrapper });

        const button = screen.getByText('storyboard.generate');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockApi.generateVersion).toHaveBeenCalledWith(1);
        });
    });
});
