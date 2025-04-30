'use client';

import { Entry } from '@/index/entry';
import {
  fetchEntries,
  searchEntries,
  deleteEntry,
  editEntry,
  removeTagFromEntry,
  fetchAllTags,
  addTagsToEntry,
  fetchAllEntriesByTags,
  fetchEntriesByDateRange,
} from '@/lib/api';
import {
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import { useUser } from '@/hooks/useUser';
import ShareEntryModal from '@/components/modals/ShareEntryModal';
import NewEntryModal from '@/components/modals/NewEntryModal';
import { TagSelector } from '@/components/custom/tag-selector';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { JournalCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

export default function EntriesPage() {
  const {} = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchedEntries, setSearchedEntries] = useState<Entry[] | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<bigint | null>(null);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [addingTagsToEntry, setAddingTagsToEntry] = useState<bigint | null>(null);

  // Fetch all available tags
  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchAllTags,
  });

  // Fetch entries by date range when dates are selected
  const { data: dateFilteredEntries } = useQuery({
    queryKey: ['entries', 'date-range', dateRange],
    queryFn: () => {
      if (!dateRange[0] || !dateRange[1]) return null;
      return fetchEntriesByDateRange(
        format(dateRange[0], 'yyyy-MM-dd'),
        format(dateRange[1], 'yyyy-MM-dd')
      );
    },
    enabled: !!dateRange[0] && !!dateRange[1],
    retry: false,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ['entries', filterTags],
    queryFn: async ({ pageParam = 0 }) => {
      const result = filterTags.length > 0
        ? await fetchAllEntriesByTags(filterTags, pageParam, PAGE_SIZE)
        : await fetchEntries(pageParam, PAGE_SIZE);
      return {
        entries: result,
        nextPage: result.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !dateRange[0] && !dateRange[1], // Disable when date range is selected
  });

  // Handle date range selection
  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setDateRange([startDate, endDate]);
    setSearchedEntries(null); // Clear search results when date range is selected
  };

  // Clear date range filter
  const clearDateFilter = () => {
    setDateRange([null, null]);
  };

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Tag filter handlers
  const handleAddFilterTag = (tag: string) => {
    setFilterTags((prev) => [...prev, tag]);
  };

  const handleRemoveFilterTag = (tag: string) => {
    setFilterTags((prev) => prev.filter((t) => t !== tag));
  };

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
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-center items-center min-h-[200px]">
              <p>Loading entries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-red-500">
                Error loading entries. Please try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Flatten all pages of entries
  const entries = data?.pages.flatMap((page) => page.entries) ?? [];

  if (entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
        <div className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-[#003243]">
                Journal Entries
              </h1>
              <button
                onClick={() => setIsNewEntryModalOpen(true)}
                className="bg-[#003243] text-white px-4 py-2 rounded-md hover:bg-[#002233]"
              >
                New Entry
              </button>
            </div>

            {/* Filter by tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Tags
              </label>
              <TagSelector
                selectedTags={filterTags}
                availableTags={availableTags}
                onTagAdd={handleAddFilterTag}
                onTagRemove={handleRemoveFilterTag}
                showAddNew={false}
              />
            </div>

            <div className="flex justify-center items-center min-h-[200px]">
              <p className="text-gray-500">
                {filterTags.length > 0
                  ? 'No entries found with the selected tags'
                  : 'No entries yet. Create your first entry!'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
      // Update entries list cache for immediate UI update
      queryClient.setQueryData<Entry[]>(['entries'], (old) =>
        old?.map((e) =>
          e.id === entryId
            ? { ...e, tags: e.tags.filter((t) => t !== tagName) }
            : e
        )
      );
      queryClient.setQueryData<Entry>([`entry-${entryId}`], (old) =>
        old ? { ...old, tags: old.tags.filter((t) => t !== tagName) } : old
      );

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

  // New functions for tag management
  const handleAddTagToEntry = async (entryId: bigint, tag: string) => {
    try {
      await addTagsToEntry(entryId, [tag]);
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#003243]">
              Journal Entries
            </h1>
            <button
              onClick={() => setIsNewEntryModalOpen(true)}
              className="bg-[#003243] text-white px-4 py-2 rounded-md hover:bg-[#002233]"
            >
              New Entry
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Filter by tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Tags
              </label>
              <TagSelector
                selectedTags={filterTags}
                availableTags={availableTags}
                onTagAdd={handleAddFilterTag}
                onTagRemove={handleRemoveFilterTag}
                showAddNew={false}
              />
            </div>

            {/* Filter by date range */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Filter by Date Range
                </label>
                {(dateRange[0] || dateRange[1]) && (
                  <button
                    onClick={clearDateFilter}
                    className="text-sm text-[#003243] hover:text-[#002233]"
                  >
                    Clear Date Range
                  </button>
                )}
              </div>
              <JournalCalendar
                entries={[]}
                value={dateRange as [Date | null, Date | null]}
                onChange={(value) => {
                  if (Array.isArray(value) && value[0] && value[1]) {
                    handleDateRangeSelect(value[0], value[1]);
                  }
                }}
                selectRange={true}
              />
            </div>
          </div>

          {/* Search input */}
          <input
            type="text"
            placeholder="Search"
            className="w-full p-2 border rounded-md mb-4"
            onChange={(e) => {
              const value = e.target.value;
              if (debounceTimeout.current)
                clearTimeout(debounceTimeout.current);
              debounceTimeout.current = setTimeout(() => {
                handleSearch(value);
              }, 300);
            }}
          />

          {/* Entries list */}
          <ul className="space-y-4">
            {(() => {
              const entriesToDisplay =
                searchedEntries ??
                dateFilteredEntries ??
                data?.pages?.flatMap((page) => page.entries) ??
                [];
              return entriesToDisplay.map((entry: Entry) => {
                if (!entry) return null;
                return (
                  <li
                    key={entry.id}
                    className="p-4 border rounded-lg shadow-sm relative hover:shadow-lg transition-shadow duration-200 hover:p-5 transform hover:-translate-y-1"
                  >
                    {/* Heart icon for favorites */}
                    <div
                      className="absolute top-2 right-2 cursor-pointer p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteToggle(entry);
                      }}
                    >
                      {entry?.isFavorite ? (
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
                    <div className="cursor-pointer">
                      <div onClick={() => handleEntryClick(entry.publicId)}>
                        <h2 className="text-xl font-semibold">{entry.title}</h2>
                        <p className="text-gray-600 mb-2">
                          {stripMarkdownAndTruncate(entry.content, 200)}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(entry.journalDate).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Tags section with add functionality */}
                      <div
                        className="mb-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {addingTagsToEntry === entry.id ? (
                          <TagSelector
                            selectedTags={entry.tags}
                            availableTags={availableTags}
                            onTagAdd={(tag) =>
                              handleAddTagToEntry(entry.id, tag)
                            }
                            onTagRemove={(tag) => {
                              removeTagFromEntry(entry.id, tag).then(() => {
                                queryClient.invalidateQueries({
                                  queryKey: ['entries'],
                                });
                              });
                            }}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2 items-center">
                            {entry.tags.map((tag: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-[#003243] text-white px-2 py-1 text-sm rounded-full flex items-center gap-1 group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tag}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(e, entry.id, tag);
                                  }}
                                  className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                                  aria-label={`Remove tag ${tag}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddingTagsToEntry(entry.id);
                              }}
                              className="text-sm text-gray-500 hover:text-[#003243]"
                            >
                              + Add Tag
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Buttons container */}
                    <div className="absolute bottom-2 right-2 flex space-x-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                        onClick={(e) => handleShareClick(e, entry.id)}
                      >
                        Share
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              });
            })()}
          </ul>

          {/* Load more indicator - only show when no date filter is active */}
          {!dateRange[0] && !dateRange[1] && (
            <div
              ref={loadMoreRef}
              className="h-10 flex items-center justify-center mt-4"
            >
              {isFetchingNextPage ? (
                <div className="text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#003243] border-t-transparent rounded-full animate-spin"></div>
                  Loading more...
                </div>
              ) : hasNextPage ? (
                <p className="text-gray-500">Scroll for more entries</p>
              ) : entries?.length > 0 ? (
                <p className="text-gray-500">No more entries to load</p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareEntryModal
        entryId={selectedEntryId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
      />
    </div>
  );
}
