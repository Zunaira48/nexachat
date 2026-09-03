'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '../stores/auth-store';

interface RefreshResponse {
  accessToken: string;
}

// Runs once on app load: tries to silently re-establish a session using
// the httpOnly refresh cookie, since the in-memory access token is lost
// on every hard refresh. If it fails, the user is simply not logged in.
export function useAuthInit() {
  const [isLoading, setIsLoading] = useState(true);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await apiFetch<RefreshResponse>('/api/auth/refresh', { method: 'POST' });
        const me = await apiFetch<{ user: { id: string; email: string; username: string; displayName: string } }>(
          '/api/users/me',
          { headers: { Authorization: `Bearer ${res.accessToken}` } },
        );
        if (!cancelled) setAuth(me.user, res.accessToken);
      } catch {
        // No valid session — that's fine, user just isn't logged in
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  return { isLoading };
}