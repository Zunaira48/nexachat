'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api';

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
}

export function useUserSearch() {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => authedFetch<{ users: SearchUser[] }>(`/api/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
  });

  return { query, setQuery, users: data?.users ?? [], isLoading };
}