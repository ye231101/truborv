import axios, { type AxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { BASE_URL } from '@/lib/constants';

export type ApiRequestConfig = AxiosRequestConfig & {
  /** Skip user-facing toast notifications (background polling, etc.). */
  silent?: boolean;
};

// Teach axios about our custom per-request flags so `api.get(url, { silent })`
// type-checks everywhere without per-call casts.
declare module 'axios' {
  interface AxiosRequestConfig {
    silent?: boolean;
    __backendRetryCount?: number;
  }
}

const NETWORK_TOAST_COOLDOWN_MS = 15_000;
const BACKEND_RETRY_MAX = 6;
const BACKEND_RETRY_DELAY_MS = 2000;
let lastNetworkErrorToastAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBackendUnavailable(error: { response?: { status?: number } }) {
  return error.response?.status === 502 || error.response?.status === 503;
}

function shouldShowToast(config: ApiRequestConfig | undefined): boolean {
  return !config?.silent;
}

function showErrorToast(message: string, config?: ApiRequestConfig) {
  if (!shouldShowToast(config)) return;

  const text = message || 'Something went wrong';
  if (text === 'Network Error') {
    const now = Date.now();
    if (now - lastNetworkErrorToastAt < NETWORK_TOAST_COOLDOWN_MS) return;
    lastNetworkErrorToastAt = now;
  }

  toast.error(text);
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  headers: {
    'Content-type': 'application/json',
  },
});

api.interceptors.request.use(
  async (request) => {
    return request;
  },
  (error) => {
    showErrorToast(error.response?.data?.message || error.message || 'Something went wrong', error.config);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    const config = response.config as ApiRequestConfig;

    if (data.code === 200) {
      if (shouldShowToast(config) && data.message && data.message !== 'Success') {
        toast.success(data.message);
      }
      return Promise.resolve(data);
    }

    showErrorToast(data.message, config);
    return Promise.reject(new Error(data.message));
  },
  async (error) => {
    const config = error.config as ApiRequestConfig & { __backendRetryCount?: number };

    if (config && isBackendUnavailable(error)) {
      const retryCount = config.__backendRetryCount ?? 0;
      if (retryCount < BACKEND_RETRY_MAX) {
        config.__backendRetryCount = retryCount + 1;
        await sleep(BACKEND_RETRY_DELAY_MS * (retryCount + 1));
        return api.request(config);
      }
    }

    showErrorToast(error.response?.data?.message || error.message || 'Something went wrong', error.config);
    return Promise.reject(error);
  },
);
