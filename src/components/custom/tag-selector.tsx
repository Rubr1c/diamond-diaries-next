'use client';

import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  className = '',
  showAddNew = true,
}: TagSelectorProps) {
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsTagPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      ref={containerRef}
    >
      {/* Tag Input and Selection */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={currentTagInput}
          onChange={(e) => setCurrentTagInput(e.target.value)}
          onClick={() => setIsTagPopoverOpen(true)}
          placeholder="Click to add tags..."
          className="cursor-pointer w-full"
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
          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-[300px] overflow-y-auto">
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
