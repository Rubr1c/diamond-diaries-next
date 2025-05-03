/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagSelector } from '@/components/custom/tag-selector';

const mockAvailableTags = [
  'react',
  'typescript',
  'javascript',
  'nextjs',
  'css',
];
const mockSelectedTags: string[] = ['react'];

const defaultProps = {
  selectedTags: mockSelectedTags,
  availableTags: mockAvailableTags,
  onTagAdd: jest.fn(),
  onTagRemove: jest.fn(),
};

const renderComponent = (props = {}) => {
  return render(<TagSelector {...defaultProps} {...props} />);
};

describe('TagSelector Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input field', () => {
    renderComponent();
    expect(
      screen.getByPlaceholderText('Click to add tags...')
    ).toBeInTheDocument();
  });

  it('opens the tag popover when input is clicked', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);
    // Check if some available tags (excluding selected) are visible
    await waitFor(() => {
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.queryByText('react')).not.toBeInTheDocument(); // Already selected
    });
  });

  it('filters available tags based on input', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);
    await user.type(input, 'script');

    await waitFor(() => {
      expect(screen.getByText('typescript')).toBeInTheDocument();
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.queryByText('nextjs')).not.toBeInTheDocument();
      expect(screen.queryByText('css')).not.toBeInTheDocument();
    });
  });

  it('calls onTagAdd when an available tag is clicked', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);

    const tagToAdd = 'typescript';
    const tagElement = await screen.findByText(tagToAdd);
    await user.click(tagElement);

    expect(defaultProps.onTagAdd).toHaveBeenCalledWith(tagToAdd);
    expect(defaultProps.onTagAdd).toHaveBeenCalledTimes(1);
    // Input should be cleared after adding
    expect(input).toHaveValue('');
  });

  it('shows create new tag button when input does not match existing tags', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);
    const newTag = 'new-tag';
    await user.type(input, newTag);

    await waitFor(() => {
      expect(screen.getByText(`Create ${newTag}`)).toBeInTheDocument();
    });
  });

  it('calls onTagAdd with the new tag when create button is clicked', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);
    const newTag = 'new-tag';
    await user.type(input, newTag);

    const createButton = await screen.findByText(`Create ${newTag}`);
    await user.click(createButton);

    expect(defaultProps.onTagAdd).toHaveBeenCalledWith(newTag);
    expect(defaultProps.onTagAdd).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  it('calls onTagAdd with the new tag when Enter key is pressed', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);
    const newTag = 'another-new-tag';
    await user.type(input, newTag);
    await user.keyboard('{Enter}');

    expect(defaultProps.onTagAdd).toHaveBeenCalledWith(newTag);
    expect(defaultProps.onTagAdd).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('');
  });

  it('closes the popover when Done button is clicked', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);

    await screen.findByText('typescript');

    const doneButton = screen.getByRole('button', { name: 'Done' });
    await user.click(doneButton);

    await waitFor(() => {
      expect(screen.queryByText('typescript')).not.toBeInTheDocument();
    });
  });

  it('closes the popover when clicking outside', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Click to add tags...');
    await user.click(input);

    await screen.findByText('typescript');

    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('typescript')).not.toBeInTheDocument();
    });
  });
});
