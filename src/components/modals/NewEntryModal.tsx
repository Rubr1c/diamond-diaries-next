'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newEntry, fetchAllFolders, fetchAllTags } from '@/lib/api';
import { Folder } from '@/index/folder';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const entrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(), // Store as string initially
  tagNames: z.array(z.string()).optional(),
});

type EntryFormData = z.infer<typeof entrySchema>;

const NewEntryModal: React.FC<NewEntryModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: fetchAllFolders,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { data: availableTags } = useQuery<string[]>({
    queryKey: ['tags'],
    queryFn: fetchAllTags,
    enabled: isOpen, // Only fetch when modal is open
  });

  const { control, handleSubmit, register, watch, reset, setValue } =
    useForm<EntryFormData>({
      resolver: zodResolver(entrySchema),
      defaultValues: {
        title: '',
        content: '',
        folderId: undefined,
        tagNames: [],
      },
    });

  const contentValue = watch('content');
  const wordCount = contentValue?.split(/\s+/).filter(Boolean).length || 0;

  const filteredTags = (availableTags || []).filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      (!currentTagInput ||
        tag.toLowerCase().includes(currentTagInput.toLowerCase()))
  );

  const mutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      folderId?: bigint;
      tagNames?: string[];
      wordCount: number;
      isFavorite: boolean;
    }) => newEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      onClose();
      reset();
      setSelectedTags([]);
    },
    onError: (error) => {
      console.error('Error creating entry:', error);
      alert('Failed to create entry.');
    },
  });

  const onSubmit = (data: EntryFormData) => {
    const submissionData = {
      ...data,
      folderId: data.folderId ? BigInt(data.folderId) : undefined,
      tagNames: selectedTags,
      wordCount,
      isFavorite: false, // Default to false
    };
    mutation.mutate(submissionData);
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setValue('tagNames', [...selectedTags, tag]); // Update form state
    }
    setCurrentTagInput(''); // Clear input after selection
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    setValue('tagNames', updatedTags); // Update form state
  };

  const handleCreateNewTag = () => {
    if (currentTagInput && !selectedTags.includes(currentTagInput)) {
      handleAddTag(currentTagInput);
      setIsTagPopoverOpen(false);
    }
  };

  // Prevent dropdown from closing when clicking inside it
  const handleTagPopoverOpenChange = (open: boolean) => {
    // Only allow manual closing, don't close when interacting with the popover content
    if (!open && isTagPopoverOpen) {
      // We're trying to close the popover
      if (document.activeElement && 
          document.activeElement.closest('[data-tag-popover-content]')) {
        // If focus is still inside the popover content, don't close it
        return;
      }
    }
    setIsTagPopoverOpen(open);
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedTags([]);
      setCurrentTagInput('');
    }
  }, [isOpen, reset]);

  const handleTagSelection = (tag: string) => {
    handleAddTag(tag);
    // Keep the popover open after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Force popover to stay open
  const tagPopoverRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#003243]">Create New Journal Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <Input id="title" {...register('title')} />
          </div>

          <div>
            <label
              htmlFor="folderId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Folder (Optional)
            </label>
            <Controller
              name="folderId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 shadow-sm">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md">
                    {folders?.map((folder) => (
                      <SelectItem
                        key={folder.id.toString()}
                        value={folder.id.toString()}
                        className="hover:bg-gray-100"
                      >
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Content
            </label>
            <Textarea
              id="content"
              {...register('content')}
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Word Count: {wordCount}
            </p>
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tags (Optional)
            </label>
            
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
                      handleRemoveTag(tag);
                    }}
                    className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {/* Completely revamped Tag Input and Selection */}
            <div className="relative">
              <Input
                ref={inputRef}
                id="tags"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onClick={() => setIsTagPopoverOpen(true)}
                placeholder="Click to add tags..."
                className="cursor-pointer"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    if (currentTagInput) {
                      handleCreateNewTag();
                    }
                  } else if (e.key === 'Escape') {
                    setIsTagPopoverOpen(false);
                  }
                }}
              />
              
              {/* Custom Tag Dropdown instead of Popover */}
              {isTagPopoverOpen && (
                <div 
                  className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-[200px] overflow-y-auto"
                  ref={tagPopoverRef}
                >
                  <div className="p-2">
                    <div className="flex flex-wrap gap-2">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 hover:bg-[#003243] hover:text-white cursor-pointer px-3 py-1 text-sm rounded-full inline-block mb-2"
                            onClick={() => handleTagSelection(tag)}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <div className="w-full text-center py-2 text-sm text-gray-500">
                          {currentTagInput ? (
                            <>
                              <p>No matching tags found</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleCreateNewTag}
                                className="mt-1"
                              >
                                Create "{currentTagInput}"
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
            <p className="text-xs text-gray-500 mt-1">
              Click on a tag to add it or type to filter available tags
            </p>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#01C269] hover:bg-[#01A055]"
            >
              {mutation.isPending ? 'Creating...' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewEntryModal;
