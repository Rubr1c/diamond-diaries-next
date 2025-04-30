import { z } from 'zod';

export const entrySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
});