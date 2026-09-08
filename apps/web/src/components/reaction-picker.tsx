'use client';

import { useState } from 'react';
import { SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function ReactionPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setOpen((v) => !v)} aria-label="Add reaction">
        <SmilePlus size={16} />
      </Button>
      {open && (
        <div className="absolute bottom-full mb-1 right-0 flex gap-1 bg-background border border-border rounded-full px-2 py-1.5 shadow-lg z-10">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="text-lg hover:scale-125 transition-transform"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}