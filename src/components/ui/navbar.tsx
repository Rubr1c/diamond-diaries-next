import Image from 'next/image';
import Link from 'next/link';
import { UserIcon, FlameIcon } from 'lucide-react';
import { useState } from 'react';
import UserSidebar from './user-sidebar';
import { User } from '@/index/user';

interface NavbarProps {
  user?: User;
}

export default function Navbar({ user }: NavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <UserSidebar
        user={user}
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />
      <nav className="w-full bg-white px-4 py-2 flex items-center justify-between shadow-sm">
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

        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-600 hover:text-[#003243]">
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
    </>
  );
}
