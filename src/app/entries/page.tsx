'use client';

import { getUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function EntriesPage() {
  const router = useRouter();
  const { isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
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
          <p className="text-gray-600">
            This page will display your journal entries.
          </p>
        </div>
      </div>
    </div>
  );
}
