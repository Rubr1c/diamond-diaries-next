import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
  return response.data;
}

export async function register(
  email: string,
  username: string,
  password: string
) {
  const response = await api.post('/auth/signup', { email, password });
  return response.data;
}

export async function logout() {
  localStorage.removeItem('token');
}

export default api;
