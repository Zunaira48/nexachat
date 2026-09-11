import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variant === 'primary' &&
            'bg-linear-to-r from-signal to-signal-2 text-paper shadow-sm shadow-signal/25 hover:brightness-110',
          variant === 'secondary' &&
            'border border-border bg-transparent text-foreground hover:bg-foreground/5',
          variant === 'ghost' && 'text-foreground hover:bg-foreground/5',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';