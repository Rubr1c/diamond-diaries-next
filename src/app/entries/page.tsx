'use client';

import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder'; // Added Folder import
import {
  fetchEntries,
  searchEntries,
  fetchAllTags,
  fetchAllEntriesByTags,
  fetchEntriesByDateRange,
  fetchAllFolders,
} from '@/lib/api';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, FolderIcon, PlusIcon, X } from 'lucide-react';

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
    // Clear tag filters when date range is selected
    setFilterTags([]);
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
    // Clear date range when adding a tag filter
    setDateRange([null, null]);
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
            <div className="flex items-center space-x-2">
              <Link
                href="folders"
                className="p-2 text-[#003243] hover:text-[#002233] bg-gray-100 hover:bg-gray-200 rounded-md flex items-center justify-center transition-all duration-200 hover:shadow-sm"
                aria-label="Folders"
              >
                <FolderIcon className="h-5 w-5" />
              </Link>
              <button
                onClick={() => setIsNewEntryModalOpen(true)}
                className="bg-[#003243] text-white p-2 rounded-md hover:bg-[#004d6b] flex items-center justify-center transition-all duration-200 hover:shadow-md hover:scale-105 hover:cursor-pointer"
                aria-label="New Entry"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search entries..."
                className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#003243] focus:border-[#003243]"
                onChange={(e) => {
                  const value = e.target.value;
                  if (debounceTimeout.current)
                    clearTimeout(debounceTimeout.current);
                  debounceTimeout.current = setTimeout(() => {
                    handleSearch(value);
                  }, 300);
                }}
              />
            </div>

            {/* Filter by Tags */}
            <div className="flex-grow-0 min-w-[150px] self-stretch flex items-center">
              <TagSelector
                selectedTags={filterTags}
                availableTags={availableTags}
                onTagAdd={handleAddFilterTag}
                onTagRemove={handleRemoveFilterTag}
                showAddNew={false}
              />
            </div>

            {/* Filter by date range */}
            <div className="flex-grow-0">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="group p-2 border rounded-md flex items-center justify-between bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-sm hover:border-[#003243]"
                    aria-label="Select date range"
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-500 group-hover:text-[#003243]" />
                      {dateRange[0] && dateRange[1] && (
                        <span className="text-xs text-gray-700 ml-1">
                          {format(dateRange[0], 'MM/dd')} -{' '}
                          {format(dateRange[1], 'MM/dd')}
                        </span>
                      )}
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-auto bg-white shadow-md border border-gray-200 rounded-md"
                  align="start"
                >
                  <div className="p-2 flex justify-between items-center border-b bg-[#003243] text-white">
                    <span className="text-sm font-medium">Date Range</span>
                    {(dateRange[0] || dateRange[1]) && (
                      <button
                        onClick={clearDateFilter}
                        className="text-xs text-white hover:text-gray-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="bg-white p-2">
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
                  {/* Clear button below calendar */}
                  {(dateRange[0] || dateRange[1]) && (
                    <div className="p-2 border-t border-gray-100 flex justify-center bg-white">
                      <button
                        onClick={clearDateFilter}
                        className="text-sm text-white bg-[#003243] hover:bg-[#002233] px-3 py-1 rounded-md transition-colors duration-200"
                      >
                        Clear Date Range
                      </button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selected Tags Display - Moved outside the flex container */}
          {filterTags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filterTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#003243] text-white px-2 py-1 text-sm rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveFilterTag(tag)}
                    className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Remove the duplicate search input div */}

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
                      queryKeyToInvalidate = [
                        'entries',
                        'date-range',
                        format(dateRange[0], 'yyyy-MM-dd'),
                        format(dateRange[1], 'yyyy-MM-dd'),
                      ];
                    } else if (searchedEntries) {
                      queryKeyToInvalidate = ['entries', 'search']; // This needs to match the actual search query key if different
                    } else {
                      queryKeyToInvalidate = ['entries', ...filterTags];
                    }

                    return (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        truncatedContent={truncatedContent}
                        availableTags={availableTags}
                        availableFolders={availableFolders}
                        onEntryClick={handleEntryClick}
                        onShareClick={handleShareClick}
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
