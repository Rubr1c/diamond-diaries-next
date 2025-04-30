'use client';

import {
  fetchEntryByUuid,
  editEntry,
  getAllMediaForEntry,
  uploadMediaToEntry,
} from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';

export default function EntryPage() {
  const {} = useUser();
  const params = useParams();
  const queryClient = useQueryClient();
  const entryRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const router = useRouter();

  const id = params.id as string;
  const { data: entry } = useQuery({
    queryKey: [`entry-${id}`],
    queryFn: () => fetchEntryByUuid(id),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: media } = useQuery({
    queryKey: [`media-${id}`],
    queryFn: () => getAllMediaForEntry(entry?.id),
    enabled: !!entry,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 900000,
  });

  const handleGeneratePdf = async () => {
    if (!entryRef.current) return;

    const contentElement = entryRef.current;

    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: contentElement.scrollWidth,
      windowHeight: contentElement.scrollHeight,
    });

    const margin = 20;
    const imgWidth = 210 - 2 * margin;
    const pageHeight = 297 - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });

    pdf.addImage(
      canvas.toDataURL('image/jpeg', 1.0),
      'JPEG',
      margin,
      margin,
      imgWidth,
      imgHeight
    );

    let heightLeft = imgHeight - pageHeight;
    let position = -pageHeight;

    while (heightLeft >= 0) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        margin,
        position + margin,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    await pdf.save('document.pdf');
  };

  function handleEditEntry() {
    if (!entry) return;
    router.push(`/entries/${id}/edit`);
  }

  async function handleFavoriteToggle() {
    if (!entry) return;

    await editEntry(entry.id, { isFavorite: !entry.isFavorite });
    queryClient.invalidateQueries({ queryKey: [`entry-${id}`] });
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  }

  async function handleUploadMedia() {
    if (!entry || !selectedFile) return;
    // Infer mediaType from file MIME type
    const mime = selectedFile.type;
    const inferredType: 'IMAGE' | 'VIDEO' | 'FILE' = mime.startsWith('image/')
      ? 'IMAGE'
      : mime.startsWith('video/')
      ? 'VIDEO'
      : 'FILE';
    try {
      await uploadMediaToEntry(entry.id, inferredType, selectedFile);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: [`media-${id}`] });
    } catch (e) {
      console.error('Upload failed', e);
    }
  }

  return (
    <div className="mt-20 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <button
        onClick={handleEditEntry}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
      >
        Edit
      </button>
      <div
        className="prose prose-lg w-full max-w-4xl mx-auto px-8"
        ref={entryRef}
      >
        <MarkdownRenderer
          content={entry?.content.replace(/\\n/g, '\n') ?? ''}
        />
      </div>

      <div className="flex justify-center mt-8 mb-8">
        <button
          onClick={handleFavoriteToggle}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
        >
          {entry?.isFavorite ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-300"
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
          <span>
            {entry?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </span>
        </button>
      </div>
      <button
        onClick={handleGeneratePdf}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
      >
        Export
      </button>

      {/* Upload media section */}
      <div className="flex items-center space-x-2 mt-4">
        <input
          type="file"
          accept="*/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={handleUploadMedia}
          disabled={!selectedFile}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Upload
        </button>
      </div>

      {media &&
        media.length > 0 &&
        media.map((entryMedia) => {
          if (entryMedia.type === 'IMAGE') {
            return (
              <Image
                src={entryMedia.presignedUrl}
                key={entryMedia.id}
                alt="media image"
                width={320}
                height={240}
                className="object-cover"
              />
            );
          } else if (entryMedia.type === 'VIDEO') {
            return (
              <video width="320" height="240" controls key={entryMedia.id}>
                <source src={entryMedia.presignedUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            );
          } else if (entryMedia.type === 'FILE') {
            return (
              <a
                href={entryMedia.presignedUrl}
                key={entryMedia.id}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Download File
              </a>
            );
          }
        })}
      <p className="text-gray-600 text-sm mt-2">{entry?.wordCount} words</p>
    </div>
  );
}
