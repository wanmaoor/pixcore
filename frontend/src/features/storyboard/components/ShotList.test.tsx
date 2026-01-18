import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShotList } from './ShotList';
import { useStoryboardStore } from '../stores/storyboardStore';
import { mockApi } from '../../../lib/api-client';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../../lib/api-client', () => ({
  mockApi: {
    createShot: vi.fn().mockResolvedValue({
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
    }),
    deleteShot: vi.fn().mockResolvedValue(true),
    reorderShots: vi.fn().mockResolvedValue(true),
  },
}));

// Mock DnD components since they use sensors which might not work well in happy-dom
vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core');
    return {
        ...actual,
        DndContext: ({ children }: any) => <div>{children}</div>,
        useSensor: () => ({}),
        useSensors: () => ({}),
    }
});

vi.mock('@dnd-kit/sortable', async () => {
    const actual = await vi.importActual('@dnd-kit/sortable');
    return {
        ...actual,
        SortableContext: ({ children }: any) => <div>{children}</div>,
        useSortable: () => ({
            attributes: {},
            listeners: {},
            setNodeRef: () => {},
            transform: null,
            transition: null,
            isDragging: false,
        }),
    }
});

describe('ShotList', () => {
    it('renders empty state initially', () => {
        useStoryboardStore.setState({ shots: [] });
        render(<ShotList />);
        expect(screen.getByText('storyboard.no_shots')).toBeInTheDocument();
    });

    it('renders shots', () => {
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
            }]
        });
        render(<ShotList />);
        expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });

    it('adds a shot', async () => {
        useStoryboardStore.setState({ shots: [] });
        render(<ShotList />);
        fireEvent.click(screen.getByTitle('storyboard.add_shot'));
        await waitFor(() => {
            expect(mockApi.createShot).toHaveBeenCalled();
            // Store update is handled by the component calling store methods.
            // Since we mocked api, we should see the store update if the component works.
            const { shots } = useStoryboardStore.getState();
            expect(shots).toHaveLength(1);
        });
    });
});
