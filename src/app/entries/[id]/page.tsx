'use client';

import {
  fetchEntryByUuid,
  editEntry,
  getAllMediaForEntry,
  uploadMediaToEntry,
  deleteMedia,
  deleteEntry,
} from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'; // Import useMutation
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { AxiosProgressEvent } from 'axios';
import { Media } from '@/index/media';

export default function EntryPage() {
  const {} = useUser();
  const params = useParams();
  const queryClient = useQueryClient();
  const entryRef = useRef<HTMLDivElement>(null);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // State for upload progress
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false); // State for overall upload process
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showDeleteMediaConfirm, setShowDeleteMediaConfirm] =
    useState<boolean>(false);
  const [mediaToDelete, setMediaToDelete] = useState<{
    entryId: bigint;
    mediaId: bigint;
  } | null>(null);

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

  const deleteEntryMutation = useMutation({
    mutationFn: () => deleteEntry(entry!.id),
    onSuccess: () => {
      toast.success('Entry deleted successfully!');
      router.push('/entries');
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
      console.error('Delete failed', error);
    },
  });

  const handleDeleteMedia = (mediaId: bigint) => {
    if (!entry) return;
    setMediaToDelete({ entryId: entry.id, mediaId });
    setShowDeleteMediaConfirm(true);
  };

  const confirmDeleteMedia = () => {
    if (!mediaToDelete) return;

    const mediaElement = document.querySelector(
      `[data-media-id="${mediaToDelete.mediaId}"]`
    );
    if (mediaElement) {
      mediaElement.classList.add('animate-delete');
      setTimeout(() => {
        deleteMediaMutation.mutate(mediaToDelete);
      }, 500);
    } else {
      deleteMediaMutation.mutate(mediaToDelete);
    }

    setShowDeleteMediaConfirm(false);
    setMediaToDelete(null);
    if (selectedMedia && selectedMedia.id === mediaToDelete.mediaId) {
      closeMediaFullscreen();
    }
  };

  const cancelDeleteMedia = () => {
    setShowDeleteMediaConfirm(false);
    setMediaToDelete(null);
  };

  const handleDeleteEntry = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = () => {
    if (!entry) return;
    deleteEntryMutation.mutate();
    setShowDeleteConfirm(false);
  };

  const cancelDeleteEntry = () => {
    setShowDeleteConfirm(false);
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

  async function handleUploadMedia(fileToUpload: File) {
    if (!entry) return;
    // Remove comment about selectedFile since we removed that state
    setIsUploadingMedia(true);
    setUploadProgress(0);
    const mime = fileToUpload.type;
    const inferredType: 'IMAGE' | 'VIDEO' | 'FILE' = mime.startsWith('image/')
      ? 'IMAGE'
      : mime.startsWith('video/')
      ? 'VIDEO'
      : 'FILE';
    try {
      await uploadMediaToEntry(
        entry.id,
        inferredType,
        fileToUpload,
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
      setUploadProgress(null);
      setIsUploadingMedia(false);
    }
  }

  // Function to truncate filename
  const truncateFilename = (filename: string) => {
    if (!filename) return '';
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension
      return filename.length <= 5 ? filename : filename.substring(0, 5) + '...';
    }

    const name = filename.substring(0, lastDotIndex);
    const extension = filename.substring(lastDotIndex);

    // If name is already 5 chars or less, show it in full
    return name.length <= 5
      ? filename
      : name.substring(0, 5) + '...' + extension;
  };

  const openMediaFullscreen = (media: Media) => {
    setSelectedMedia(media);
  };

  const closeMediaFullscreen = () => {
    setSelectedMedia(null);
  };

  const heartAnimationClass = entry?.isFavorite
    ? 'transform scale-110 transition-transform duration-300 animate-heartbeat'
    : 'transition-all duration-300 hover:scale-110';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003243] to-[#002233] pt-20 pb-72 px-4">
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full transform transition-all duration-200 hover:shadow-2xl cursor-pointer">
            <h3 className="text-xl font-bold text-[#003243] mb-4">
              Delete Entry
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {entry?.title}? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteEntry}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEntry}
                disabled={deleteEntryMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-105 flex items-center cursor-pointer"
              >
                {deleteEntryMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteMediaConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full transform transition-all duration-200 hover:shadow-2xl cursor-pointer">
            <h3 className="text-xl font-bold text-[#003243] mb-4">
              Delete Media
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this media? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDeleteMedia}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 hover:scale-105 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMedia}
                disabled={deleteMediaMutation.isPending}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 hover:scale-105 flex items-center cursor-pointer"
              >
                {deleteMediaMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => handleDeleteMedia(selectedMedia.id)}
                disabled={deleteMediaMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={closeMediaFullscreen}
                className="bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#003243]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-[#003243] mb-4">
                {selectedMedia.filename}
              </h3>

              <div className="flex justify-center">
                {selectedMedia.type === 'IMAGE' ? (
                  <div className="relative w-full h-[70vh]">
                    <Image
                      src={selectedMedia.presignedUrl}
                      alt={selectedMedia.filename}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : selectedMedia.type === 'VIDEO' ? (
                  <video controls className="w-full max-h-[70vh]" autoPlay>
                    <source src={selectedMedia.presignedUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : selectedMedia.type === 'FILE' ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg w-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-24 w-24 text-[#003243] mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-lg text-[#003243]">
                      {selectedMedia.filename}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-center mt-6 gap-4">
                <a
                  href={selectedMedia.presignedUrl}
                  download={selectedMedia.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#003243] text-white px-6 py-2 rounded-lg hover:bg-[#004d6b] hover:shadow-md transition-all duration-200 cursor-pointer flex items-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-bold text-[#003243] mb-4">
            {entry?.title}
          </h1>
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleEditEntry}
              className="flex items-center space-x-2 px-4 py-2 bg-[#003243] text-white rounded-lg shadow-sm hover:bg-[#004d6b] hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={handleFavoriteToggle}
              className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              {entry?.isFavorite ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-red-500 ${heartAnimationClass}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 text-gray-300 hover:text-red-400 ${heartAnimationClass}`}
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
              <span className="text-[#003243]">
                {entry?.isFavorite
                  ? 'Remove from Favorites'
                  : 'Add to Favorites'}
              </span>
            </button>
            <button
              onClick={handleGeneratePdf}
              className="flex items-center space-x-2 px-4 py-2 bg-[#003243] text-white rounded-lg shadow-sm hover:bg-[#004d6b] hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Download className="h-5 w-5 mr-1" />
              Export PDF
            </button>
            <button
              onClick={handleDeleteEntry}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-sm hover:bg-red-600 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="h-5 w-5 mr-1" />
              Delete
            </button>
          </div>
        </div>

        <div
          className="prose prose-lg w-full max-w-4xl mx-auto px-8 py-6 bg-white rounded-lg shadow-sm mb-8"
          ref={entryRef}
        >
          <MarkdownRenderer
            content={entry?.content.replace(/\\n/g, '\n') ?? ''}
          />
        </div>

        <p className="text-gray-600 text-sm mt-8 mb-4 text-center">
          {entry?.wordCount} words
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 shadow-lg p-4 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#003243]">
              Attached Media
            </h2>
            <label
              htmlFor="file-upload"
              className="bg-[#01C269] hover:bg-[#01A050] text-white rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center"
            >
              <input
                id="file-upload"
                type="file"
                accept="*/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file) {
                    setUploadProgress(null);
                    handleUploadMedia(file);
                  }
                }}
                disabled={isUploadingMedia}
              />
              {isUploadingMedia ? (
                <span className="flex items-center">
                  Uploading...{' '}
                  {uploadProgress !== null ? `${uploadProgress}%` : ''}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Media
                </span>
              )}
            </label>
          </div>

          {isUploadingMedia && (
            <Progress
              value={uploadProgress ?? 0}
              className="w-full mb-4 h-2 bg-gray-200"
            />
          )}

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 items-center">
              {media && media.length > 0 ? (
                media.map((entryMedia) => (
                  <div
                    key={entryMedia.id}
                    data-media-id={entryMedia.id.toString()}
                    className="relative flex-shrink-0 w-[220px] border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => openMediaFullscreen(entryMedia)}
                  >
                    <div className="absolute top-2 right-2 flex gap-2">
                      <a
                        href={entryMedia.presignedUrl}
                        download={entryMedia.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer bg-white rounded-full p-1 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
                      >
                        <Download className="h-5 w-5 text-[#003243]" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(entryMedia.id);
                        }}
                        disabled={deleteMediaMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="p-3">
                      <p className="font-medium text-[#003243] mb-2 truncate text-sm">
                        {truncateFilename(entryMedia.filename)}
                      </p>
                      {entryMedia.type === 'IMAGE' ? (
                        <div className="relative overflow-hidden rounded-lg hover:shadow-md transition-all duration-200 h-[150px]">
                          <Image
                            src={entryMedia.presignedUrl}
                            alt={entryMedia.filename}
                            fill
                            className="object-cover rounded-lg hover:scale-105 transition-all duration-200"
                          />
                        </div>
                      ) : entryMedia.type === 'VIDEO' ? (
                        <div className="relative rounded-lg hover:shadow-md transition-all duration-200 h-[150px] overflow-hidden">
                          <video
                            width="200"
                            height="150"
                            className="rounded-lg hover:shadow-md transition-all duration-200 object-cover h-full w-full"
                          >
                            <source
                              src={entryMedia.presignedUrl}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center hover:scale-110 transition-all duration-200">
                            <div className="bg-black/30 rounded-full p-3 backdrop-blur-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-8 w-8 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : entryMedia.type === 'FILE' ? (
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 h-[150px] justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-[#003243] hover:scale-110 transition-all duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center w-full">
                  No media attached to this entry.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
