import { Link } from 'react-router-dom';
import { txt } from '../i18n';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/hec-abidjan-logo.png"
            alt={txt.brand.logoAlt}
            className="h-10 w-auto"
            width={61}
            height={40}
            loading="lazy"
          />
          <img
            src="/bde-hec-abidjan-logo.png"
            alt={txt.brand.bdeLogoAlt}
            className="h-10 w-auto"
            width={35}
            height={40}
            loading="lazy"
          />
          <p className="font-semibold text-fg-muted">{txt.footer.org}</p>
        </div>
        <p>{txt.footer.event}</p>
        {/* <p>{txt.footer.deezer}</p> */}
        <p className="flex items-center gap-3">
          <span>{txt.footer.copyright}</span>
          <Link to="/admin/login" className="underline-offset-2 hover:text-brand-blue-text hover:underline">
            {txt.footer.admin}
          </Link>{' '}
          |
          <a
            href="https://zoul.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-brand-blue-text hover:underline"
          >
            by zoul.dev
          </a>
        </p>
      </div>
    </footer>
  );
}
