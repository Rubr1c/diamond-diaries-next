import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { CalendarIcon, MenuIcon, UserIcon, XIcon } from 'lucide-react';
import { User } from '@/index/user';
import UserSidebar from './user-sidebar';

interface NavbarProps {
  user: User | undefined;
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50">
        <div className="flex flex-wrap justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/Diamond_Diaries_Logo_Teal.png"
                alt="Diamond Diaries Logo"
                className="mr-3"
                width={36}
                height={36}
              />
              <span className="self-center text-xl font-semibold whitespace-nowrap text-[#1E4959]">
                Diamond Diaries
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <Link
              href="/entries"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 rounded-md transition-colors"
            >
              Entries
            </Link>

            {/* Streak icon */}
            <div className="relative">
              <CalendarIcon className="h-5 w-5 text-[#1E4959]" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#003243] rounded-full flex items-center justify-center">
                <span className="text-white text-xs">{user?.streak ?? 0}</span>
              </div>
            </div>

            {/* Profile picture */}
            <div className="relative">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {user?.profilePicture && !profileImageError ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                    onError={() => setProfileImageError(true)}
                    priority
                    unoptimized
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md z-50 py-4 px-4">
          <div className="flex flex-col space-y-4">
            {/* Mobile user profile section */}
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {user?.profilePicture && !profileImageError ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover"
                    onError={() => setProfileImageError(true)}
                    priority
                    unoptimized
                  />
                ) : (
                  <UserIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <div>
                <p className="font-medium">{user?.username || 'User'}</p>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 text-[#1E4959]" />
                  <span className="text-sm ml-1">
                    Streak: {user?.streak ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile menu links */}
            <Link
              href="/entries"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Entries
            </Link>
          </div>
        </div>
      )}

      {/* User sidebar */}
      <UserSidebar
        user={user}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
    </>
  );
}
