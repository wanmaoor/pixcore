import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectList } from './ProjectList';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'en'
    }
  }),
}));

vi.mock('../../../lib/api-client', () => ({
  mockApi: {
    getProjects: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Test Project 1',
        type: 'story',
        resolution: { width: 1920, height: 1080 },
        fps: 24,
        lock_character: false,
        lock_style: false,
        lock_world: false,
        lock_key_object: false,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]),
  },
}));

describe('ProjectList', () => {
  it('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );
    // There are 4 pulse elements in loading state
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBe(4);
  });

  it('renders project list after loading', async () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    });
  });

  it('opens create project dialog when button is clicked', async () => {
    render(
      <BrowserRouter>
        <ProjectList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('projects.new_project')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('projects.new_project'));

    await waitFor(() => {
       expect(screen.getByText('projects.create_dialog.title')).toBeInTheDocument();
    });
  });
});
