'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api';

interface MessageResult {
  id: string;
  content: string;
  conversationId: string;
  conversation: { id: string; name: string | null; type: string };
}

interface ConversationResult {
  id: string;
  name: string | null;
  type: string;
  members: { user: { id: string; displayName: string } }[];
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const enabled = query.trim().length >= 2;

  const { data: messageData, isLoading: messagesLoading } = useQuery({
    queryKey: ['search-messages', query],
    queryFn: () => authedFetch<{ results: MessageResult[] }>(`/api/search/messages?q=${encodeURIComponent(query)}`),
    enabled,
  });

  const { data: conversationData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['search-conversations', query],
    queryFn: () =>
      authedFetch<{ results: ConversationResult[] }>(`/api/search/conversations?q=${encodeURIComponent(query)}`),
    enabled,
  });

  return {
    query,
    setQuery,
    messages: messageData?.results ?? [],
    conversations: conversationData?.results ?? [],
    isLoading: messagesLoading || conversationsLoading,
    hasQuery: enabled,
  };
}