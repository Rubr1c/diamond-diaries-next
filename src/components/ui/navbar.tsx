import Image from 'next/image';
import Link from 'next/link';
import { UserIcon, FlameIcon, Menu } from 'lucide-react';
import { useState } from 'react';
import UserSidebar from './user-sidebar';
import { User } from '@/index/user';

interface NavbarProps {
  user?: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <>
      <UserSidebar
        user={user}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <nav className="w-full bg-white px-4 py-2 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/Diamond_Diaries_Logo_Teal.png"
              alt="Diamond Diaries"
              width={24}
              height={24}
              className="mr-2"
            />
            <span className="text-[#003243] font-semibold text-lg">
              Diamond Diaries
            </span>
          </Link>
        </div>

        {/* Mobile menu button - only visible on mobile */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-[#003243] hover:bg-gray-100 focus:outline-none"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden md:flex items-center space-x-6">
          <Link href="/entries" className="text-gray-600 hover:text-[#003243]">
            Journal Entries
          </Link>
          <Link
            href="/analytics"
            className="text-gray-600 hover:text-[#003243]"
          >
            Analytics
          </Link>
          <Link href="/settings" className="text-gray-600 hover:text-[#003243]">
            Settings
          </Link>

          <div className="flex items-center ml-2">
            {/* Streaks icon */}
            <div className="relative mr-3">
              <div className="w-8 h-8 rounded-full bg-[#01C269] flex items-center justify-center">
                <FlameIcon className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#003243] rounded-full flex items-center justify-center">
                <span className="text-white text-xs">{user?.streaks ?? 0}</span>
              </div>
            </div>

            {/* Profile picture */}
            <div className="relative">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
              >
                {user?.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
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
                {user?.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <UserIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
              <div>
                <p className="font-medium">{user?.username || 'User'}</p>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-full bg-[#01C269] flex items-center justify-center mr-1">
                    <FlameIcon className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">
                    {user?.streaks ?? 0} day streak
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <Link
              href="/"
              className="text-gray-600 hover:text-[#003243] py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Journal Entries
            </Link>
            <Link
              href="/analytics"
              className="text-gray-600 hover:text-[#003243] py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link
              href="/settings"
              className="text-gray-600 hover:text-[#003243] py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
