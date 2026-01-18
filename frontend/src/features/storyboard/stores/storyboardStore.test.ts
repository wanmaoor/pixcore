import { describe, it, expect, beforeEach } from 'vitest';
import { useStoryboardStore } from './storyboardStore';
import { Shot } from '../../../lib/api-client';

const mockShot: Shot = {
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
};

describe('Storyboard Store', () => {
  beforeEach(() => {
    useStoryboardStore.setState({
      selectedShotId: null,
      shots: [],
    });
  });

  it('should have initial state', () => {
    const state = useStoryboardStore.getState();
    expect(state.selectedShotId).toBeNull();
    expect(state.shots).toEqual([]);
  });

  it('should set shots', () => {
    useStoryboardStore.getState().setShots([mockShot]);
    const { shots } = useStoryboardStore.getState();
    expect(shots).toEqual([mockShot]);
  });

  it('should add a shot', () => {
    useStoryboardStore.getState().addShot(mockShot);
    const { shots } = useStoryboardStore.getState();
    expect(shots).toHaveLength(1);
    expect(shots[0]).toEqual(mockShot);
  });

  it('should update a shot', () => {
    useStoryboardStore.getState().addShot(mockShot);
    const updates = { prompt: 'Updated prompt' };
    useStoryboardStore.getState().updateShot(mockShot.id, updates);
    const { shots } = useStoryboardStore.getState();
    expect(shots[0].prompt).toBe('Updated prompt');
  });

  it('should delete a shot', () => {
    useStoryboardStore.getState().addShot(mockShot);
    useStoryboardStore.getState().deleteShot(mockShot.id);
    const { shots } = useStoryboardStore.getState();
    expect(shots).toHaveLength(0);
  });

  it('should reorder shots', () => {
    const shot2 = { ...mockShot, id: 2, order: 2 };
    useStoryboardStore.getState().setShots([mockShot, shot2]);
    useStoryboardStore.getState().reorderShots([shot2, mockShot]);
    const { shots } = useStoryboardStore.getState();
    expect(shots[0].id).toBe(2);
    expect(shots[1].id).toBe(1);
  });

  it('should set selected shot id', () => {
    useStoryboardStore.getState().setSelectedShotId(mockShot.id);
    const { selectedShotId } = useStoryboardStore.getState();
    expect(selectedShotId).toBe(mockShot.id);
  });
});
