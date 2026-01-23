"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  type LoginRequest,
  type SignupRequest,
  type RefreshTokenRequest,
  type User,
} from "@/lib/api/authApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TOKEN_KEY } from "@/lib/api/token";
import {
  getCookieClient,
  removeCookieClient,
  setCookieClient,
} from "@/lib/cookie";
import { getLocalStorage, setLocalStorage } from "@/lib/localStorage";

export const AUTH_USER_KEY = "user";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Get user profile if authenticated
  const { data: user } = useQuery<User | null>({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const tokens = JSON.parse((await getCookieClient(TOKEN_KEY)) || "{}");

      if (!tokens.accessToken) {
        return null;
      }

      const user = getLocalStorage<User>(AUTH_USER_KEY);

      if (!user) {
        removeCookieClient(TOKEN_KEY);
        return null;
      }

      return user;
    },
  });

  // Signup mutation
  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {},
    onError: (error: Error) => {
      setError(error.message || "Failed to create account");
    },
  });

  // Login mutation
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setCookieClient(TOKEN_KEY, JSON.stringify(data.token));
      setLocalStorage(AUTH_USER_KEY, data.user);

      queryClient.setQueryData(["auth", "check"], { authenticated: true });
      queryClient.setQueryData(["auth", "profile"], data.user);
    },
    onError: (error: Error) => {
      setError(error.message || "Invalid email or password");
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: () => Promise.resolve(null),
    onSuccess: () => {
      removeCookieClient(TOKEN_KEY);

      queryClient.setQueryData(["auth", "check"], { authenticated: false });
      queryClient.setQueryData(["auth", "profile"], null);
      router.refresh();
    },
    onError: () => {
      queryClient.setQueryData(["auth", "check"], { authenticated: false });
      queryClient.setQueryData(["auth", "profile"], null);
    },
  });

  const refresh = useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: (data) => {
      if (data) {
        setCookieClient(TOKEN_KEY, JSON.stringify(data));
      }
      queryClient.setQueryData(["auth", "check"], { authenticated: true });
    },
    onError: () => {
      setError("Session expired. Please log in again.");
      logout.mutateAsync();
    },
  });

  // Forgot Password mutation
  const forgotPassword = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {},
    onError: (error: Error) => {
      setError(error.message || "Failed to start password reset");
    },
  });

  // Confirm Password mutation
  const confirmPassword = useMutation({
    mutationFn: authApi.confirmPassword,
    onSuccess: () => {},
    onError: (error: Error) => {
      setError(error.message || "Failed to confirm password reset");
    },
  });

  // Set New Password mutation
  const setNewPassword = useMutation({
    mutationFn: authApi.setNewPassword,
    onSuccess: () => {},
    onError: (error: Error) => {
      setError(error.message || "Failed to set new password");
    },
  });

  return {
    user,
    error,

    signup,
    login,
    logout,
    refresh,

    forgotPassword,
    confirmPassword,
    setNewPassword,
  };
}
