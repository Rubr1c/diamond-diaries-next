/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderContainer from '@/components/custom/folder-container';
import { deleteFolder } from '@/lib/api';
import { toast } from 'sonner';

const mockPush = jest.fn();
const mockInvalidate = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('@/lib/api', () => ({ deleteFolder: jest.fn().mockResolvedValue({}) }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const folder = { id: BigInt(1), publicId: 'test-pid', name: 'Test Folder' };

describe('FolderContainer Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders folder name', () => {
    render(<FolderContainer folder={folder as any} />);
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('navigates to folder page on click', async () => {
    render(<FolderContainer folder={folder as any} />);
    await user.click(screen.getByText('Test Folder'));
    expect(mockPush).toHaveBeenCalledWith('/folders/test-pid');
  });

  it('shows confirmation dialog when delete button clicked', async () => {
    render(<FolderContainer folder={folder as any} />);
    await user.click(screen.getByLabelText('Delete folder Test Folder'));
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('hides confirmation on cancel', async () => {
    render(<FolderContainer folder={folder as any} />);
    await user.click(screen.getByLabelText('Delete folder Test Folder'));
    await user.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Delete')).not.toBeInTheDocument());
    expect(deleteFolder).not.toHaveBeenCalled();
  });

  it('deletes folder on confirm and shows toast', async () => {
    render(<FolderContainer folder={folder as any} />);
    await user.click(screen.getByLabelText('Delete folder Test Folder'));
    await user.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(deleteFolder).toHaveBeenCalledWith(folder.id);
      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['folders'] });
      expect(toast.success).toHaveBeenCalledWith('Folder "Test Folder" deleted successfully');
    });
  });
});