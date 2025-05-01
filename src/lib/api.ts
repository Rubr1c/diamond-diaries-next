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
    console.log(
      'Attempting to fetch user data with token:',
      localStorage.getItem('token')
    );
    const response = await api.get('/user/me');
    console.log('User data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error details when fetching user data:', error);

    // Only remove token for authentication errors (401/403), not for other issues
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      console.warn('Authentication error - removing token');
      localStorage.removeItem('token');
    } else {
      console.error('Non-authentication error when fetching user data');
    }

    throw error;
  }
}

export async function updateUser(data: {
  username?: string;
  enabled2fa?: boolean;
  aiAllowTitleAccess?: boolean;
  aiAllowContentAccess?: boolean;
}) {
  const response = await api.put('/user/update/settings', data);
  return response.data;
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
  const response = await api.post('/auth/forgot-password', null, {
    params: { email },
  });
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

export async function initiatePasswordChange(email: string) {
  const response = await api.post('/auth/forgot-password', null, {
    params: { email },
  });
  return response.data;
}

export async function changePassword(
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

function convertBigIntToString(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }

  const newObj: { [key: string]: unknown } = {};
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key];
      if (typeof value === 'bigint') {
        newObj[key] = value.toString();
      } else if (typeof value === 'object') {
        newObj[key] = convertBigIntToString(value);
      } else {
        newObj[key] = value;
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
  folderId: string
): Promise<Entry[]> {
  const res = await api.get(`/entry/folder/public/${folderId}`);
  return res.data;
}

export async function generateAiPrompt() {
  const res = await api.get('/ai/daily-prompt');
  return res.data;
}

export async function newFolder(name: string) {
  const res = await api.post(`/folder/new/${name}`);
  return res.data;
}

export async function getFolder(id: string): Promise<Folder> {
  const res = await api.get(`/folder/public/${id}`);
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

export async function deleteProfilePicture() {
  const response = await api.delete('/user/profile-picture');
  return response.data;
}

export async function uploadProfilePicture(
  profilePicture: File
): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('profilePicture', profilePicture);

  const response = await api.post('/user/profile-picture/upload', formData, {
    headers: {
      ...(api.defaults.headers.common as Record<string, string>),
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return response.data; 
}

export async function getAllMediaForEntry(
  entryId: bigint | undefined
): Promise<Media[]> {
  if (!entryId) {
    return [];
  }
  const res = await api.get(`/entry/${entryId}/media`);
  return res.data;
}

export async function uploadMediaToEntry(
  entryId: bigint,
  mediaType: 'IMAGE' | 'VIDEO' | 'FILE',
  file: File
): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('mediaType', mediaType);
  formData.append('file', file);
  const res = await api.post(`/entry/${entryId}/media/new`, formData, {
    headers: {
      ...(api.defaults.headers.common as Record<string, string>),
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
  return res.data;
}

export default api;
