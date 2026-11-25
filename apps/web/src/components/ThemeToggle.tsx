import { Moon, Sun } from 'lucide-react';
import { fr } from '../i18n/fr';
import { useTheme } from '../lib/theme';
import { cn } from './ui/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? fr.theme.toLight : fr.theme.toDark}
      title={dark ? fr.theme.toLight : fr.theme.toDark}
      className={cn(
        'inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-fg transition-colors hover:bg-surface-2',
        className,
      )}
    >
      {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </button>
  );
}
