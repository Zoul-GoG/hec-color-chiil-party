import { useSyncExternalStore } from 'react';
import { STORAGE_KEYS } from '../config';
import { en } from './en';
import { fr, type Messages } from './fr';

export type { Messages };
export type Lang = 'fr' | 'en';

const DICTS: Record<Lang, Messages> = { fr, en };
/** Backend catch-all genre name (apps/api stats OTHER_GENRE); kept as the filter value. */
export const OTHER_GENRE = 'Autres';

function readStored(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEYS.lang) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

let lang: Lang = readStored();

/**
 * Current UI strings. A live ES binding: always read it at render time (`txt.hero.title`),
 * never copy a string into a module-level constant. French is the default (docs/01 §7).
 */
export let txt: Messages = DICTS[lang];

const listeners = new Set<() => void>();

function apply(next: Lang): void {
  lang = next;
  txt = DICTS[next];
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}
apply(lang);

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang): void {
  if (next === lang) return;
  apply(next);
  try {
    localStorage.setItem(STORAGE_KEYS.lang, next);
  } catch {
    /* storage unavailable: the choice lasts for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Re-renders the caller when the language changes. */
export function useLang(): { lang: Lang; toggle: () => void } {
  const current = useSyncExternalStore(subscribe, getLang, getLang);
  return { lang: current, toggle: () => setLang(current === 'fr' ? 'en' : 'fr') };
}

/** BCP 47 locale for dates and numbers. */
export function locale(): string {
  return lang === 'en' ? 'en-GB' : 'fr-FR';
}

/** Genre display name ("Autres" bucket translated, Deezer names kept as-is). */
export function genreLabel(name: string): string {
  return name === OTHER_GENRE ? txt.dashboard.otherGenre : name;
}
