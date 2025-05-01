import React from 'react';
import { Entry } from '@/index/entry';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { TagSelector } from '@/components/custom/tag-selector';

interface EntryCardProps {
  entry: Entry;
  truncatedContent: string;
  availableTags: string[];
  addingTagsToEntry: bigint | null;
  onEntryClick: (publicId: string) => void;
  onFavoriteToggle: (entry: Entry) => void;
  onShareClick: (e: React.MouseEvent, entryId: bigint) => void;
  onDeleteClick: (e: React.MouseEvent, entryId: bigint) => void;
  onRemoveTag: (e: React.MouseEvent, entryId: bigint, tagName: string) => void;
  onAddTagToEntry: (entryId: bigint, tag: string) => void;
  onSetAddingTagsToEntry: (entryId: bigint | null) => void;
  onRemoveTagFromEntry: (entryId: bigint, tagName: string) => Promise<void>; // Added for TagSelector
}

const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  truncatedContent,
  availableTags,
  addingTagsToEntry,
  onEntryClick,
  onFavoriteToggle,
  onShareClick,
  onDeleteClick,
  onRemoveTag,
  onAddTagToEntry,
  onSetAddingTagsToEntry,
  onRemoveTagFromEntry, // Added
}) => {
  if (!entry) return null;

  return (
    <li
      key={entry.id}
      className="p-4 border rounded-lg shadow-sm relative hover:shadow-lg transition-shadow duration-200 hover:p-5 transform hover:-translate-y-1"
    >
      <div
        className="absolute top-2 right-2 cursor-pointer p-1"
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle(entry);
        }}
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
      <div className="cursor-pointer">
        <div onClick={() => onEntryClick(entry.publicId)}>
          <h2 className="text-xl font-semibold">{entry.title}</h2>
          <p className="text-gray-600 mb-2">{truncatedContent}</p>
          <p className="text-sm text-gray-500 mb-2">
            {new Date(entry.journalDate).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-10" onClick={(e) => e.stopPropagation()}>
          {addingTagsToEntry === entry.id ? (
            <TagSelector
              selectedTags={entry.tags}
              availableTags={availableTags}
              onTagAdd={(tag) => onAddTagToEntry(entry.id, tag)}
              onTagRemove={async (tag) => {
                await onRemoveTagFromEntry(entry.id, tag);
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              {entry.tags.map((tag: string, idx: number) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-[#003243] text-white px-2 py-1 text-sm rounded-full flex items-center gap-1 group"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tag}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTag(e, entry.id, tag);
                    }}
                    className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetAddingTagsToEntry(entry.id);
                }}
                className="text-sm text-gray-500 hover:text-[#003243]"
              >
                + Add Tag
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="absolute bottom-2 right-2 flex space-x-2">
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
          onClick={(e) => onShareClick(e, entry.id)}
        >
          Share
        </button>
        <button
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
          onClick={(e) => {
            onDeleteClick(e, entry.id);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default EntryCard;
