'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth-store';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
}

export function useConversationSocket(conversationId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    socket.emit('join_conversation', conversationId);

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversationId) return;
      queryClient.setQueryData<MessagesPage>(['messages', conversationId], (old) => {
        if (!old) return old;
        if (old.messages.some((m) => m.id === message.id)) return old; // avoid duplicates
        return { ...old, messages: [...old.messages, message] };
      });
    }

    function handleConversationUpdated() {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }

    function handleMessagesRead() {
      // Wired up and confirmed working (Phase 12) — UI display of
      // per-message "seen" state is a deliberate later addition,
      // likely alongside Phase 13's group conversation work.
    }

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [conversationId, accessToken, queryClient]);
}