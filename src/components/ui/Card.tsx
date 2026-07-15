import { forwardRef, type HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-black/20 border border-white/10 shadow-xl shadow-accent/5 rounded-3xl',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const MotionCard = motion(Card);
