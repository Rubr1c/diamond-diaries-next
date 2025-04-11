import { Entry } from '@/index/entry';
import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL +
    '/api/' +
    process.env.NEXT_PUBLIC_API_VERSION,
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

export async function getUser() {
  try {
    const response = await api.get('/user/me');
    const userData = response.data;
    console.log(userData);
    return {
      username: userData.username,
      profilePicture: userData.profilePicture,
      streak: userData.streak?.toString(),
    };
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

export async function serachEntries(query: string): Promise<Entry[]> {
  const res = await api.get('/entry/search', {
    params: {
      query,
    },
  });

  console.log(res);

  return res.data;
}

export async function deleteEntry(entryId: bigint) {
  await api.delete(`/entry/${entryId}`);
}

export default api;
