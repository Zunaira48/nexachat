'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/use-search';
import { useAuthStore } from '@/stores/auth-store';

function conversationLabel(c: { type: string; name: string | null; members: { user: { id: string; displayName: string } }[] }, currentUserId?: string) {
  if (c.type === 'GROUP') return c.name ?? 'Unnamed group';
  const other = c.members.find((m) => m.user.id !== currentUserId);
  return other?.user.displayName ?? 'Unknown';
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const { query, setQuery, messages, conversations, hasQuery } = useSearch();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(conversationId: string) {
    setOpen(false);
    setQuery('');
    router.push(`/conversations/${conversationId}`);
  }

  return (
    <div className="relative w-64" ref={containerRef}>
      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search messages and chats…"
          className="pl-8 pr-8"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && hasQuery && (
        <div className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-background border border-border rounded-md shadow-lg z-20">
          {conversations.length === 0 && messages.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No results.</p>
          ) : (
            <>
              {conversations.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground uppercase tracking-wide">
                    Conversations
                  </p>
                  <ul>
                    {conversations.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => goTo(c.id)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/5"
                        >
                          {conversationLabel(c, currentUserId)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {messages.length > 0 && (
                <div>
                  <p className="px-3 pt-2 pb-1 text-xs text-muted-foreground uppercase tracking-wide">
                    Messages
                  </p>
                  <ul>
                    {messages.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => goTo(m.conversationId)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/5"
                        >
                          <p className="truncate">{m.content}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            in {m.conversation.name ?? 'Direct message'}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}