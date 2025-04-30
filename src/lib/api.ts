import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder';
import { Media } from '@/index/media';
import { User } from '@/index/user';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://diamond-diaries.online' + '/api/' + 'v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  if (response.status == 202) return null;
  localStorage.setItem('token', response.data.token);
  return response.data;
}

export async function register(
  email: string,
  username: string,
  password: string
) {
  const response = await api.post('/auth/signup', {
    email,
    username,
    password,
  });
  return response.data;
}

export async function logout() {
  localStorage.removeItem('token');
}

export async function getUser(): Promise<User> {
  try {
    const response = await api.get('/user/me');
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    console.error('Error fetching user data:', error);
    throw error;
  }
}

export async function verifyEmail(email: string, verificationCode: string) {
  const response = await api.post('/auth/verify', { email, verificationCode });
  return response.data;
}

export async function verify2fa(email: string, verificationCode: string) {
  const response = await api.post('/auth/verify-2fa', {
    email,
    verificationCode,
  });
  localStorage.setItem('token', response.data.token);
  return response.data;
}

export async function resendVerificationCode(email: string) {
  const response = await api.post('/auth/resend-verification', {
    params: { email },
  });
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(
  email: string,
  verificationCode: string,
  newPassword: string
) {
  const response = await api.post('/auth/reset-password', {
    email,
    verificationCode,
    newPassword,
  });
  return response.data;
}

export function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    localStorage.setItem('token', token);
    return true;
  }
  return false;
}

export async function fetchEntries(
  offset: number,
  amount: number
): Promise<Entry[]> {
  const res = await api.get('/entry', {
    params: {
      offset,
      amount,
    },
  });
  console.log(offset, amount);
  console.log(res.data);

  return res.data;
}

export async function fetchEntry(entryId: bigint): Promise<Entry> {
  const res = await api.get(`/entry/${entryId}`);
  return res.data;
}

export async function fetchEntryByUuid(entryUuid: string): Promise<Entry> {
  const res = await api.get(`/entry/uuid/${entryUuid}`);

  return res.data;
}

