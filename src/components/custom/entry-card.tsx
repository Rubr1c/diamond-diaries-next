import React, { useState } from 'react';
import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder';
import { Badge } from '@/components/ui/badge';
import { X, Folder as FolderIcon } from 'lucide-react';
import { TagSelector } from '@/components/custom/tag-selector';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  editEntry,
  deleteEntry,
  addTagsToEntry,
  removeTagFromEntry,
  removeEntryFromFolder, // Added removeEntryFromFolder import
} from '@/lib/api';

interface EntryCardProps {
  entry: Entry;
  truncatedContent: string;
  availableTags: string[];
  availableFolders: Folder[]; // Added availableFolders prop
  onEntryClick: (publicId: string) => void;
  onShareClick: (e: React.MouseEvent, entryId: bigint) => void; // Keep for modal control
  queryKeyToInvalidate: string[]; // Key(s) to invalidate in the parent component
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  truncatedContent,
  availableTags,
  availableFolders, // Destructure availableFolders
  onEntryClick,
  onShareClick,
  queryKeyToInvalidate,
}) => {
  const [isAddingTags, setIsAddingTags] = useState(false);
  const queryClient = useQueryClient();

  // --- Mutations ---
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
    },
    onError: (error) => console.error('Error deleting entry:', error),
  });

  const addTagMutation = useMutation({
    mutationFn: (tag: string) => addTagsToEntry(entry.id, [tag]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: ['tags'] }); // Invalidate available tags too
      setIsAddingTags(false); // Close selector after adding
    },
    onError: (error) => console.error('Failed to add tag:', error),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagName: string) => removeTagFromEntry(entry.id, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // Keep selector open after removing
    },
    onError: (error) => console.error('Failed to remove tag:', error),
  });

  // Mutation for changing folder (using editEntry)
  const editFolderMutation = useMutation({
    mutationFn: (folderId: bigint) => editEntry(entry.id, { folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });
    },
    onError: (error) => console.error('Error changing entry folder:', error),
  });

  // Mutation for removing entry from folder
  const removeFolderMutation = useMutation({
    mutationFn: () => removeEntryFromFolder(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
      queryClient.invalidateQueries({ queryKey: [`entry-${entry.publicId}`] });
    },
    onError: (error) =>
      console.error('Error removing entry from folder:', error),
  });

  // --- End Mutations ---

  if (!entry) return null;

  // --- Event Handlers ---
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    editMutation.mutate({ isFavorite: !entry.isFavorite });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate();
  };

  const handleAddTag = (tag: string) => {
    addTagMutation.mutate(tag);
  };

  const handleRemoveTag = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    removeTagMutation.mutate(tagName);
  };

  // Handler for folder change
  const handleFolderChange = (value: string) => {
    // value will be folderId as string or 'null' for no folder
    if (value === 'null') {
      // Call removeEntryFromFolder mutation
      removeFolderMutation.mutate();
    } else {
      // Call editEntry mutation with the new folderId
      const newFolderId = BigInt(value);
      editFolderMutation.mutate(newFolderId);
    }
  };
  // --- End Event Handlers ---

  return (
    <li
      key={entry.id}
      className="p-4 border rounded-lg shadow-sm relative hover:shadow-lg transition-shadow duration-200 hover:p-5 transform hover:-translate-y-1 flex flex-col justify-between min-h-[200px]" // Added flex layout and min-height
    >
      {/* Top section: Favorite icon */}
      <div
        className="absolute top-2 right-2 cursor-pointer p-1"
        onClick={handleFavoriteToggle}
      >
        {entry?.isFavorite ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-500 cursor-pointer"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-300 cursor-pointer"
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

      {/* Middle section: Content and Tags */}
      <div className="flex-grow cursor-pointer mb-4">
        {' '}
        {/* Added flex-grow and mb-4 */}
        <div onClick={() => onEntryClick(entry.publicId)} className="mb-4">
          {' '}
          {/* Added mb-4 */}
          <h2 className="text-xl font-semibold mb-1">{entry.title}</h2>{' '}
          {/* Added mb-1 */}
          <p className="text-gray-600 mb-2 text-sm line-clamp-3">
            {truncatedContent}
          </p>{' '}
          {/* Added line-clamp */}
          <p className="text-xs text-gray-500 mb-2">
            {' '}
            {/* Adjusted text size */}
            {new Date(entry.journalDate).toLocaleDateString()}
          </p>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          {' '}
          {/* Removed mb-10 */}
          {isAddingTags ? (
            <TagSelector
              selectedTags={entry.tags}
              availableTags={availableTags}
              onTagAdd={handleAddTag}
              onTagRemove={(tag) => removeTagMutation.mutate(tag)}
              // Add a way to close the selector, e.g., an explicit close button or clicking outside
              // For simplicity now, it closes on add, stays open on remove.
            />
          ) : (
            <div className="flex flex-wrap gap-1 items-center">
              {' '}
              {/* Reduced gap */}
              {entry.tags.map((tag: string, idx: number) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-[#003243] text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1 group" // Adjusted padding/text size
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag}
                  <button
                    onClick={(e) => handleRemoveTag(e, tag)}
                    className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-2.5 w-2.5" /> {/* Adjusted icon size */}
                  </button>
                </Badge>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddingTags(true);
                }}
                className="text-xs text-gray-500 hover:text-[#003243]" // Adjusted text size
              >
                + Add Tag
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Actions (Folder Select, Share, Delete) */}
      <div className="flex items-center justify-end space-x-2 mt-auto pt-2 border-t border-gray-100">
        {' '}
        {/* Added flex, items-center, justify-end, mt-auto, pt-2, border-t */}
        {/* Folder Select Dropdown */}
        <div onClick={(e) => e.stopPropagation()} className="w-32">
          {' '}
          {/* Added container with width */}
          <Select
            value={entry.folderId?.toString() ?? 'null'} // Use 'null' string for no folder
            onValueChange={handleFolderChange}
          >
            <SelectTrigger className="h-8 text-xs">
              {' '}
              {/* Adjusted height and text size */}
              <FolderIcon className="h-3 w-3 mr-1" /> {/* Added icon */}
              <SelectValue placeholder="Select Folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null" className="text-xs">
                No Folder
              </SelectItem>{' '}
              {/* Option for no folder */}
              {availableFolders?.map((folder) => (
                <SelectItem
                  key={folder.id.toString()}
                  value={folder.id.toString()}
                  className="text-xs"
                >
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Share Button */}
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs" // Adjusted padding/text size
          onClick={(e) => onShareClick(e, entry.id)}
        >
          Share
        </button>
        {/* Delete Button */}
        <button
          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs" // Adjusted padding/text size
          onClick={handleDeleteClick}
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default EntryCard;
