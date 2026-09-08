'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useUserSearch } from '@/hooks/use-user-search';
import { authedFetch } from '@/lib/api';

export function StartDmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { query, setQuery, users } = useUserSearch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string) =>
      authedFetch<{ conversation: { id: string } }>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setQuery('');
      onClose();
      router.push(`/conversations/${data.conversation.id}`);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New message">
      <Input
        placeholder="Search people…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {users.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => mutation.mutate(u.id)}
                disabled={mutation.isPending}
                className="w-full flex items-center gap-3 px-2 py-2 text-sm hover:bg-foreground/5 rounded-md text-left"
              >
                <Avatar name={u.displayName} className="h-8 w-8" />
                <div>
                  <div>{u.displayName}</div>
                  <div className="text-xs text-muted-foreground">@{u.username}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}