'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { getSocket } from '@/lib/socket';

export interface Notification {
  id: string;
  type: string;
  conversationId: string | null;
  actorId: string | null;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [liveUnreadDelta, setLiveUnreadDelta] = useState(0);

  const { data: listData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => authedFetch<{ notifications: Notification[] }>('/api/notifications'),
  });

  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => authedFetch<{ count: number }>('/api/notifications/unread-count'),
  });

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    function handleNotification() {
      setLiveUnreadDelta((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [accessToken, queryClient]);

  async function markAllRead() {
    setLiveUnreadDelta(0);
    await authedFetch('/api/notifications/mark-read', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  }

  return {
    notifications: listData?.notifications ?? [],
    unreadCount: (countData?.count ?? 0) + liveUnreadDelta,
    markAllRead,
  };
}