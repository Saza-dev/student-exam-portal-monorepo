import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { clearAuth, accessToken, isAuthenticated } = useAuthStore();
  // 1. Add local state to track if we are restoring the session
  const [isRestoring, setIsRestoring] = useState(!accessToken);

  // 2. Attempt to refresh the token on initial page load
  useEffect(() => {
    // Inside useAuth.ts -> restoreSession function
    const restoreSession = async () => {
      if (accessToken) {
        setIsRestoring(false);
        return;
      }

      // 1. Get the refresh token from local storage
      const storedRefreshToken = localStorage.getItem("refresh_token");

      if (!storedRefreshToken) {
        clearAuth();
        setIsRestoring(false);
        return;
      }

      console.log(storedRefreshToken);

      try {
        // 2. Send the refresh token in the body as expected by your backend
        const { data } = await api.post("/auth/refresh", {
          refresh_token: storedRefreshToken,
        });

        // 3. Save the NEW refresh token to local storage (Token Rotation)
        localStorage.setItem("refresh_token", data.data.refresh_token);

        useAuthStore.setState({
          accessToken: data.data.access_token,
          isAuthenticated: true,
        });
      } catch (error) {
        // Refresh failed (e.g., token expired or invalid)
        localStorage.removeItem("refresh_token");
        clearAuth();
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, [accessToken, clearAuth]);

  // 3. Fetch user data (only runs once we have the restored access token)
  const query = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      useAuthStore.setState({ user: data.data.user }); // Sync user back to store
      return data.data.user;
    },
    enabled: !!accessToken,
    retry: false,
  });

  useEffect(() => {
    if (query.isError) {
      clearAuth();
    }
  }, [query.isError, clearAuth]);

  return {
    user: query.data,
    // 4. Stay in a "loading" state until restoration AND the fetch are done
    isLoading: isRestoring || query.isLoading,
    isAuthenticated,
  };
};
