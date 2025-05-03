/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserSidebar from '@/components/custom/user-sidebar';
import { logout } from '@/lib/api';

const mockPush = jest.fn();
const mockInvalidate = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mockInvalidate }) }));
jest.mock('@/lib/api', () => ({ logout: jest.fn() }));
jest.mock('next/image', () => (props: any) => <img {...props} />);

describe('UserSidebar Component', () => {
  const onOpenChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('adds hidden class when isOpen is false', () => {
    const { container } = render(
      <UserSidebar user={undefined} isOpen={false} onOpenChange={onOpenChange} />
    );
    expect(container.firstChild).toHaveClass('hidden');
    expect(document.body.style.overflow).toBe('');
  });

  it('shows sidebar and disables scroll when isOpen is true', () => {
    render(<UserSidebar user={undefined} isOpen={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes sidebar when overlay or close button clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <UserSidebar user={undefined} isOpen={true} onOpenChange={onOpenChange} />
    );
    const wrapper = container.firstChild as HTMLElement;
    const overlay = wrapper.childNodes[0] as HTMLElement;
    await user.click(overlay);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    const closeButton = screen.getByRole('button', { name: /Close sidebar/i });
    await user.click(closeButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('removes img and shows fallback svg when image error occurs', async () => {
    const sampleUser = { username: 'TestUser', profilePicture: 'img.png', streak: '5' } as any;
    const { container } = render(
      <UserSidebar user={sampleUser} isOpen={true} onOpenChange={onOpenChange} />
    );
    expect(screen.getByText('TestUser')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    const img = screen.getByRole('img');
    fireEvent.error(img);
    await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument());
    expect(container.querySelector('svg.lucide-user')).toBeInTheDocument();
  });

  it('logs out and navigates to login on Logout click', async () => {
    const sampleUser = { username: 'TestUser', profilePicture: '', streak: '5' } as any;
    const user = userEvent.setup();
    const mockLogout = logout as jest.Mock;
    render(<UserSidebar user={sampleUser} isOpen={true} onOpenChange={onOpenChange} />);
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    await user.click(logoutButton);
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: ['user'] });
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});