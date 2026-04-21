import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Axios instance with JWT refresh interceptor.
 * - Attaches httpOnly cookies automatically (withCredentials: true)
 * - On 401: queues the refresh, retries the original request
 * - Handles concurrent 401s gracefully (only one refresh in flight)
 */

// Queue for concurrent refresh requests — prevents redundant refresh calls
let refreshPromise: Promise<string> | null = null;

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only retry once to avoid infinite loops
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in flight, wait for it
        // Otherwise, start a new refresh
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const refreshResponse = await apiClient.post(`/auth/refresh`);
              return refreshResponse.data.accessToken;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        // Wait for the refresh to complete
        await refreshPromise;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — user is truly logged out
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
