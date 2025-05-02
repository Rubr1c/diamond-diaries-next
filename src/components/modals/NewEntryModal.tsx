'use client';

import React, { useState, useEffect } from 'react';
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
import { TagSelector } from '@/components/custom/tag-selector';
import { entrySchema } from '@/schemas/entry-schemas';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EntryFormData = z.infer<typeof entrySchema>;

const NewEntryModal: React.FC<NewEntryModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: folders } = useQuery<Folder[]>({
    queryKey: ['folders'],
    queryFn: fetchAllFolders,
    enabled: isOpen,
  });

  const { data: availableTags } = useQuery<string[]>({
    queryKey: ['tags'],
    queryFn: fetchAllTags,
    enabled: isOpen,
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
      isFavorite: false,
    };
    mutation.mutate(submissionData);
  };

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setValue('tagNames', [...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(updatedTags);
    setValue('tagNames', updatedTags);
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
      setSelectedTags([]);
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white p-6 shadow-lg border border-gray-200 rounded-lg">
        <DialogHeader className="pb-2 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-[#003243]">
            Create New Journal Entry
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-[#003243] mb-1"
            >
              Title
            </label>
            <Input
              id="title"
              {...register('title')}
              className="focus-visible:ring-[#003243]/50 transition-all duration-200 shadow-sm"
            />
          </div>

          <div>
            <label
              htmlFor="folderId"
              className="block text-sm font-medium text-[#003243] mb-1"
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
                  <SelectTrigger className="w-full bg-white border-gray-300 shadow-sm focus-visible:ring-[#003243]/50 transition-all duration-200">
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-md">
                    {folders?.map((folder) => (
                      <SelectItem
                        key={folder.id.toString()}
                        value={folder.id.toString()}
                        className="hover:bg-gray-100 transition-colors duration-200"
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
              className="block text-sm font-medium text-[#003243] mb-1"
            >
              Content
            </label>
            <Textarea
              id="content"
              {...register('content')}
              rows={8}
              className="resize-none focus-visible:ring-[#003243]/50 transition-all duration-200 shadow-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              Word Count: {wordCount}
            </p>
          </div>

          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-[#003243] mb-1"
            >
              Tags (Optional)
            </label>
            <TagSelector
              selectedTags={selectedTags}
              availableTags={availableTags || []}
              onTagAdd={handleAddTag}
              onTagRemove={handleRemoveTag}
              className="mb-2"
            />
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map((tag, idx) => (
                  <div
                    key={idx}
                    className="bg-[#003243] text-white px-2 py-0.5 text-xs rounded-full flex items-center gap-1 transition-all duration-200 hover:bg-[#004d6b] hover:shadow-sm"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full hover:bg-red-500 hover:text-white p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white hover:scale-110"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-6">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 transition-all duration-200 hover:shadow-sm hover:scale-105 cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#003243] hover:bg-[#004d6b] text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 cursor-pointer"
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
