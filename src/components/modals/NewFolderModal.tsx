import { newFolder } from '@/lib/api';
import { useState } from 'react';

interface NewFolderModalProps {
    onClose: () => void;
    onCreate: () => void;
}

export default function NewFolderModal({ onClose, onCreate }: NewFolderModalProps) {
    const [name, setName] = useState('');

    async function handleCreateFolder() {
        await newFolder(name);
        setName('');
        onCreate();
        onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Folder</h2>
                <input
                    type="text"
                    name="name"
                    placeholder="Folder name"
                    className="border border-gray-300 rounded-md p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <div className="flex justify-end space-x-3 mt-4">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCreateFolder}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        disabled={!name.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
