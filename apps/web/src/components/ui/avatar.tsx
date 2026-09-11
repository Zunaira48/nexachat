import { cn } from '@/lib/utils';

// A small, curated set of vibrant-but-not-harsh hues — each person
// gets a consistent color derived from their name, so avatars stop
// being a wall of identical gray circles.
const PALETTE = [
  { bg: '#5B6EF5', text: '#0A0E3D' }, // indigo (matches signal)
  { bg: '#8B5CF6', text: '#1E0B3D' }, // violet (matches signal-2)
  { bg: '#F5A524', text: '#3D2400' }, // amber
  { bg: '#EC6AA1', text: '#3D0E23' }, // pink
  { bg: '#4FB8E8', text: '#0A2A3D' }, // sky blue
  { bg: '#2DD4BF', text: '#042F2A' }, // teal, now a secondary accent only
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const { bg, text } = colorForName(name || '?');
  return (
    <div
      className={cn('flex items-center justify-center rounded-full text-sm font-medium shrink-0', className)}
      style={{ backgroundColor: bg, color: text }}
    >
      {initial}
    </div>
  );
}