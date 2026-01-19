import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProjectDialog } from './CreateProjectDialog';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockCreateProject = vi.fn().mockResolvedValue({ id: 123 });

vi.mock('../../../lib/mock-api', () => ({
  mockApi: {
    createProject: (...args: any[]) => mockCreateProject(...args),
  },
}));

describe('CreateProjectDialog', () => {
  it('renders dialog when open', () => {
    render(
      <BrowserRouter>
        <CreateProjectDialog open={true} onOpenChange={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText('projects.create_dialog.title')).toBeInTheDocument();
  });

  it('submits form correctly', async () => {
    const onOpenChange = vi.fn();
    render(
      <BrowserRouter>
        <CreateProjectDialog open={true} onOpenChange={onOpenChange} />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('projects.create_dialog.name_label'), {
      target: { value: 'New Project' },
    });

    fireEvent.click(screen.getByText('common.create'));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Project',
        type: 'story'
      }));
    });
  });
});
