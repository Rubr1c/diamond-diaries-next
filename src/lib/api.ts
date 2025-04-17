import { Entry } from '@/index/entry';
import { Folder } from '@/index/folder';
import { Media } from '@/index/media';
import { User } from '@/index/user';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080' + '/api/' + 'v1',
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
  const res = await api.get(`/entry/date/${date}`);

  return res.data;
}

export async function fetchAllEntriesByTags(
  tagNames: string[],
  offset: number,
  size: number
) {
  const res = await api.get('/entry/tag', {
    params: { offset, size, tagNames },
  });

  return res.data;
}

export async function addTagsToEntry(entryId: bigint, tagNames: string[]) {
  const res = await api.post(`/entry/${entryId}/tag/new`, tagNames);

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

export async function newEntry(values: {
  title: string;
  content: string;
  folderId?: bigint;
  tagNames?: string[];
  wordCount: number;
  isFavorite: boolean;
}) {
  const res = await api.post('/entry/new', values);

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
  const res = await api.put(`/entry/${entryId}/update`, updates);
  return res.data;
}

export async function addEntryToFolder(entryId: bigint, folderId: bigint) {
  const res = await api.post(`/entry/${entryId}/add-to-folder/${folderId}`);
  return res.data;
}

export async function removeEntryFromFolder(entryId: bigint) {
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

export default api;
