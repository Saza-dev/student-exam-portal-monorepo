import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check for 401 and ensure we aren't already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to rotate tokens (Requirement 6)
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true },
        );

        // Store new tokens
        localStorage.setItem("refresh_token", data.data.refresh_token);
        // Update access token only (user data stays in store from login)
        useAuthStore.setState({
          accessToken: data.data.access_token,
          isAuthenticated: true,
        });

        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        localStorage.removeItem("refresh_token");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
