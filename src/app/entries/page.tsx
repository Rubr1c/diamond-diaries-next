'use client';

import { Entry } from '@/index/entry';
import { fetchEntries, searchEntries, deleteEntry, editEntry, removeTagFromEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { marked } from 'marked';
import { useUser } from '@/hooks/useUser';
import ShareEntryModal from '@/components/modals/ShareEntryModal'; // Import the modal
import NewEntryModal from '@/components/modals/NewEntryModal'; // Import the new modal

export default function EntriesPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchedEntries, setSearchedEntries] = useState<Entry[] | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // State for modal visibility
  const [selectedEntryId, setSelectedEntryId] = useState<bigint | null>(null); // State for selected entry ID
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false); // State for new entry modal

  const {
    data: entries,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['entries'],
    queryFn: () => fetchEntries(0, 10),
    retry: false,
    refetchOnWindowFocus: false,
  });

  function handleSearch(value: string) {
    if (value.trim() === '') {
      setSearchedEntries(null);
      return;
    }
    searchEntries(value).then((results) => {
      setSearchedEntries(results);
    });
  }

  function handleDelete(entryId: bigint) {
    deleteEntry(entryId).then(() => {
      fetchEntries(0, 10).then(() => {
        queryClient.invalidateQueries({ queryKey: ['entries'] });
        setSearchedEntries(null);
      });
    });
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return null;
  }

  function handleEntryClick(entryId: string) {
    router.push(`/entries/${entryId}`);
  }

  // Function to strip markdown and truncate text
  function stripMarkdownAndTruncate(
    content: string,
    maxLength: number
  ): string {
    // Convert escaped newlines (\n) into actual newlines
    const normalized = content.replace(/\\n/g, '\n');

    // Convert Markdown to HTML
    const html = marked(normalized) as string;

    // Strip all HTML tags
    const plainText = html
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText;
  }

  async function handleFavoriteToggle(entry: Entry) {
    editEntry(entry.id, { isFavorite: !entry.isFavorite }).then(() => {
      // Invalidate both the entries list and the specific entry query
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });

      setSearchedEntries(
        (prevEntries) =>
          prevEntries?.map((e) =>
            e.id === entry.id ? { ...e, isFavorite: !e.isFavorite } : e
          ) ?? null
      );
    });
  }

  function handleShareClick(e: React.MouseEvent, entryId: bigint) {
    e.stopPropagation(); // Prevent triggering the entry click
    setSelectedEntryId(entryId);
    setIsShareModalOpen(true);
  }

  // Add handler for removing tags from entries
  async function handleRemoveTag(
    e: React.MouseEvent,
    entryId: bigint,
    tagName: string
  ) {
    e.stopPropagation(); // Prevent entry click
    try {
      await removeTagFromEntry(entryId, tagName);
      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: [`entry-${entryId}`] });

      // Update any searched entries state if applicable
      if (searchedEntries) {
        setSearchedEntries(
          searchedEntries.map((entry) => {
            if (entry.id === entryId) {
              return {
                ...entry,
                tags: entry.tags.filter((tag) => tag !== tagName),
              };
            }
            return entry;
          })
        );
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#003243]">
              Journal Entries
            </h1>
            <button onClick={() => setIsNewEntryModalOpen(true)}>
              New Entry
            </button>{' '}
            {/* Add New Entry Button */}
          </div>
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => {
              const value = e.target.value;
              if (debounceTimeout.current)
                clearTimeout(debounceTimeout.current);
              debounceTimeout.current = setTimeout(() => {
                handleSearch(value);
              }, 300);
            }}
          />

          <ul className="space-y-4">
            {entries &&
              entries.length > 0 &&
              (searchedEntries ?? entries)?.map((entry) => (
                <li
                  key={entry.id}
                  className="p-4 border rounded-lg shadow-sm relative hover:shadow-lg transition-shadow duration-200 hover:p-5 transform hover:-translate-y-1"
                >
                  {/* Heart icon for favorites */}
                  <div
                    className="absolute top-2 right-2 cursor-pointer p-1" // Added padding for easier clicking
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent entry click
                      handleFavoriteToggle(entry);
                    }}
                  >
                    {entry.isFavorite ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-red-500 cursor-pointer"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-300 cursor-pointer"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    )}
                  </div>
                  {/* Content clickable area */}
                  <div
                    onClick={() => handleEntryClick(entry.publicId)}
                    className="cursor-pointer"
                  >
                    <h2 className="text-xl font-semibold">{entry.title}</h2>
                    <p className="text-gray-600 mb-2">
                      {stripMarkdownAndTruncate(entry.content, 200)}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(entry.journalDate).toLocaleDateString()}
                    </p>
                    {/* Updated Tag rendering section with remove functionality */}
                    <ul className="mb-10">
                      {entry.tags.map((tag, idx) => (
                        <li
                          key={idx}
                          className="inline-block bg-[#003243] text-white rounded-full px-2 py-1 text-sm mr-2 mb-2 relative group"
                        >
                          <span>{tag}</span>

                          {/* Remove tag button - visible only on hover */}
                          <button
                            className="absolute -right-1 -top-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleRemoveTag(e, entry.id, tag)}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-3 h-3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Buttons container */}
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm" // Share button style
                      onClick={(e) => handleShareClick(e, entry.id)}
                    >
                      Share
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm" // Delete button style
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent entry click
                        handleDelete(entry.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
      {/* Render the share modal */}
      <ShareEntryModal
        entryId={selectedEntryId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      {/* Render the new entry modal */}
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
      />
    </div>
  );
}
