'use client';

import { User } from '@/index/user';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { UserIcon } from 'lucide-react';

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[300px] h-full fixed right-0 top-0 rounded-l-lg rounded-r-none transform-none translate-x-0 translate-y-0 m-0 !left-auto !top-0 !translate-x-0 !translate-y-0 !bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl">User Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              <UserIcon className="h-12 w-12 text-gray-600" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium">{user?.username || 'User'}</h3>
            <div className="mt-2 flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Streaks:</span>
              <span className="text-sm font-semibold">
                {user?.streaks || '0'}
              </span>
            </div>
          </div>
          <div className="w-full border-t border-gray-200 my-4"></div>
          <div className="w-full space-y-2">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition-colors">
              My Journal
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition-colors">
              Settings
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition-colors">
              Logout
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
