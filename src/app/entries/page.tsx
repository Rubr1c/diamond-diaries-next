'use client';

import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder'; // Added Folder import
import {
  fetchEntries,
  searchEntries,
  fetchAllTags,
  fetchAllEntriesByTags,
  fetchEntriesByDateRange,
  fetchAllFolders, // Added fetchAllFolders import
} from '@/lib/api';
import {
  useQuery,
  useInfiniteQuery,
  // useQueryClient, // Keep commented out or remove if not needed for direct invalidations
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { marked } from 'marked';
import { useUser } from '@/hooks/useUser';
import ShareEntryModal from '@/components/modals/ShareEntryModal';
import NewEntryModal from '@/components/modals/NewEntryModal';
import { TagSelector } from '@/components/custom/tag-selector';
import { JournalCalendar } from '@/components/custom/calendar';
import { format } from 'date-fns';
import EntryCard from '@/components/custom/entry-card';
import Link from 'next/link';

const PAGE_SIZE = 10;

export default function EntriesPage() {
  const {} = useUser();
  const router = useRouter();
  const [searchedEntries, setSearchedEntries] = useState<Entry[] | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<bigint | null>(null);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  // Removed addingTagsToEntry state, now managed within EntryCard
  // Mutations for favorite, delete, add tag, remove tag are now handled within EntryCard

  const { data: availableTags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchAllTags,
  });

  // Fetch available folders
  const { data: availableFolders = [] } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: fetchAllFolders,
  });

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

  // removeTagMutation removed, handled in EntryCard

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
      const result =
        filterTags.length > 0
          ? await fetchAllEntriesByTags(filterTags, pageParam, PAGE_SIZE)
          : await fetchEntries(pageParam, PAGE_SIZE);
      return {
        entries: result,
        nextPage: result.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !dateRange[0] && !dateRange[1],
  });

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setDateRange([startDate, endDate]);
    setSearchedEntries(null);
  };

  const clearDateFilter = () => {
    setDateRange([null, null]);
  };

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

  function handleEntryClick(entryId: string) {
    router.push(`/entries/${entryId}`);
  }

  function stripMarkdownAndTruncate(
    content: string,
    maxLength: number
  ): string {
    const normalized = content.replace(/\\n/g, '\n');
    const html = marked(normalized) as string;
    const plainText = html
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength).trim() + '...'
      : plainText;
  }

  // handleFavoriteToggle removed, handled in EntryCard
  // handleDelete removed, handled in EntryCard
  // handleRemoveTag removed, handled in EntryCard
  // handleAddTagToEntry removed, handled in EntryCard

  // Function to handle opening the share modal (passed to EntryCard)
  const handleShareClick = (e: React.MouseEvent, entryId: bigint) => {
    e.stopPropagation();
    setSelectedEntryId(entryId);
    setIsShareModalOpen(true);
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
          <Link href="folders">Folders</Link>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

          {(() => {
            const displayData =
              searchedEntries ?? dateFilteredEntries ?? entries;
            const hasInitialLoadData = entries.length > 0;
            const hasFilterResults =
              searchedEntries !== null || dateFilteredEntries !== null;
            const shouldShowEmptyState =
              !hasInitialLoadData && !hasFilterResults;
            const shouldShowNoResultsMessage =
              (hasInitialLoadData || hasFilterResults) &&
              displayData.length === 0;

            if (shouldShowEmptyState) {
              return (
                <div className="flex justify-center items-center min-h-[200px]">
                  <p className="text-gray-500">
                    No entries yet. Create your first entry!
                  </p>
                </div>
              );
            } else if (shouldShowNoResultsMessage) {
              // Empty state after filtering/searching
              return (
                <div className="flex justify-center items-center min-h-[200px]">
                  <p className="text-gray-500">
                    {filterTags.length > 0
                      ? 'No entries found with the selected tags'
                      : dateRange[0] && dateRange[1]
                      ? 'No entries found in the selected date range'
                      : searchedEntries !== null
                      ? 'No entries match your search'
                      : 'No entries match your filters.'}
                  </p>
                </div>
              );
            } else {
              return (
                <ul className="space-y-4">
                  {displayData.map((entry: Entry) => {
                    if (!entry) return null;
                    const truncatedContent = stripMarkdownAndTruncate(
                      entry.content,
                      200
                    );
                    let queryKeyToInvalidate: string[];
                    if (dateRange[0] && dateRange[1]) {
                      // Use formatted dates to ensure string[] type
                      queryKeyToInvalidate = [
                        'entries',
                        'date-range',
                        format(dateRange[0], 'yyyy-MM-dd'),
                        format(dateRange[1], 'yyyy-MM-dd'),
                      ];
                    } else if (searchedEntries) {
                      // Assuming search invalidation uses a simple key
                      queryKeyToInvalidate = ['entries', 'search']; // This needs to match the actual search query key if different
                    } else {
                      // Spread filterTags to create a flat string array
                      queryKeyToInvalidate = ['entries', ...filterTags];
                    }

                    return (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        truncatedContent={truncatedContent}
                        availableTags={availableTags}
                        availableFolders={availableFolders} // Pass folders down
                        onEntryClick={handleEntryClick}
                        onShareClick={handleShareClick} // Pass the handler function
                        queryKeyToInvalidate={queryKeyToInvalidate}
                      />
                    );
                  })}
                </ul>
              );
            }
          })()}

          {!dateRange[0] && !dateRange[1] && !searchedEntries && (
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
        </div>{' '}
      </div>{' '}
      <ShareEntryModal
        entryId={selectedEntryId}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
      <NewEntryModal
        isOpen={isNewEntryModalOpen}
        onClose={() => setIsNewEntryModalOpen(false)}
      />
    </div> // End of main page div
  );
}
