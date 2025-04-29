'use client';

import { getAllMediaForEntry, fetchSharedEntry } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import { useUser } from '@/hooks/useUser';

export default function EntryPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: user } = useUser();
  const params = useParams();
  const entryRef = useRef<HTMLDivElement>(null);

  const id = params.id as string;
  const { data: entry } = useQuery({
    queryKey: [`shared-entry-${id}`],
    queryFn: () => fetchSharedEntry(id),
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

  return (
    <div className="mt-20 flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold">{entry?.title}</h1>
      <div
        className="prose prose-lg w-full max-w-4xl mx-auto px-8"
        ref={entryRef}
      >
        <MarkdownRenderer
          content={entry?.content.replace(/\\n/g, '\n') ?? ''}
        />
      </div>

      <button
        onClick={handleGeneratePdf}
        className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-shadow"
      >
        Export
      </button>
      {media &&
        media?.length > 0 &&
        media?.map((entryMedia) => {
          if (entryMedia.type == 'IMAGE')
            return (
              <img
                src={entryMedia.presignedUrl}
                key={entryMedia.id}
                alt="image"
              />
            );
          else if (entryMedia.type == 'VIDEO')
            return (
              <video width="320" height="240" controls key={entryMedia.id}>
                <source src={entryMedia.presignedUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            );
        })}
      <p className="text-gray-600 text-sm mt-2">{entry?.wordCount} words</p>
    </div>
  );
}
