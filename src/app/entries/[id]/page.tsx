'use client';

import { fetchEntryByUuid } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function EntryPage() {
  const params = useParams();

  const id = params.id as string;
  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="mt-20">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <p>Entry ID: {entry?.publicId}</p>
    </div>
  );
}
