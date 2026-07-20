import axios, { type AxiosError } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

let csrfToken: string | null = null;

export const fetchCsrfToken = async () => {
  const { data } = await api.get('/auth/csrf');
  csrfToken = data.csrfToken;
  return csrfToken;
};

api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
    if (!csrfToken) csrfToken = await fetchCsrfToken();
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
