import { txt } from '../../i18n';

export function Hero({ open = true }: { open?: boolean }) {
  return (
    <section className="flex flex-col items-center pt-10 text-center sm:pt-14">
      <p className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg shadow-card">
        <span className="relative flex size-2" aria-hidden>
          {open ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-red opacity-60" />
          ) : null}
          <span
            className={`relative inline-flex size-2 rounded-full ${open ? 'bg-brand-red' : 'bg-fg-subtle'}`}
          />
        </span>
        <span className="whitespace-nowrap">{txt.hero.date}</span>
        <span aria-hidden className="hidden text-fg-subtle min-[400px]:inline">
          ·
        </span>
        <span
          className={`whitespace-nowrap normal-case tracking-normal ${open ? 'text-brand-red-text' : 'text-fg-muted'}`}
        >
          {open ? txt.hero.open : txt.hero.closed}
        </span>
      </p>
      <h1 className="mt-5 max-w-3xl font-display text-[30px] leading-9 font-extrabold tracking-[-0.02em] text-fg sm:text-[40px] sm:leading-[48px]">
        {txt.hero.titleBefore}
        <span className="text-gradient-color">{txt.hero.titleColor}</span>
        <span className="whitespace-nowrap">
          {txt.hero.titleAfter} <span aria-hidden>🎶</span>
        </span>
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-6 text-fg-muted">{txt.hero.subtitle}</p>
    </section>
  );
}
