"use client";

import { authApi } from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAuth(options = {}) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.me();
      setUser(data?.user || null);
    } catch (err) {
      setUser(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors so UI can still clear local auth state.
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, loading, user, redirectPath]);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      refresh,
      logout,
    }),
    [user, loading, error, refresh, logout]
  );
}
