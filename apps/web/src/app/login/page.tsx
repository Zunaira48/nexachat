'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

interface LoginResponse {
  user: { id: string; email: string; username: string; displayName: string };
  accessToken: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push('/conversations');
    },
  });

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center px-16 bg-foreground/3 border-r border-border">
        <h1 className="font-serif text-4xl leading-tight mb-4">Welcome back.</h1>
        <p className="text-muted-foreground max-w-sm">
          Sign in to pick up where you left off.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 md:px-16 py-12">
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-xl font-medium mb-6">Sign in</h2>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {mutation.isError && (
              <p className="text-sm text-red-500">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Something went wrong'}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-signal hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}