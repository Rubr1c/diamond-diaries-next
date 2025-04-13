'use client';

import { fetchEntryByUuid } from "@/lib/api";
import { editEntry } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function EntryPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const {data: entry} = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false
  })


  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');


  return (
    <div className="mt-20">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <p>Entry ID: {entry?.publicId}</p>
    </div>
  );
}
