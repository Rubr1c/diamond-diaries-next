/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

jest.mock('@/lib/api', () => ({
  newEntry: jest.fn().mockResolvedValue({ id: 'new-entry-public-id' }), // Use newEntry
  fetchFolders: jest.fn().mockResolvedValue([]),
  fetchTags: jest.fn().mockResolvedValue([]),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: { username: 'testuser' }, isLoading: false }),
}));

import NewEntryModal from '@/components/modals/NewEntryModal';


const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const renderIntegrationTest = (onCloseMock = jest.fn()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <NewEntryModal isOpen={true} onClose={onCloseMock} />
    </QueryClientProvider>
  );
};

describe('Entry Creation Integration Test', () => {
  const user = userEvent.setup();
  const mockedApi = jest.requireMock('@/lib/api');
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnClose.mockClear(); 
    queryClient.clear();
  });

  it('should allow a user to fill out the form and create an entry', async () => {
    renderIntegrationTest(mockOnClose);

    await screen.findByRole('dialog');

    const titleInput = screen.getByLabelText('Title');
    const contentInput = document.querySelector(
      'textarea#content'
    ) as HTMLTextAreaElement;
    expect(contentInput).toBeInTheDocument(); // Ensure textarea is found
    const submitButton = await screen.findByRole('button', {
      name: 'Create Entry',
    }); 

    const testTitle = 'My New Entry Title';
    const testContent = 'This is the content of the new entry.';
    await user.type(titleInput, testTitle);
    await user.type(contentInput, testContent);

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedApi.newEntry).toHaveBeenCalledTimes(1);
    });

    expect(mockedApi.newEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        title: testTitle,
        content: testContent,
        folderId: undefined, 
        tagNames: [],
        wordCount: expect.any(Number),
        isFavorite: false,
      })
    );
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Entry created successfully')
      );
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show validation error if title is missing', async () => {
    renderIntegrationTest(mockOnClose);
    await screen.findByRole('dialog');

    const contentInput = document.querySelector(
      'textarea#content'
    ) as HTMLTextAreaElement;
    expect(contentInput).toBeInTheDocument();
    const submitButton = await screen.findByRole('button', {
      name: 'Create Entry',
    });

    await user.type(contentInput, 'Some content');
    await user.click(submitButton);

    expect(mockedApi.newEntry).not.toHaveBeenCalled();

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show validation error if content is missing', async () => {
    renderIntegrationTest(mockOnClose);
    await screen.findByRole('dialog');

    const titleInput = screen.getByLabelText('Title');
    const submitButton = await screen.findByRole('button', {
      name: 'Create Entry',
    }); 

    await user.type(titleInput, 'Some title');
    await user.click(submitButton);

    expect(mockedApi.newEntry).not.toHaveBeenCalled();

    expect(mockOnClose).not.toHaveBeenCalled();
  });

});
