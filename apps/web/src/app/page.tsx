import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="font-serif text-lg">NexaChat</span>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center px-6">
        <div className="max-w-lg">
          <h1 className="font-serif text-4xl leading-tight mb-4">
            Conversations that keep pace with you.
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Real-time messaging built for focus — fast, clear, and out of your way.
          </p>
          <div className="flex gap-3">
            <Link href="/register">
              <Button>Create an account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}