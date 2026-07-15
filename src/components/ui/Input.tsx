import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30',
        'focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition-all',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
