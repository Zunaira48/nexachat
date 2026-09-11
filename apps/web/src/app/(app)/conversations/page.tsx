'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { authedFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { usePresence } from '@/hooks/use-presence';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CreateGroupModal } from '@/components/create-group-modal';
import { StartDmModal } from '@/components/start-dm-modal';
import { Users, MessageSquarePlus, Star } from 'lucide-react';

interface Member {
  userId: string;
  isFavorite: boolean;
  user: { id: string; username: string; displayName: string; online: boolean };
}

interface ConversationSummary {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  members: Member[];
  messages: { content: string; type: string; createdAt: string }[];
  unreadCount: number;
}

function conversationLabel(c: ConversationSummary, currentUserId?: string) {
  if (c.type === 'GROUP') return c.name ?? 'Unnamed group';
  const other = c.members.find((m) => m.userId !== currentUserId);
  return other?.user.displayName ?? 'Unknown';
}

export default function ConversationsPage() {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);

  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => authedFetch<{ conversations: ConversationSummary[] }>('/api/conversations'),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    function refetch() {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
    socket.on('conversation_updated', refetch);
    return () => {
      socket.off('conversation_updated', refetch);
    };
  }, [accessToken, queryClient]);

  const conversations = data?.conversations ?? [];
  const onlineIds = usePresence(
    conversations.flatMap((c) => c.members.map((m) => m.userId)).filter((id) => id !== currentUserId),
  );

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading conversations…</p>;
  if (error) return <p className="p-6 text-red-500">Unable to load conversations.</p>;

  const sorted = [...conversations].sort((a, b) => {
    const aFav = a.members.some((m) => m.userId === currentUserId && m.isFavorite);
    const bFav = b.members.some((m) => m.userId === currentUserId && m.isFavorite);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return 0;
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Conversations</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowDmModal(true)}>
            <MessageSquarePlus size={16} className="mr-1.5" />
            New message
          </Button>
          <Button onClick={() => setShowGroupModal(true)}>
            <Users size={16} className="mr-1.5" />
            New group
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((c) => {
            const isFavorite = c.members.some(
              (m) => m.userId === currentUserId && m.isFavorite,
            );
            const otherMember = c.members.find((m) => m.userId !== currentUserId);
            const isOnline = c.type === 'DIRECT' && otherMember && onlineIds.has(otherMember.userId);
            const lastMessage = c.messages[0];

            return (
              <li key={c.id}>
                <Link
                  href={`/conversations/${c.id}`}
                  className="flex items-center gap-3 border border-border rounded-md p-4 hover:bg-foreground/5 transition-colors"
                >
                  <div className="relative">
                    <Avatar
                      name={conversationLabel(c, currentUserId)}
                      className="h-10 w-10"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-amber ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`truncate ${c.unreadCount > 0 ? 'font-semibold' : 'font-medium'}`}
                      >
                        {conversationLabel(c, currentUserId)}
                      </span>
                      {isFavorite && <Star size={13} className="fill-amber text-amber shrink-0" />}
                    </div>
                    {lastMessage && (
                      <p
                        className={`text-sm truncate ${
                          c.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-signal text-paper text-xs font-medium flex items-center justify-center">
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CreateGroupModal open={showGroupModal} onClose={() => setShowGroupModal(false)} />
      <StartDmModal open={showDmModal} onClose={() => setShowDmModal(false)} />
    </div>
  );
}