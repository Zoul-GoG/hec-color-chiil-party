/** Blurred ambient halos (docs/06 §7), decorative only. */
export function Halos() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 -left-24 size-96 rounded-full bg-brand-blue/10 blur-3xl dark:bg-brand-blue/18" />
      <div className="absolute top-40 -right-24 size-80 rounded-full bg-brand-red/8 blur-3xl dark:bg-brand-red/12" />
    </div>
  );
}
