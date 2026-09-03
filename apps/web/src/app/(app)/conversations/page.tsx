'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { authedFetch } from '@/lib/api';
interface ConversationSummary {
  id: string;
  type: 'DIRECT' | 'GROUP';
  members: { user: { id: string; username: string; displayName: string } }[];
}

export default function ConversationsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => authedFetch<{ conversations: ConversationSummary[] }>('/api/conversations'),
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading conversations…</p>;
  if (error) return <p className="p-6 text-red-500">Unable to load conversations.</p>;

  const conversations = data?.conversations ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-medium mb-6">Conversations</h1>
      {conversations.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/conversations/${c.id}`}
                className="block border border-border rounded-md p-4 hover:bg-foreground/5 transition-colors"
              >
                {c.members.map((m) => m.user.displayName).join(', ')}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}