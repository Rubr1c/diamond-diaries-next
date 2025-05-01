'use client';

import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'; // Import useQueryClient, useMutation
import {
  fetchAllEntriesFromFolder,
  fetchAllTags,
  deleteEntry,
  editEntry,
  removeTagFromEntry,
  addTagsToEntry,
} from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';
import { marked } from 'marked';
import { Entry } from '@/index/entry';
import EntryCard from '@/components/custom/entry-card';
import ShareEntryModal from '@/components/modals/ShareEntryModal';

export default function FolderPage() {
  const {} = useUser();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [addingTagsToEntry, setAddingTagsToEntry] = useState<bigint | null>(
    null
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<bigint | null>(null);

  const {
    data: entries,
    isLoading: isLoadingEntries,
    error: errorEntries,
  } = useQuery<Entry[]>({
    queryKey: [`folder-entries-${id}`],
    queryFn: () => fetchAllEntriesFromFolder(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: availableTags = [], isLoading: isLoadingTags } = useQuery<
    string[]
  >({
    // Specify string[] type
    queryKey: ['tags'],
    queryFn: fetchAllTags,
  });

  function handleEntryClick(publicId: string) {
    router.push(`/entries/${publicId}`);
  }

  function stripMarkdownAndTruncate(
    content: string,
    maxLength: number
  ): string {
    const normalized = content.replace(/\\\\n/g, '\n');
    const html = marked(normalized) as string;
    const plainText = html
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText;
  }

  const editMutation = useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: bigint;
      data: Partial<Entry>;
    }) => editEntry(entryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`folder-entries-${id}`] });
    },
    onError: (error) => {
      console.error('Error updating entry:', error);
    },
  });

  async function handleFavoriteToggle(entry: Entry) {
    editMutation.mutate({
      entryId: entry.id,
      data: { isFavorite: !entry.isFavorite },
    });
  }

  function handleShareClick(e: React.MouseEvent, entryId: bigint) {
    e.stopPropagation();
    setSelectedEntryId(entryId);
    setIsShareModalOpen(true);
  }

  const deleteMutation = useMutation({
    mutationFn: (entryId: bigint) => deleteEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`folder-entries-${id}`] });
    },
    onError: (error) => {
      console.error('Error deleting entry:', error);
    },
  });

  function handleDelete(entryId: bigint) {
    deleteMutation.mutate(entryId);
  }

  const removeTagMutation = useMutation({
    mutationFn: ({ entryId, tagName }: { entryId: bigint; tagName: string }) =>
      removeTagFromEntry(entryId, tagName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`folder-entries-${id}`] });
    },
    onError: (error) => {
      console.error('Error removing tag:', error);
    },
  });

  async function handleRemoveTag(
    e: React.MouseEvent,
    entryId: bigint,
    tagName: string
  ) {
    e.stopPropagation();
    removeTagMutation.mutate({ entryId, tagName });
  }

  // Mutation hook for adding tags
  const addTagMutation = useMutation({
    mutationFn: ({ entryId, tag }: { entryId: bigint; tag: string }) =>
      addTagsToEntry(entryId, [tag]),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`folder-entries-${id}`] });
    },
    onError: (error) => {
      console.error('Failed to add tag:', error);
    },
  });

  const handleAddTagToEntry = async (entryId: bigint, tag: string) => {
    addTagMutation.mutate({ entryId, tag });
  };

  if (isLoadingEntries || isLoadingTags) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-center items-center min-h-[200px]">
              <p>Loading folder content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errorEntries) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-red-500">
                Error loading entries for this folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const folderName = `Folder ${id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <h1 className="text-2xl font-bold text-[#003243] mb-4">
            {folderName}
          </h1>
          {entries?.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-gray-500">No entries found in this folder.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {entries?.map((entry) => {
                const truncatedContent = stripMarkdownAndTruncate(
                  entry.content,
                  200
                );
                return (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    truncatedContent={truncatedContent}
                    availableTags={availableTags}
                    addingTagsToEntry={addingTagsToEntry}
                    onEntryClick={handleEntryClick}
                    onFavoriteToggle={handleFavoriteToggle}
                    onShareClick={handleShareClick}
                    onDeleteClick={(e, id) => handleDelete(id)}
                    onRemoveTag={handleRemoveTag}
                    onAddTagToEntry={handleAddTagToEntry}
                    onSetAddingTagsToEntry={setAddingTagsToEntry}
                    onRemoveTagFromEntry={async (entryId, tagName) => {
                      await removeTagFromEntry(entryId, tagName);
                      queryClient.invalidateQueries({
                        queryKey: [`folder-entries-${id}`],
                      }); // Re-fetch on remove
                    }}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <ShareEntryModal
        entryId={selectedEntryId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
