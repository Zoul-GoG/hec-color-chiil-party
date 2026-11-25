import { Link } from 'react-router-dom';
import { fr } from '../i18n/fr';
import { cn } from './ui/cn';

/** HEC Abidjan logo + separator + "Color & Chill" (docs/06 §7). */
export function Logo({
  suffix,
  to = '/',
  onDark = false,
}: {
  suffix?: string;
  to?: string;
  onDark?: boolean;
}) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3 rounded-md">
      <span className={cn('inline-flex shrink-0', onDark && 'rounded-md bg-white px-1.5 py-1')}>
        <img
          src="/hec-abidjan-logo.png"
          alt={fr.brand.logoAlt}
          className="h-8 w-auto"
          width={96}
          height={32}
        />
      </span>
      <span aria-hidden className={cn('h-6 w-px shrink-0', onDark ? 'bg-white/40' : 'bg-border')} />
      <span
        className={cn(
          'truncate font-display text-base font-bold whitespace-nowrap',
          onDark ? 'text-white' : 'text-fg',
        )}
      >
        {fr.brand.name}
        {suffix ? (
          <span className={cn('font-semibold', onDark ? 'text-white/80' : 'text-fg-muted')}> · {suffix}</span>
        ) : null}
      </span>
    </Link>
  );
}
