/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import EntryEditPage from '@/app/entries/[id]/edit/page';
import { fetchEntryByUuid, editEntry } from '@/lib/api';

// Mock speech recognition support
jest.mock('react-speech-recognition', () => ({
  __esModule: true,
  default: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
  useSpeechRecognition: jest.fn(() => ({
    transcript: '',
    listening: false,
    resetTranscript: jest.fn(),
    browserSupportsSpeechRecognition: true,
  })),
}));

jest.mock('@/lib/api', () => ({
  fetchEntryByUuid: jest.fn().mockResolvedValue({ id: BigInt(1), content: 'Old content' }),
  editEntry: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/components/custom/markdown-renderer', () => ({ __esModule: true, default: ({ content }: any) => <div>{content}</div> }));

const mockFetch = fetchEntryByUuid as jest.Mock;
const mockEdit = editEntry as jest.Mock;

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1234' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({ user: { username: 'testuser' }, isLoading: false }),
}));

describe('Entry Editing Integration Test', () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const setup = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <EntryEditPage />
      </QueryClientProvider>
    );

  it('should load existing content and allow editing an entry', async () => {
    setup();

    const textarea = await screen.findByRole('textbox');
    await waitFor(() => expect(textarea).toHaveValue('Old content'));

    await userEvent.clear(textarea);
    const newContent = 'New edited content';
    await userEvent.type(textarea, newContent);

    const submitButton = screen.getByRole('button', { name: 'Done' });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockEdit).toHaveBeenCalledWith(BigInt(1), expect.objectContaining({
        content: expect.stringContaining(newContent),
        wordCount: expect.any(Number),
      }));
      expect(mockPush).toHaveBeenCalledWith('/entries/1234');
    });
  });

  it('should toggle autosave and display autosave enabled', async () => {
    setup();
    await screen.findByRole('textbox');
    const autosaveLabel = screen.getByText('Autosave');
    await userEvent.click(autosaveLabel);
    expect(screen.getByText('Autosave enabled')).toBeInTheDocument();
  });

  it('should update preview and word count as content changes', async () => {
    setup();
    const textarea = await screen.findByRole('textbox');
    await waitFor(() => expect(textarea).toHaveValue('Old content'));
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Hello world test');
    const matches = screen.getAllByText('Hello world test');
    expect(matches.length).toBe(2);
    expect(screen.getByText('3 words')).toBeInTheDocument();
  });
});