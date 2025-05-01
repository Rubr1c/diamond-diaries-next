import React, { useState, useEffect } from 'react';
import { createSharedEntry } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

interface ShareEntryModalProps {
  entryId: bigint | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShareEntryModal: React.FC<ShareEntryModalProps> = ({
  entryId,
  isOpen,
  onClose,
}) => {
  const [emails, setEmails] = useState<string>('');
  const [allowAnyone, setAllowAnyone] = useState<boolean>(false);

  const mutation = useMutation({
    mutationFn: (data: {
      entryId: bigint;
      allowedUsers: string[];
      allowAnyone: boolean;
    }) => createSharedEntry(data.entryId, data.allowedUsers, data.allowAnyone),
    onSuccess: (data) => {
      console.log('Shared entry created:', data);
      alert(
        `Shareable link created: ${window.location.origin}/entries/shared/${data}`
      );
      onClose();
    },
    onError: (error) => {
      console.error('Error sharing entry:', error);
      alert('Failed to share entry.');
    },
  });

  useEffect(() => {
    if (isOpen) {
      setEmails('');
      setAllowAnyone(false);
    }
  }, [isOpen, entryId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!entryId) return;

    const allowedUsers = allowAnyone
      ? []
      : emails
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email);

    mutation.mutate({ entryId, allowedUsers, allowAnyone });
  };

  if (!isOpen || !entryId) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-[#003243]">
          Share Entry
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="emails"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Share with specific people (comma-separated emails):
            </label>
            <input
              type="text"
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              disabled={allowAnyone}
              placeholder="user1@example.com, user2@example.com"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#003243] focus:border-[#003243] ${
                allowAnyone ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
          </div>

          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              id="allowAnyone"
              checked={allowAnyone}
              onChange={(e) => setAllowAnyone(e.target.checked)}
              className="h-4 w-4 text-[#003243] focus:ring-[#002233] border-gray-300 rounded"
            />
            <label
              htmlFor="allowAnyone"
              className="ml-2 block text-sm text-gray-900"
            >
              Allow anyone with the link to view
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-[#003243] text-white rounded-md hover:bg-[#002233] disabled:opacity-50"
            >
              {mutation.isPending ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareEntryModal;
