import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestPage } from '../features/guest/GuestPage';
import { api } from '../lib/api';
import { page } from '../test/factories';
import { renderApp } from '../test/render';
import { en } from './en';
import { fr } from './fr';
import { getLang, setLang, txt } from './index';

beforeEach(() => {
  vi.spyOn(api, 'settings').mockResolvedValue({ submissionsOpen: true, eventName: 'x', eventDate: 'x' });
  vi.spyOn(api, 'tracks').mockResolvedValue(page([]));
});
afterEach(() => {
  setLang('fr');
  vi.restoreAllMocks();
});

describe('i18n', () => {
  it('defaults to French', () => {
    expect(getLang()).toBe('fr');
    expect(txt).toBe(fr);
  });

  it('the toggle next to the theme switch translates the page, persists and sets <html lang>', async () => {
    renderApp(<GuestPage />);
    expect(await screen.findByText(fr.playlist.emptyTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to English' }));

    expect(await screen.findByText(en.playlist.emptyTitle)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: en.search.label })).toBeInTheDocument();
    expect(screen.queryByText(fr.playlist.emptyTitle)).not.toBeInTheDocument();
    expect(localStorage.getItem('hcc-lang')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    fireEvent.click(screen.getByRole('button', { name: 'Passer en français' }));
    expect(await screen.findByText(fr.playlist.emptyTitle)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });
});
