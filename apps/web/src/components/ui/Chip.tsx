import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

const DOTS = ['bg-party-pink', 'bg-party-yellow', 'bg-party-green', 'bg-party-purple', 'bg-party-orange'];

export function Chip({
  active = false,
  dot,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dot?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors',
        active ? 'bg-brand-blue text-white' : 'bg-surface-2 text-fg hover:bg-surface-3',
        className,
      )}
      {...rest}
    >
      {dot !== undefined ? (
        <span aria-hidden className={cn('size-2 rounded-full', DOTS[dot % DOTS.length])} />
      ) : null}
      {children}
    </button>
  );
}
