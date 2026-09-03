'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

export function usePresence(initialOnlineIds: string[]) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set(initialOnlineIds));

  useEffect(() => {
    setOnlineIds(new Set(initialOnlineIds));
  }, [initialOnlineIds.join(',')]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    function handlePresenceUpdate({ userId, online }: { userId: string; online: boolean }) {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    }

    socket.on('presence_update', handlePresenceUpdate);
    return () => {
      socket.off('presence_update', handlePresenceUpdate);
    };
  }, [accessToken]);

  return onlineIds;
}