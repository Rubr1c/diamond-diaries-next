import { User } from './user';

export interface Entry {
  id: bigint;
  publicId: string;
  tags: string[];
  folderId: bigint;
  user: User;
  title: string;
  content: string;
  wordCount: number;
  journalDate: Date;
  dateCreated: Date;
  lastEdited: Date;
  isFavorite: boolean;
}
