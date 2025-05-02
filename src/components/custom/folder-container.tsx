import { Folder } from '@/index/folder';
import { useRouter } from 'next/navigation';
import { TrashIcon } from 'lucide-react';
import { deleteFolder } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

export default function FolderContainer({ folder }: { folder: Folder }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);

  function handleFolderClick() {
    router.push(`/folders/${folder.publicId}`);
  }

  async function handleDeleteFolder(e: React.MouseEvent) {
    e.stopPropagation(); // Prevent folder click event
    setShowConfirmation(true);
  }

  async function confirmDelete() {
    try {
      await deleteFolder(folder.id);
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success(`Folder "${folder.name}" deleted successfully`);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
      setShowConfirmation(false);
    }
  }

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[#003243]/30 transition-all duration-200 cursor-pointer transform hover:translate-y-[-2px] relative"
      onClick={handleFolderClick}
    >
      {showConfirmation && (
        <div
          className="absolute inset-0 bg-white rounded-lg z-10 flex flex-col items-center justify-center p-4 border-2 border-red-200 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-center mb-4 font-medium text-sm">
            Delete{' '}
            <span className="font-bold text-[#003243]">{folder.name}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-all duration-200 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-all duration-200 hover:shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 group">
          <div className="text-[#003243] bg-gray-100 p-2 rounded-md hover:bg-[#003243]/10 transition-colors duration-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-medium text-[#003243] group-hover:text-[#004d6b]">
            {folder.name}
          </h2>
        </div>
        <button
          onClick={handleDeleteFolder}
          className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all duration-200 hover:scale-110"
          aria-label={`Delete folder ${folder.name}`}
        >
          <TrashIcon size={18} />
        </button>
      </div>
    </div>
  );
}
