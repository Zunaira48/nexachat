'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useUserSearch } from '@/hooks/use-user-search';
import { authedFetch, ApiError } from '@/lib/api';

interface SelectedUser {
  id: string;
  displayName: string;
}

export function CreateGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<SelectedUser[]>([]);
  const { query, setQuery, users } = useUserSearch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      authedFetch<{ conversation: { id: string } }>('/api/groups', {
        method: 'POST',
        body: JSON.stringify({ name, memberIds: selected.map((u) => u.id) }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      handleClose();
      router.push(`/conversations/${data.conversation.id}`);
    },
  });

  function toggleUser(user: SelectedUser) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  }

  function handleClose() {
    setName('');
    setSelected([]);
    setQuery('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Create a group">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && selected.length > 0) mutation.mutate();
        }}
      >
        <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <Input
            placeholder="Search people to add…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {users.length > 0 && (
            <ul className="mt-2 border border-border rounded-md divide-y divide-border max-h-40 overflow-y-auto">
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => toggleUser(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-foreground/5 text-left"
                  >
                    <Avatar name={u.displayName} className="h-7 w-7" />
                    <span>{u.displayName}</span>
                    {selected.some((s) => s.id === u.id) && (
                      <span className="ml-auto text-signal text-xs">Added</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((u) => (
              <span
                key={u.id}
                className="text-xs bg-foreground/5 rounded-full px-3 py-1 flex items-center gap-1"
              >
                {u.displayName}
                <button
                  type="button"
                  onClick={() => toggleUser(u)}
                  aria-label={`Remove ${u.displayName}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-500">
            {mutation.error instanceof ApiError ? mutation.error.message : 'Something went wrong'}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!name.trim() || selected.length === 0 || mutation.isPending}
        >
          {mutation.isPending ? 'Creating…' : 'Create group'}
        </Button>
      </form>
    </Modal>
  );
}