'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  className?: string;
  showAddNew?: boolean;
}

export function TagSelector({
  selectedTags,
  availableTags,
  onTagAdd,
  onTagRemove,
  className = '',
  showAddNew = true,
}: TagSelectorProps) {
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = (availableTags || []).filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      (!currentTagInput ||
        tag.toLowerCase().includes(currentTagInput.toLowerCase()))
  );

  const handleCreateNewTag = () => {
    if (currentTagInput && !selectedTags.includes(currentTagInput)) {
      onTagAdd(currentTagInput);
      setCurrentTagInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className={className} onClick={(e) => e.stopPropagation()}>
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-3 min-h-8">
        {selectedTags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-[#003243] text-white px-2 py-1 text-sm rounded-full flex items-center gap-1 group"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagRemove(tag);
              }}
              className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Tag Input and Selection */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={currentTagInput}
          onChange={(e) => setCurrentTagInput(e.target.value)}
          onClick={() => setIsTagPopoverOpen(true)}
          placeholder="Click to add tags..."
          className="cursor-pointer"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (currentTagInput) {
                handleCreateNewTag();
              }
            } else if (e.key === 'Escape') {
              setIsTagPopoverOpen(false);
            }
          }}
        />

        {isTagPopoverOpen && (
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-[200px] overflow-y-auto">
            <div className="p-2">
              <div className="flex flex-wrap gap-2">
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 hover:bg-[#003243] hover:text-white cursor-pointer px-3 py-1 text-sm rounded-full inline-block mb-2"
                      onClick={() => {
                        onTagAdd(tag);
                        setCurrentTagInput('');
                        if (inputRef.current) {
                          inputRef.current.focus();
                        }
                      }}
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <div className="w-full text-center py-2 text-sm text-gray-500">
                    {currentTagInput && showAddNew ? (
                      <>
                        <p>No matching tags found</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCreateNewTag}
                          className="mt-1"
                        >
                          Create {currentTagInput}
                        </Button>
                      </>
                    ) : (
                      <p>No available tags</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-100 p-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTagPopoverOpen(false)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
