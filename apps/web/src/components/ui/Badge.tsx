import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'neutral' | 'blue' | 'red';

const VARIANTS: Record<Variant, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  blue: 'bg-brand-blue-soft text-brand-blue-text',
  red: 'bg-brand-red-soft text-brand-red-text',
};

export function Badge({
  variant = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] leading-[14px] font-bold tracking-[0.06em] uppercase',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

/** Square "E" badge for explicit tracks. */
export function ExplicitBadge({ label }: { label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-surface-3 text-[10px] font-bold text-fg-muted"
    >
      E
    </span>
  );
}
