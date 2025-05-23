import React, { useEffect, useState } from 'react';
import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder';
import { Badge } from '@/components/ui/badge';
import { X, Folder as FolderIcon, Share2, Trash2 } from 'lucide-react';
import { TagSelector } from '@/components/custom/tag-selector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  editEntry,
  deleteEntry,
  addTagsToEntry,
  removeTagFromEntry,
  removeEntryFromFolder,
} from '@/lib/api';
import { toast } from 'sonner';

export interface EntryCardProps {
  entry: Entry;
  truncatedContent: string;
  availableTags: string[];
  availableFolders: Folder[];
  onEntryClick: (publicId: string) => void;
  onShareClick: (e: React.MouseEvent, entryId: bigint) => void;
  queryKeyToInvalidate: string[];
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  truncatedContent,
  availableTags,
  availableFolders,
  onEntryClick,
  onShareClick,
  queryKeyToInvalidate,
}) => {
  const [isAddingTags, setIsAddingTags] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tooltipVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('.tag-tooltip-container') &&
        !target.closest('.tag-badge-trigger')
      ) {
        setTooltipVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tooltipVisible]);

  const editMutation = useMutation({
    mutationFn: (data: Partial<Entry>) => editEntry(entry.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });
    },
    onError: (error) => console.error('Error updating entry:', error),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEntry(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      toast.success('Entry deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    },
  });

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => addTagsToEntry(entry.id, [tag]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: ['tags'] }); // Invalidate available tags too
      setIsAddingTags(false);
    },
    onError: (error) => console.error('Failed to add tag:', error),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagName: string) => removeTagFromEntry(entry.id, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => console.error('Failed to remove tag:', error),
  });

  const editFolderMutation = useMutation({
    mutationFn: (folderId: bigint) => editEntry(entry.id, { folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });
    },
    onError: (error) => console.error('Error changing entry folder:', error),
  });

  const removeFolderMutation = useMutation({
    mutationFn: () => removeEntryFromFolder(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });
    },
    onError: (error) =>
      console.error('Error removing entry from folder:', error),
  });

  if (!entry) return null;

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    editMutation.mutate({ isFavorite: !entry.isFavorite });
  };

  // Animation classes for the heart icon
  const heartAnimationClass = entry?.isFavorite
    ? 'transform scale-110 transition-transform duration-300 animate-heartbeat'
    : 'transition-all duration-300 hover:scale-110';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Show confirmation instead of deleting immediately
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);

    // Add animation class before deleting
    const entryElement = e.currentTarget.closest('li');
    if (entryElement) {
      entryElement.classList.add('animate-delete');
      // Wait for animation to complete before actual deletion
      setTimeout(() => {
        deleteMutation.mutate();
      }, 500);
    } else {
      deleteMutation.mutate();
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleAddTag = (tag: string) => {
    addTagMutation.mutate(tag);
  };

  const handleRemoveTag = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    removeTagMutation.mutate(tagName);
  };

  const handleFolderChange = (value: string) => {
    if (value === 'null') {
      removeFolderMutation.mutate();
    } else {
      const newFolderId = BigInt(value);
      editFolderMutation.mutate(newFolderId);
    }
  };

  return (
    <li
      key={entry.id}
      className="p-4 border rounded-lg shadow-sm relative bg-white flex flex-col justify-between min-h-[200px] cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#003243] hover:scale-[1.01]"
      onClick={() => onEntryClick(entry.publicId)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-xl font-semibold text-[#003243] transition-colors duration-200 hover:text-[#004d6b]">
            {entry.title}
          </h2>
          <p className="text-xs text-gray-500 transition-colors duration-200 hover:text-gray-700">
            {new Date(entry.journalDate).toLocaleDateString()}
          </p>
        </div>
        <div className="cursor-pointer" onClick={handleFavoriteToggle} data-testid="favorite-toggle" >
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
              className={`h-6 w-6 text-gray-300 ${heartAnimationClass}`}
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
        </div>
      </div>

      <div className="cursor-pointer mb-3">
        <p className="text-gray-600 text-sm line-clamp-3 transition-colors duration-200 hover:text-gray-900">
          {truncatedContent}
        </p>
      </div>

      {/* Tags section */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        {isAddingTags ? (
          <TagSelector
            selectedTags={entry.tags}
            availableTags={availableTags}
            onTagAdd={handleAddTag}
            onTagRemove={(tag) => removeTagMutation.mutate(tag)}
            autoFocus={true}
          />
        ) : (
          <div className="flex flex-wrap gap-1 items-center">
            {entry.tags.slice(0, 3).map((tag: string, idx: number) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-[#003243] text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1 transition-all duration-200 hover:bg-[#004d6b] hover:shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
                <button
                  onClick={(e) => handleRemoveTag(e, tag)}
                  className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white hover:scale-110"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}

            {entry.tags.length > 3 && (
              <div className="relative">
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-700 px-2 py-0.5 text-xs rounded-full cursor-pointer tag-badge-trigger transition-all duration-200 hover:bg-gray-300 hover:shadow-sm"
                  onClick={() => setTooltipVisible(true)}
                >
                  +{entry.tags.length - 3}
                </Badge>

                {tooltipVisible && (
                  <div className="absolute left-0 top-full mt-2 z-20 tag-tooltip-container transition-all duration-200">
                    <div className="bg-white border border-gray-200 rounded-md shadow-lg p-2 min-w-[150px] transition-transform duration-200 hover:shadow-xl">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-gray-500">More tags:</p>
                        <button
                          onClick={() => setTooltipVisible(false)}
                          className="text-gray-500 hover:text-gray-700 transition-colors duration-200 hover:scale-110"
                          aria-label="Close tooltip"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {entry.tags.slice(3).map((tag: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between transition-colors duration-200 hover:bg-gray-50 px-1 rounded"
                          >
                            <span className="text-xs text-gray-700">{tag}</span>
                            <button
                              onClick={(e) => {
                                handleRemoveTag(e, tag);
                                // Keep tooltip open after removing a tag
                                e.stopPropagation();
                              }}
                              className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-white hover:scale-110"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingTags(true);
                setTimeout(() => {
                  const inputElement = document.querySelector(
                    '.tag-selector-input'
                  );
                  if (inputElement instanceof HTMLInputElement) {
                    inputElement.focus();
                  }
                }, 0);
              }}
              className="text-xs text-gray-500 hover:text-[#003243] transition-all duration-200 hover:scale-105 hover:font-medium"
            >
              + Add Tag
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
          <FolderIcon className="h-4 w-4 text-gray-500 mr-1 transition-colors duration-200 group-hover:text-[#003243]" />
          <span className="text-xs text-gray-500 transition-colors duration-200 group hover:text-[#003243]">
            {entry.folderId
              ? availableFolders.find((f) => f.id === entry.folderId)?.name ||
                'Folder'
              : 'No Folder'}
          </span>
          <Select
            value={entry.folderId?.toString() ?? 'null'}
            onValueChange={handleFolderChange}
          >
            <SelectTrigger className="h-7 text-xs px-2 py-0 min-w-[80px] bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded ml-1 transition-all duration-200 hover:shadow-sm">
              <span className="text-xs">Change</span>
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200">
              <SelectItem
                value="null"
                className="text-xs hover:bg-gray-200 transition-colors"
              >
                No Folder
              </SelectItem>
              {availableFolders?.map((folder) => (
                <SelectItem
                  key={folder.id.toString()}
                  value={folder.id.toString()}
                  className="text-xs hover:bg-gray-200 transition-colors"
                >
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onShareClick(e, entry.id);
            }}
            aria-label="Share entry"
            data-testid="share-button"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer"
            onClick={handleDeleteClick}
            aria-label="Delete entry"
            data-testid="delete-button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex flex-col items-center justify-center z-10 p-4 shadow-md border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          data-testid="delete-confirm-dialog"
        >
          <p className="text-center mb-4 text-gray-800">
            Delete{' '}
            <span className="font-bold text-[#003243]">{entry.title}</span>?
          </p>
          <div className="flex space-x-3">
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all duration-200 hover:shadow-sm cursor-pointer"
              onClick={cancelDelete}
              data-testid="cancel-delete-button"
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all duration-200 hover:shadow-md cursor-pointer"
              onClick={confirmDelete}
              data-testid="confirm-delete-button"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export default EntryCard;
