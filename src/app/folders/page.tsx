'use client';

import FolderContainer from '@/components/custom/folder-container';
import NewFolderModal from '@/components/modals/NewFolderModal';
import { useUser } from '@/hooks/useUser';
import { fetchAllFolders } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PlusIcon } from 'lucide-react';

export default function FoldersPage() {
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const {} = useUser();
  const {
    data: folders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['folders'],
    queryFn: fetchAllFolders,
    refetchOnWindowFocus: false,
  });
  const queryClient = useQueryClient();

  function handleCreateFolder() {
    setFolderModalOpen(true);
  }

  function handleFolderCreated() {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  }

  if (isLoading)
    return <div className="p-6 text-center">Loading folders...</div>;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error loading folders</div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6 bg-white rounded-lg shadow-md mt-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#003243]">My Folders</h1>
          <button
            className="bg-[#01C269] text-white p-3 rounded-full hover:bg-[#01A050] hover:shadow-md hover:scale-105 transition-all duration-200 flex items-center justify-center w-12 h-12"
            onClick={handleCreateFolder}
            aria-label="Create new folder"
          >
            <PlusIcon size={24} />
          </button>
        </div>

        {folders?.length === 0 ? (
          <div className="text-lg text-center py-10 text-gray-500">
            No folders found. Create your first folder to organize your entries.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders?.map((folder) => (
              <FolderContainer key={folder.id.toString()} folder={folder} />
            ))}
          </div>
        )}

        {folderModalOpen && (
          <NewFolderModal
            onClose={() => setFolderModalOpen(false)}
            onCreate={handleFolderCreated}
          />
        )}
      </div>
    </div>
  );
}
