import { Languages } from 'lucide-react';
import { txt, useLang } from '../i18n';
import { cn } from './ui/cn';

/** FR ⇄ EN switch, placed right next to the theme toggle. Shows the language you'd switch to. */
export function LangToggle({ className }: { className?: string }) {
  const { toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={txt.lang.switchTo}
      title={txt.lang.switchTo}
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-surface px-2.5 text-xs font-bold tracking-[0.06em] text-fg transition-colors hover:bg-surface-2',
        className,
      )}
    >
      <Languages className="size-4" aria-hidden />
      <span>{txt.lang.short}</span>
    </button>
  );
}
