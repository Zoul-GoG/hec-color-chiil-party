import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { LangToggle } from './LangToggle';
import { ThemeToggle } from './ThemeToggle';

export function Header({ suffix, right }: { suffix?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Logo suffix={suffix} />
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
