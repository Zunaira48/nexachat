import { cn } from '@/lib/utils';

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-foreground/10 text-sm font-medium shrink-0',
        className,
      )}
    >
      {initial}
    </div>
  );
}