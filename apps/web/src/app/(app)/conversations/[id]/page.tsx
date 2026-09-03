'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      authedFetch<{ messages: Message[]; nextCursor: string | null }>(
        `/api/conversations/${conversationId}/messages`,
      ),
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      authedFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading messages…</p>;
  if (error) return <p className="p-6 text-red-500">Unable to load this conversation.</p>;

  const messages = data?.messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.length === 0 ? (
          <p className="text-muted-foreground">No messages yet. Say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-md px-3 py-2 text-sm ${
                    isMine ? 'bg-signal text-paper' : 'bg-foreground/5'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className="flex gap-2 p-4 border-t border-border"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) sendMutation.mutate(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
        />
        <Button type="submit" disabled={sendMutation.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}