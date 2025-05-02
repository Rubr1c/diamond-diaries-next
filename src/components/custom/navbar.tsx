import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FlameIcon, MenuIcon, UserIcon, XIcon } from 'lucide-react';
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
      <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed left-0 right-0 top-0 z-50 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center group transition-transform duration-200 hover:scale-105"
            >
              <Image
                src="/Diamond_Diaries_Logo_Teal.png"
                alt="Diamond Diaries Logo"
                className="mr-3"
                width={36}
                height={36}
              />
              <span className="self-center text-xl font-semibold whitespace-nowrap text-[#1E4959] group-hover:text-[#003243] transition-colors duration-200">
                Diamond Diaries
              </span>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-[#003243] focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4 ml-auto">
            <Link
              href="/entries"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 hover:text-[#003243] rounded-md transition-all duration-200 hover:shadow-sm"
            >
              Entries
            </Link>
            <Link
              href="/folders"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 hover:text-[#003243] rounded-md transition-all duration-200 hover:shadow-sm"
            >
              Folders
            </Link>

            <div className="relative group cursor-pointer">
              <div className="relative">
                <FlameIcon className="h-6 w-6 text-orange-500 group-hover:text-orange-600 transition-all duration-200 group-hover:scale-110" />
                <span className="absolute -top-2 -right-2 text-xs font-bold text-[#1E4959] bg-transparent">
                  {user?.streak ?? 0}
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-md"
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
                  <UserIcon className="h-5 w-5 text-gray-600 group-hover:text-[#003243]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md z-50 py-4 px-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <button
                onClick={() => {
                  setSidebarOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-sm"
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
                  <UserIcon className="h-6 w-6 text-gray-600 hover:text-[#003243]" />
                )}
              </button>
              <div>
                <p className="font-medium">{user?.username || 'User'}</p>
                <div className="flex items-center">
                  <FlameIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm ml-1 font-medium">
                    Streak: {user?.streak ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/entries"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 hover:text-[#003243] rounded-md transition-all duration-200 hover:shadow-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Entries
            </Link>
            <Link
              href="/folders"
              className="py-2 px-3 text-[#1E4959] hover:bg-gray-100 hover:text-[#003243] rounded-md transition-all duration-200 hover:shadow-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Folders
            </Link>
          </div>
        </div>
      )}

      <UserSidebar
        user={user}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
    </>
  );
}
