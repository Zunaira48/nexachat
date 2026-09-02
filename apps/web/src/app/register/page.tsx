'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      }),
    onSuccess: () => router.push('/login'),
  });

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center px-16 bg-foreground/3 border-r border-border">
        <h1 className="font-serif text-4xl leading-tight mb-4">
          Join the conversation.
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Create your account to start messaging in real time.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 md:px-16 py-12">
        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-xl font-medium mb-6">Create an account</h2>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Input
              placeholder="Display name"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
            <Input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
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
              {mutation.isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-signal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}