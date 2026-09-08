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
  type: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  pinnedAt?: string | null;
  replyToId?: string | null;
}

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

interface MessagesPage {
  messages: (Message & { reactions: Reaction[] })[];
  nextCursor: string | null;
}

export function useConversationSocket(conversationId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    const queryKey = ['messages', conversationId];

    socket.emit('join_conversation', conversationId);

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversationId) return;
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        if (old.messages.some((m) => m.id === message.id)) return old;
        return { ...old, messages: [...old.messages, { ...message, reactions: [] }] };
      });
    }

    function handleMessageEdited(message: Message) {
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
        };
      });
    }

    function handleMessageDeleted({ id }: { id: string; conversationId: string }) {
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === id ? { ...m, deletedAt: new Date().toISOString(), content: '' } : m,
          ),
        };
      });
    }

    function handleReactionAdded(reaction: Reaction) {
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === reaction.messageId
              ? { ...m, reactions: [...m.reactions.filter((r) => r.id !== reaction.id), reaction] }
              : m,
          ),
        };
      });
    }

    function handleReactionRemoved({
      messageId,
      userId,
      emoji,
    }: {
      messageId: string;
      userId: string;
      emoji: string;
    }) {
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) =>
            m.id === messageId
              ? { ...m, reactions: m.reactions.filter((r) => !(r.userId === userId && r.emoji === emoji)) }
              : m,
          ),
        };
      });
    }

    function handlePinToggled(message: Message) {
      queryClient.setQueryData<MessagesPage>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
        };
      });
    }

    function handleConversationUpdated() {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }

    function handleMessagesRead() {
      // Wired and confirmed working (Phase 12) — UI display deferred, see notes.
    }

    socket.on('new_message', handleNewMessage);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_added', handleReactionAdded);
    socket.on('message_reaction_removed', handleReactionRemoved);
    socket.on('message_pin_toggled', handlePinToggled);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_added', handleReactionAdded);
      socket.off('message_reaction_removed', handleReactionRemoved);
      socket.off('message_pin_toggled', handlePinToggled);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [conversationId, accessToken, queryClient]);
}