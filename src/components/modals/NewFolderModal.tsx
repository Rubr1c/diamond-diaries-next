import { newFolder } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'sonner';

interface NewFolderModalProps {
  onClose: () => void;
  onCreate: () => void;
}

export default function NewFolderModal({
  onClose,
  onCreate,
}: NewFolderModalProps) {
  const [name, setName] = useState('');

  async function handleCreateFolder() {
    try {
      await newFolder(name);
      setName('');
      onCreate();
      onClose();
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-[#003243]">
          Create Folder
        </h2>
        <input
          type="text"
          name="name"
          placeholder="Folder name"
          className="border border-gray-300 rounded-md p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#003243] focus:border-transparent cursor-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:shadow-sm cursor-pointer hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 rounded-md bg-[#003243] text-white hover:bg-[#004d6b] transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-105"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
