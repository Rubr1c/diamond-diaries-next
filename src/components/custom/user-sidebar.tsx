'use client';

import { User } from '@/index/user';
import Image from 'next/image';
import { UserIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface UserSidebarProps {
  user: User | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserSidebar({
  user,
  isOpen,
  onOpenChange,
}: UserSidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState(false);

  // Disable body scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleLogout() {
    logout();
    queryClient.invalidateQueries({ queryKey: ['user'] });
    onOpenChange(false);
    router.push('/login');
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div
        className="fixed inset-0 bg-black/20"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed right-0 top-0 h-full w-[300px] bg-white shadow-lg border-l border-gray-200 animate-slide-in overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl text-[#003243] font-semibold">User Profile</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close sidebar"
          >
            <XIcon className="h-6 w-6 text-gray-500 hover:text-[#003243]" />
          </button>
        </div>
        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
            {user?.profilePicture && !imageError ? (
              <Image
                src={user.profilePicture}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover"
                onError={() => setImageError(true)}
                priority
                unoptimized
              />
            ) : (
              <UserIcon className="h-12 w-12 text-gray-600" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-[#003243]">
              {user?.username || 'User'}
            </h3>
            <div className="mt-2 flex items-center justify-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm text-gray-600">Streak:</span>
              <span className="text-sm font-semibold text-[#003243]">
                {user?.streak || '0'}
              </span>
            </div>
          </div>
          <div className="w-full border-t border-gray-200 my-4"></div>
          <div className="w-full space-y-3">
            <Link
              href="/account"
              className="w-full flex items-center px-4 py-2.5 hover:bg-gray-100 hover:text-[#003243] rounded-md transition-all duration-200 text-gray-700 hover:shadow-sm hover:pl-5"
            >
              Account Settings
            </Link>
            <button
              className="w-full flex items-center px-4 py-2.5 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-md transition-all duration-200 hover:cursor-pointer hover:shadow-sm hover:pl-5"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this to your globals.css file if it doesn't exist already
// @keyframes slide-in {
//   from { transform: translateX(100%); }
//   to { transform: translateX(0); }
// }
// .animate-slide-in {
//   animation: slide-in 0.3s ease-out;
// }
