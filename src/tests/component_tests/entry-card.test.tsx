/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryCard, { EntryCardProps } from '@/components/custom/entry-card';
import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder';
import { User } from '@/index/user';
import {
  QueryClient,
  QueryClientProvider,
  UseMutationOptions,
} from '@tanstack/react-query';

const mockInvalidateQueries = jest.fn();
const mockMutate = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
  useMutation: jest.fn(
    (_options?: UseMutationOptions<unknown, Error, unknown, unknown>) => ({
      mutate: mockMutate,
      isPending: false,
    })
  ),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => ({
  editEntry: jest.fn().mockResolvedValue({}),
  deleteEntry: jest.fn().mockResolvedValue({}),
  addTagsToEntry: jest.fn().mockResolvedValue({}),
  removeTagFromEntry: jest.fn().mockResolvedValue({}),
  removeEntryFromFolder: jest.fn().mockResolvedValue({}),
}));

const mockedApi = jest.requireMock('@/lib/api') as {
  editEntry: jest.Mock;
  deleteEntry: jest.Mock;
  addTagsToEntry: jest.Mock;
  removeTagFromEntry: jest.Mock;
  removeEntryFromFolder: jest.Mock;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});

const mockUserData: User = {
  username: 'Mock User',
  email: 'mock@user.com',
  profilePicture: '',
  streak: '1',
  enabled2fa: false,
  aiAllowTitleAccess: true,
  aiAllowContentAccess: true,
};
const mockEntry: Entry = {
  id: BigInt(1),
  publicId: 'test-public-id',
  user: mockUserData,
  title: 'Test Entry Title',
  content: 'Test entry content.',
  wordCount: 3,
  journalDate: new Date(2024, 4, 3, 12, 0, 0),
  dateCreated: new Date(2024, 4, 1),
  lastEdited: new Date(2024, 4, 2),
  isFavorite: false,
  tags: ['tag1', 'tag2'],
  folderId: BigInt(1),
};
const mockFolders: Folder[] = [
  {
    id: BigInt(1),
    publicId: 'folder-public-id-1',
    name: 'Folder 1',
    createdAt: new Date(2024, 4, 1),
  },
  {
    id: BigInt(2),
    publicId: 'folder-public-id-2',
    name: 'Folder 2',
    createdAt: new Date(2024, 4, 1),
  },
];
const mockAvailableTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'];
const defaultProps: EntryCardProps = {
  entry: mockEntry,
  truncatedContent: 'Test entry content.',
  availableTags: mockAvailableTags,
  availableFolders: mockFolders,
  onEntryClick: jest.fn(),
  onShareClick: jest.fn(),
  queryKeyToInvalidate: ['entries'],
};

const renderComponent = (props: Partial<EntryCardProps> = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <EntryCard {...defaultProps} {...props} />
    </QueryClientProvider>
  );
};

describe('EntryCard Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.editEntry.mockResolvedValue({});
    mockedApi.deleteEntry.mockResolvedValue({});
    mockedApi.addTagsToEntry.mockResolvedValue({});
    mockedApi.removeTagFromEntry.mockResolvedValue({});
    mockedApi.removeEntryFromFolder.mockResolvedValue({});
    queryClient.clear();
    jest.useRealTimers();
  });

  it('renders the entry title and date', () => {
    renderComponent();
    expect(screen.getByText(mockEntry.title)).toBeInTheDocument();
    expect(
      screen.getByText(mockEntry.journalDate.toLocaleDateString())
    ).toBeInTheDocument();
  });

  it('renders the truncated content', () => {
    renderComponent();
    expect(screen.getByText(defaultProps.truncatedContent)).toBeInTheDocument();
  });

  it('renders tags and add tag button', () => {
    renderComponent();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '+ Add Tag' })
    ).toBeInTheDocument();
  });

  it('calls onEntryClick when the card body is clicked', async () => {
    renderComponent();
    await user.click(screen.getByRole('listitem'));
    expect(defaultProps.onEntryClick).toHaveBeenCalledWith(mockEntry.publicId);
    expect(defaultProps.onEntryClick).toHaveBeenCalledTimes(1);
  });

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    renderComponent();
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    const dialog = await screen.findByTestId('delete-confirm-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Delete');
    expect(
      screen.getByText(mockEntry.title, { selector: 'span' })
    ).toBeInTheDocument();
    expect(dialog).toHaveTextContent('?');
    expect(screen.getByTestId('cancel-delete-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-button')).toBeInTheDocument();
  });

  it('cancels delete and hides dialog when cancel button is clicked', async () => {
    renderComponent();
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    const dialog = await screen.findByTestId('delete-confirm-dialog');
    expect(dialog).toBeInTheDocument();

    const cancelButton = screen.getByTestId('cancel-delete-button');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId('delete-confirm-dialog')
      ).not.toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
    expect(mockedApi.deleteEntry).not.toHaveBeenCalled();
  }, 10000);

  it('calls onShareClick with entry ID when share button is clicked', async () => {
    renderComponent();
    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);

    await waitFor(() => {
      expect(defaultProps.onShareClick).toHaveBeenCalledWith(
        expect.anything(),
        mockEntry.id
      );
    });
    expect(defaultProps.onShareClick).toHaveBeenCalledTimes(1);
  }, 10000);
});
