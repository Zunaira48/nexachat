'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthInit } from '@/hooks/use-auth-init';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { apiFetch } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthInit();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  async function handleLogout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <span className="font-serif text-lg">NexaChat</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.displayName}</span>
          <ThemeToggle />
          <Button variant="secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}