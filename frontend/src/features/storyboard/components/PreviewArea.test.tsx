import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PreviewArea } from './PreviewArea';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi } from '../../../lib/mock-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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

vi.mock('../../../lib/mock-api', () => ({
  mockApi: {
    getShotVersions: vi.fn().mockResolvedValue([
        {
            id: 1,
            shot_id: 1,
            type: 'image',
            url: 'http://example.com/v1.png',
            params: {},
            is_primary: true,
            created_at: '2023-10-27T10:00:00.000Z'
        }
    ]),
  },
}));

describe('PreviewArea', () => {
    beforeEach(() => {
         useStoryboardStore.setState({ selectedShotId: null });
         queryClient.clear();
    });

    it('renders empty state initially', () => {
        render(<PreviewArea />, { wrapper });
        expect(screen.getByText('common.no_content')).toBeInTheDocument();
    });

    it('loads versions when shot selected', async () => {
        useStoryboardStore.setState({ selectedShotId: 1 });
        render(<PreviewArea />, { wrapper });

        await waitFor(() => {
            expect(mockApi.getShotVersions).toHaveBeenCalledWith(1);
        });

        await waitFor(() => {
             expect(screen.getByAltText('Preview')).toBeInTheDocument();
        });

        expect(screen.getAllByText('v1')[0]).toBeInTheDocument();
    });
});
