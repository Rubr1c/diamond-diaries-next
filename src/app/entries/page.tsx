'use client';

import { Entry } from '@/index/entry';
import { getUser, fetchEntries, searchEntries, deleteEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { marked } from 'marked';

export default function EntriesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchedEntries, setSearchedEntries] = useState<Entry[] | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { error: userError } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

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

  if (error || userError) {
    localStorage.removeItem('token');
    router.push('/login');
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
    const html = marked(normalized);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-16">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mt-4">
          <h1 className="text-2xl font-bold text-[#003243] mb-4">
            Journal Entries
          </h1>
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
                  className="p-4 border rounded-lg shadow-sm relative hover:shadow-lg transition-shadow duration-200 hover:p-5 transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleEntryClick(entry.publicId)}
                >
                  <h2 className="text-xl font-semibold">{entry.title}</h2>
                  <p className="text-gray-600">
                    {/* Render the first 200 chars, stripped of markdown */}
                    {stripMarkdownAndTruncate(entry.content, 200)}
                  </p>
                  <p>{entry.journalDate.toString()}</p>
                  <button
                    className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleDelete(entry.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
