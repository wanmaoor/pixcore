import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import { Project } from '../../../lib/api-client';

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  type: 'story',
  resolution: { width: 1920, height: 1080 },
  fps: 24,
  lock_character: false,
  lock_style: false,
  lock_world: false,
  lock_key_object: false,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

describe('Project Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useProjectStore.setState({ currentProject: null });
  });

  it('should have initial state null', () => {
    const { currentProject } = useProjectStore.getState();
    expect(currentProject).toBeNull();
  });

  it('should set current project', () => {
    useProjectStore.getState().setCurrentProject(mockProject);
    const { currentProject } = useProjectStore.getState();
    expect(currentProject).toEqual(mockProject);
  });

  it('should clear current project', () => {
    useProjectStore.getState().setCurrentProject(mockProject);
    useProjectStore.getState().setCurrentProject(null);
    const { currentProject } = useProjectStore.getState();
    expect(currentProject).toBeNull();
  });
});
