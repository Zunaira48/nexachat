'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const router = useRouter();

  function handleOpen() {
    setOpen((v) => !v);
    if (unreadCount > 0) markAllRead();
  }

  return (
    <div className="relative">
      <Button variant="ghost" onClick={handleOpen} aria-label="Notifications" className="relative">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-amber text-[10px] font-medium text-ink flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-background border border-border rounded-md shadow-lg z-20">
            <div className="px-4 py-3 border-b border-border font-medium text-sm">
              Notifications
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        if (n.conversationId) router.push(`/conversations/${n.conversationId}`);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-foreground/5"
                    >
                      <p className="truncate">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}