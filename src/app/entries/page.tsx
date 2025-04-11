'use client';

import { Entry } from '@/index/entry';
import { getUser, fetchEntries, serachEntries, deleteEntry } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

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
      setSearchedEntries(null); // Clear search
      return;
    }
    serachEntries(value).then((results) => {
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
                  className="p-4 border rounded-lg shadow-sm relative"
                >
                  <h2 className="text-xl font-semibold">{entry.title}</h2>
                  <p className="text-gray-600">{entry.content}</p>
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
