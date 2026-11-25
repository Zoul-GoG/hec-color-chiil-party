import { locale } from '../i18n';

/** 191 -> "3:11" */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** ISO -> "21:04" (local time; Abidjan = UTC). */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
