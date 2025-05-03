/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/custom/navbar';
import { User } from '@/index/user';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props}/>;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock UserSidebar component
jest.mock('@/components/custom/user-sidebar', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onOpenChange,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    return isOpen ? (
      <div data-testid="user-sidebar">
        User Sidebar Content
        <button onClick={() => onOpenChange(false)}>Close Sidebar</button>
      </div>
    ) : null;
  },
}));

const mockUser: User = {
  username: 'Test User',
  email: 'test@example.com',
  profilePicture: '/mock-profile.jpg',
  streak: '5',
  enabled2fa: false,
  aiAllowTitleAccess: true,
  aiAllowContentAccess: true,
};

const renderNavbar = (user: User | undefined = mockUser) => {
  return render(<Navbar user={user} />);
};

describe('Navbar Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Reset mocks if needed
    jest.clearAllMocks();
  });

  it('renders the logo and brand name', () => {
    renderNavbar();
    expect(screen.getByAltText('Diamond Diaries Logo')).toBeInTheDocument();
    expect(screen.getByText('Diamond Diaries')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    renderNavbar();
    // Use queryByRole for elements hidden on mobile by default
    expect(screen.getByRole('link', { name: 'Entries' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Folders' })).toBeInTheDocument();
  });

  it('renders user streak', () => {
    renderNavbar();
    expect(screen.getByText(mockUser.streak)).toBeInTheDocument();
  });

  it('renders user profile picture button', () => {
    renderNavbar();
    const profileButton = screen.getByRole('button', {
      name: 'Open user menu',
    });
    expect(profileButton).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toHaveAttribute(
      'src',
      mockUser.profilePicture
    );
  });

  it('renders placeholder icon if profile picture fails to load', () => {
    renderNavbar();
    const profileImage = screen.getByAltText('Profile');
    // Simulate image error
    fireEvent.error(profileImage);
    // Check if the placeholder UserIcon is rendered
    expect(screen.queryByAltText('Profile')).not.toBeInTheDocument(); // Image should be gone
    expect(screen.getByTestId('user-icon-placeholder')).toBeInTheDocument();
  });

  it('renders placeholder icon if user has no profile picture', () => {
    renderNavbar({ ...mockUser, profilePicture: '' });
    expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
    // Check for the placeholder icon
    expect(screen.getByTestId('user-icon-placeholder')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    renderNavbar();
    expect(
      screen.getByRole('button', { name: 'Open main menu' })
    ).toBeInTheDocument();
  });

  it('opens the user sidebar when profile button is clicked', async () => {
    renderNavbar();
    const profileButton = screen.getByRole('button', {
      name: 'Open user menu',
    });

    expect(screen.queryByTestId('user-sidebar')).not.toBeInTheDocument();

    await user.click(profileButton);

    expect(await screen.findByTestId('user-sidebar')).toBeInTheDocument();
    expect(screen.getByText('User Sidebar Content')).toBeInTheDocument();
  });

  it('closes the user sidebar', async () => {
    renderNavbar();
    const profileButton = screen.getByRole('button', {
      name: 'Open user menu',
    });
    await user.click(profileButton);

    const sidebar = await screen.findByTestId('user-sidebar');
    expect(sidebar).toBeInTheDocument();

    const closeSidebarButton = screen.getByRole('button', {
      name: 'Close Sidebar',
    });
    await user.click(closeSidebarButton);

    await waitFor(() => {
      expect(screen.queryByTestId('user-sidebar')).not.toBeInTheDocument();
    });
  });

  // Add more tests as needed, e.g., for clicking links, different user states, etc.
});
