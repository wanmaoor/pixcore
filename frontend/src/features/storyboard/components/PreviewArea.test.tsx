import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PreviewArea } from './PreviewArea';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi } from '../../../lib/api-client';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockVersions = [
    {
        id: 1,
        shot_id: 1,
        type: 'image',
        url: 'http://example.com/v1.png',
        params: {},
        is_primary: true,
        created_at: new Date().toISOString()
    }
];

vi.mock('../../../lib/api-client', () => ({
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
    });

    it('renders empty state initially', () => {
        render(<PreviewArea />);
        expect(screen.getByText('common.no_content')).toBeInTheDocument();
    });

    it('loads versions when shot selected', async () => {
        useStoryboardStore.setState({ selectedShotId: 1 });
        render(<PreviewArea />);

        await waitFor(() => {
            expect(mockApi.getShotVersions).toHaveBeenCalledWith(1);
        });

        // We need to wait for the state update to reflect in the UI
        // Since getShotVersions is called in useEffect, and then state is set.
        await waitFor(() => {
             expect(screen.getByAltText('Preview')).toBeInTheDocument();
        });

        expect(screen.getAllByText('v1')[0]).toBeInTheDocument();
    });
});
