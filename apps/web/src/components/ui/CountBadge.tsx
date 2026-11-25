import { useEffect, useRef, useState } from 'react';
import { txt } from '../../i18n';
import { cn } from './cn';

/** "×12" pill; pops when the value increases. */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  const prev = useRef(count);
  const [pop, setPop] = useState(0);
  useEffect(() => {
    if (count > prev.current) setPop((p) => p + 1);
    prev.current = count;
  }, [count]);
  return (
    <span
      key={pop}
      title={txt.track.countTitle(count)}
      aria-label={txt.track.countTitle(count)}
      className={cn(
        'tabular inline-flex items-center rounded-full bg-brand-red-soft px-2.5 py-1 text-sm font-bold text-brand-red-text',
        pop > 0 && 'animate-pop',
        className,
      )}
    >
      ×{count}
    </span>
  );
}