export async function fetchEntriesByDate(date: string): Promise<Entry[]> {
  try {
    const res = await api.get(`/entry/date/${date}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function fetchEntriesByDateRange(
  startDate: string,
  endDate: string
): Promise<Entry[]> {
  const res = await api.get('/entry/time-range', {
    params: {
      startDate,
      endDate,
    },
  });
  return res.data;
}

export async function fetchAllEntriesByTags(
  tagNames: string[],
  offset: number,
  size: number
) {
  const res = await api.post('/entry/tag', tagNames, {
    params: { offset, size },
  });

  return res.data;
}

export async function addTagsToEntry(entryId: bigint, tagNames: string[]) {
  const res = await api.post(`/entry/${entryId}/tag/new`, tagNames);

  return res.data;
}

export async function removeTagFromEntry(entryId: bigint, tagName: string) {
  // Use encoded path parameter so tags including spaces work
  const encoded = encodeURIComponent(tagName);
  const res = await api.delete(`/entry/${entryId}/tag/${encoded}`);
  return res.data;
}

export async function fetchAllTags(): Promise<string[]> {
  const res = await api.get('/tags');
  return res.data;
}

export async function searchEntries(query: string): Promise<Entry[]> {
  const res = await api.get('/entry/search', {
    params: {
      query,
    },
  });

  console.log(res);

  return res.data;
}

// Helper function to convert BigInts in an object to strings
function convertBigIntToString(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    // Handle primitives (including bigint itself if passed directly)
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    // If it's an array, map over its elements recursively
    return obj.map(convertBigIntToString);
  }

  // If it's a non-null object (and not an array)
  const newObj: { [key: string]: unknown } = {}; // Use unknown for values
  // Assert obj as indexable Record<string, unknown> for safe property access
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key]; // Access value safely
      if (typeof value === 'bigint') {
        newObj[key] = value.toString();
      } else if (typeof value === 'object') {
        // Recurse for nested objects/arrays
        newObj[key] = convertBigIntToString(value);
      } else {
        newObj[key] = value; // Keep other primitives as they are
      }
    }
  }
  return newObj;
}

export async function newEntry(values: {
  title: string;
  content: string;
  folderId?: bigint;
  tagNames?: string[];
  wordCount: number;
  isFavorite: boolean;
}) {
  // Convert BigInt to string before sending
  const dataToSend = convertBigIntToString(values);
  const res = await api.post('/entry/new', dataToSend);

  return res.data;
}

export async function editEntry(
  entryId: bigint,
  updates: {
    title?: string;
    content?: string;
    folderId?: bigint;
    tagNames?: string[];
    wordCount?: number;
    isFavorite?: boolean;
  }
) {
  // Convert BigInts in the updates object to strings before sending
  const dataToSend = convertBigIntToString(updates);
  // Ensure the entryId in the path is also a string
  const res = await api.put(`/entry/${entryId}/update`, dataToSend);
  return res.data;
}

export async function addEntryToFolder(entryId: bigint, folderId: bigint) {
  // Convert BigInts to strings for path parameters
  const res = await api.post(`/entry/${entryId}/add-to-folder/${folderId}`);
  return res.data;
}

export async function removeEntryFromFolder(entryId: bigint) {
  // Convert BigInt to string for path parameter
  const res = await api.delete(`/entry/${entryId}/remove-from-folder`);
  return res.data;
}

export async function fetchAllEntriesFromFolder(
  folderId: bigint
): Promise<Entry[]> {
  const res = await api.get(`/entry/folder/${folderId}`);
  return res.data;
}

export async function generateAiPrompt() {
  const res = await api.get('/ai/daily-prompt');
  return res.data;
}

export async function newFolder(name: string) {
  const res = await api.post('/folder/new', { name });
  return res.data;
}

export async function getFolder(id: bigint): Promise<Folder> {
  const res = await api.get(`/folder/${id}`);
  return res.data;
}

export async function fetchAllFolders(): Promise<Folder[]> {
  const res = await api.get('/folder');
  return res.data;
}

export async function updateFolderName(folderId: bigint, newName: string) {
  const res = await api.put(`/folder/${folderId}/update-name/${newName}`);
  return res.data;
}

export async function deleteFolder(folderId: bigint) {
  const res = await api.delete(`/folder/${folderId}`);
  return res.data;
}

export async function createSharedEntry(
  entryId: bigint,
  allowedUsers: string[],
  allowAnyone: boolean
) {
  const res = await api.post(`/shared-entry/new`, {
    entryId,
    allowedUsers,
    allowAnyone,
  });
  return res.data;
}

export async function fetchSharedEntry(id: string): Promise<Entry> {
  const res = await api.get(`/shared-entry/${id}`);
  return res.data;
}

export async function addUserToSharedEntry(id: string, userEmail: string) {
  const res = await api.post(`/shared-entry/${id}/add-user`, {
    userEmail,
  });
  return res.data;
}

export async function removeUserFromSharedEntry(id: string, userEmail: string) {
  const res = await api.delete(`/shared-entry/${id}/remove-user`, {
    data: {
      userEmail,
    },
  });
  return res.data;
}

export async function deleteEntry(entryId: bigint) {
  await api.delete(`/entry/${entryId}`);
}

export async function getAllMediaForEntry(
  entryId: bigint | undefined
): Promise<Media[]> {
  if (!entryId) {
    return [];
  }
  const res = await api.get(`/entry/${entryId}/media`);
  console.log(res.data);
  return res.data;
}

// Add function to upload media to an entry
export async function uploadMediaToEntry(
  entryId: bigint,
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE',
  file: File
): Promise<string> {
  console.log(localStorage.getItem('token'));
  const formData = new FormData();
  formData.append('mediaType', mediaType);
  formData.append('file', file);
  const res = await api.post(`/entry/${entryId}/media/new`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export default api;
