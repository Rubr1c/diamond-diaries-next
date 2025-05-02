'use client';

import {
  fetchEntryByUuid,
  editEntry,
  getAllMediaForEntry,
  uploadMediaToEntry,
  deleteMedia,
} from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'; // Import useMutation
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { AxiosProgressEvent } from 'axios';

export default function EntryPage() {
  const {} = useUser();
  const params = useParams();
  const queryClient = useQueryClient();
  const entryRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // State for upload progress
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false); // State for overall upload process

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

  const deleteMediaMutation = useMutation({
    mutationFn: ({ entryId, mediaId }: { entryId: bigint; mediaId: bigint }) =>
      deleteMedia(entryId, mediaId),
    onSuccess: () => {
      toast.success('Media deleted successfully!');
      queryClient.invalidateQueries({ queryKey: [`media-${id}`] });
    },
    onError: (error) => {
      toast.error(`Failed to delete media: ${error.message}`);
      console.error('Delete failed', error);
    },
  });

  const handleDeleteMedia = (mediaId: bigint) => {
    if (!entry) return;
    deleteMediaMutation.mutate({ entryId: entry.id, mediaId });
  };

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

  const handleUploadProgress = (progressEvent: AxiosProgressEvent) => {
    if (progressEvent.lengthComputable) {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      }
    } else {
      console.log('Upload progress: total size unknown');
    }
  };

  async function handleUploadMedia() {
    if (!entry || !selectedFile) return;
    const currentFile = selectedFile;
    setIsUploadingMedia(true);
    setUploadProgress(0);
    const mime = currentFile.type;
    const inferredType: 'IMAGE' | 'VIDEO' | 'FILE' = mime.startsWith('image/')
      ? 'IMAGE'
      : mime.startsWith('video/')
      ? 'VIDEO'
      : 'FILE';
    try {
      await uploadMediaToEntry(
        entry.id,
        inferredType,
        currentFile,
        handleUploadProgress
      );
      toast.success('Media uploaded successfully!');
      await queryClient.refetchQueries({
        queryKey: [`media-${id}`],
        exact: true,
      });
    } catch (e) {
      console.error('Upload failed', e);
      toast.error(
        `Upload failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      );
    } finally {
      setSelectedFile(null);
      setUploadProgress(null);
      setIsUploadingMedia(false);
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

      <div className="w-full max-w-4xl mx-auto mt-4 mb-8 p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Upload New Media</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            accept="*/*"
            onChange={(e) => {
              setSelectedFile(e.target.files?.[0] ?? null);
              setUploadProgress(null);
            }}
            className="flex-grow p-2 border rounded"
            disabled={isUploadingMedia}
          />
          <Button
            onClick={handleUploadMedia}
            disabled={!selectedFile || isUploadingMedia} 
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isUploadingMedia
              ? `Uploading... ${
                  uploadProgress !== null ? `${uploadProgress}%` : ''
                }` 
              : 'Upload'}
          </Button>
        </div>
        {isUploadingMedia && (
          <Progress
            value={uploadProgress ?? 0}
            className="w-full mt-3 h-2"
          />
        )}
      </div>

      {/* Media Display Section */}
      <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
        <h2 className="text-xl font-semibold mb-4">Attached Media</h2>
        {media && media.length > 0 ? (
          media.map((entryMedia) => (
            <div
              key={entryMedia.id}
              className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row items-center gap-4"
            >
              <div className="flex-grow">
                <p className="font-medium text-gray-700 mb-2 truncate">
                  {entryMedia.filename}
                </p>
                {entryMedia.type === 'IMAGE' ? (
                  <Image
                    src={entryMedia.presignedUrl}
                    alt={entryMedia.filename}
                    width={150}
                    height={100}
                    className="object-cover rounded"
                  />
                ) : entryMedia.type === 'VIDEO' ? (
                  <video width="200" height="150" controls className="rounded">
                    <source src={entryMedia.presignedUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : entryMedia.type === 'FILE' ? (
                  <div className="text-sm text-gray-500">Generic File</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={entryMedia.presignedUrl}
                  download={entryMedia.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteMedia(entryMedia.id)}
                  disabled={deleteMediaMutation.isPending}
                  title="Delete"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">
            No media attached to this entry.
          </p>
        )}
      </div>

      <p className="text-gray-600 text-sm mt-8 mb-4">
        {entry?.wordCount} words
      </p>
    </div>
  );
}
