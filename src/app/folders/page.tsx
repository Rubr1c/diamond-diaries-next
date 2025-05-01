'use client';

import FolderContainer from '@/components/custom/folder-container';
import NewFolderModal from '@/components/modals/NewFolderModal';
import { useUser } from '@/hooks/useUser';
import { fetchAllFolders } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading folders</div>;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Folders</h1>
      <div className="flex flex-col gap-2">
        {folders?.length === 0 ? (
          <div className="text-lg">No folders found</div>
        ) : (
          folders?.map((folder) => (
            <FolderContainer key={folder.id} folder={folder} />
          ))
        )}
      </div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleCreateFolder}
      >
        Create Folder
      </button>
      {folderModalOpen && (
        <NewFolderModal
          onClose={() => setFolderModalOpen(false)}
          onCreate={handleFolderCreated}
        />
      )}
    </div>
  );
}
