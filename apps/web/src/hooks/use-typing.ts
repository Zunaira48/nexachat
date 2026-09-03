'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

const TYPING_TIMEOUT_MS = 3000;

export function useTyping(conversationId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    function handleTyping({ userId, conversationId: cid }: { userId: string; conversationId: string }) {
      if (cid !== conversationId) return;
      setTypingUserIds((prev) => new Set(prev).add(userId));

      // Auto-expire after TYPING_TIMEOUT_MS in case a stop event
      // never arrives (e.g. the other client crashed or lost connection).
      const existing = timeoutsRef.current.get(userId);
      if (existing) clearTimeout(existing);
      timeoutsRef.current.set(
        userId,
        setTimeout(() => {
          setTypingUserIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, TYPING_TIMEOUT_MS),
      );
    }

    function handleStopTyping({ userId, conversationId: cid }: { userId: string; conversationId: string }) {
      if (cid !== conversationId) return;
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopTyping);
    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopTyping);
    };
  }, [conversationId, accessToken]);

  function emitTypingStart() {
    if (!accessToken) return;
    getSocket(accessToken).emit('typing_start', conversationId);
  }

  function emitTypingStop() {
    if (!accessToken) return;
    getSocket(accessToken).emit('typing_stop', conversationId);
  }

  return { typingUserIds, emitTypingStart, emitTypingStop };
}