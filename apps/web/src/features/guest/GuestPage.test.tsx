import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../lib/api';
import { added, page, result, track } from '../../test/factories';
import { renderApp } from '../../test/render';
import { GuestPage } from './GuestPage';

const input = () => screen.getByRole('combobox', { name: 'Rechercher un morceau' });
const type = (v: string) => fireEvent.change(input(), { target: { value: v } });

beforeEach(() => {
  vi.spyOn(api, 'tracks').mockResolvedValue(page([]));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Search debounce (US-1)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const flush = async (ms: number) => {
    await act(async () => {
      vi.advanceTimersByTime(ms);
      await Promise.resolve();
    });
  };

  it('does not call the API before 1000 ms', async () => {
    const search = vi.spyOn(api, 'search').mockResolvedValue({ items: [] });
    renderApp(<GuestPage />);
    type('bahi');
    await flush(999);
    expect(search).not.toHaveBeenCalled();
    await flush(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('bahi', expect.any(AbortSignal));
  });

  it('never searches under 3 characters', async () => {
    const search = vi.spyOn(api, 'search').mockResolvedValue({ items: [] });
    renderApp(<GuestPage />);
    type('ba');
    await flush(2000);
    expect(search).not.toHaveBeenCalled();
    expect(screen.queryByText('RÉSULTATS DEEZER')).not.toBeInTheDocument();
  });

  it('fires a single call after fast typing', async () => {
    const search = vi.spyOn(api, 'search').mockResolvedValue({ items: [] });
    renderApp(<GuestPage />);
    for (const v of ['d', 'di', 'did', 'didi', 'didi ', 'didi b']) {
      type(v);
      await flush(150);
    }
    await flush(1000);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('didi b', expect.any(AbortSignal));
  });

  it('Enter searches immediately', async () => {
    const search = vi.spyOn(api, 'search').mockResolvedValue({ items: [] });
    renderApp(<GuestPage />);
    type('magic');
    fireEvent.keyDown(input(), { key: 'Enter' });
    await flush(0);
    expect(search).toHaveBeenCalledWith('magic', expect.any(AbortSignal));
  });
});

describe('Add from suggestions (US-3)', () => {
  const searchFor = async (q: string) => {
    type(q);
    fireEvent.keyDown(input(), { key: 'Enter' });
    return screen.findByRole('region', { name: 'RÉSULTATS DEEZER' });
  };

  it('clears the input, hides suggestions and shows a toast with title and artist', async () => {
    vi.spyOn(api, 'search').mockResolvedValue({ items: [result()] });
    const addTrack = vi.spyOn(api, 'addTrack').mockResolvedValue(added());
    renderApp(<GuestPage />);
    const panel = await searchFor('niska');
    fireEvent.click(await within(panel).findByRole('button', { name: 'Ajouter « Bâtiment » à la playlist' }));

    expect(await screen.findByText('🎉 « Bâtiment » de Niska est dans la playlist !')).toBeInTheDocument();
    expect(addTrack).toHaveBeenCalledWith(745229932);
    expect(input()).toHaveValue('');
    expect(input()).toHaveFocus();
    expect(screen.queryByRole('region', { name: 'RÉSULTATS DEEZER' })).not.toBeInTheDocument();
  });

  it('joined toast when others already added it', async () => {
    vi.spyOn(api, 'search').mockResolvedValue({ items: [result({ addCount: 3 })] });
    vi.spyOn(api, 'addTrack').mockResolvedValue(added({ created: false, othersCount: 3 }));
    renderApp(<GuestPage />);
    const panel = await searchFor('niska');
    expect(await within(panel).findByText('Déjà ajouté ×3')).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: /Ajouter « Bâtiment »/ }));
    expect(
      await screen.findByText('🔥 « Bâtiment » ajouté ! Tu rejoins 3 autres invités.'),
    ).toBeInTheDocument();
  });

  it('shows "Ajouté ✓" instead of the add button when addedByMe', async () => {
    vi.spyOn(api, 'search').mockResolvedValue({ items: [result({ addedByMe: true, addCount: 2 })] });
    renderApp(<GuestPage />);
    const panel = await searchFor('niska');
    expect(await within(panel).findByText('Ajouté ✓')).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /Ajouter « Bâtiment »/ })).not.toBeInTheDocument();
  });

  it('keeps the input and shows the FR error on failure', async () => {
    vi.spyOn(api, 'search').mockResolvedValue({ items: [result()] });
    const { ApiError } = await import('../../lib/api');
    vi.spyOn(api, 'addTrack').mockRejectedValue(new ApiError(409, 'TRACK_HIDDEN', 'x'));
    renderApp(<GuestPage />);
    const panel = await searchFor('niska');
    fireEvent.click(await within(panel).findByRole('button', { name: /Ajouter « Bâtiment »/ }));
    expect(await screen.findByText("Ce morceau n'est pas disponible pour la soirée.")).toBeInTheDocument();
    expect(input()).toHaveValue('niska');
  });

  it('search error 503 shows retry', async () => {
    const { ApiError } = await import('../../lib/api');
    vi.spyOn(api, 'search').mockRejectedValue(new ApiError(503, 'DEEZER_UNAVAILABLE', 'x'));
    renderApp(<GuestPage />);
    const panel = await searchFor('niska');
    expect(
      await within(panel).findByText('La recherche est momentanément indisponible.'),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it('empty results message', async () => {
    vi.spyOn(api, 'search').mockResolvedValue({ items: [] });
    renderApp(<GuestPage />);
    const panel = await searchFor('zzzz');
    expect(await within(panel).findByText(/Aucun résultat pour « zzzz »/)).toBeInTheDocument();
  });
});

describe('Playlist (US-4)', () => {
  it('shows the empty state', async () => {
    renderApp(<GuestPage />);
    expect(await screen.findByText('La piste de danse est vide…')).toBeInTheDocument();
  });

  it('lists tracks with counter, medal and +1 / Ajouté ✓', async () => {
    vi.mocked(api.tracks).mockResolvedValue(
      page([
        track({ addCount: 12 }),
        track({
          trackKey: 'dz:2',
          deezerId: 2,
          title: 'Coup du marteau',
          artist: 'Tam Sir',
          addCount: 3,
          addedByMe: true,
        }),
      ]),
    );
    const addTrack = vi.spyOn(api, 'addTrack').mockResolvedValue(added({ created: false, othersCount: 12 }));
    renderApp(<GuestPage />);
    const first = await screen.findByRole('article', { name: 'Bâtiment — Niska' });
    expect(within(first).getByText('×12')).toBeInTheDocument();
    expect(within(first).getByRole('img', { name: '1e place' })).toBeInTheDocument();
    const second = screen.getByRole('article', { name: 'Coup du marteau — Tam Sir' });
    expect(within(second).getByText('Ajouté ✓')).toBeInTheDocument();
    expect(screen.getByText('(2 titres)')).toBeInTheDocument();

    fireEvent.click(within(first).getByRole('button', { name: "Moi aussi, j'ajoute « Bâtiment »" }));
    await waitFor(() => expect(addTrack).toHaveBeenCalledWith(745229932));
    expect(
      await screen.findByText('🔥 « Bâtiment » ajouté ! Tu rejoins 12 autres invités.'),
    ).toBeInTheDocument();
  });

  it('already added by me -> neutral toast', async () => {
    vi.mocked(api.tracks).mockResolvedValue(page([track()]));
    vi.spyOn(api, 'addTrack').mockResolvedValue(
      added({ created: false, alreadyAddedByMe: true, othersCount: 0 }),
    );
    renderApp(<GuestPage />);
    fireEvent.click(await screen.findByRole('button', { name: /Moi aussi/ }));
    expect(await screen.findByText('Tu as déjà ajouté ce son 😉')).toBeInTheDocument();
  });

  it('switches tabs', async () => {
    renderApp(<GuestPage />);
    fireEvent.click(await screen.findByRole('tab', { name: '✨ Récemment ajoutés' }));
    await waitFor(() => expect(api.tracks).toHaveBeenCalledWith('recent', 1, 24));
  });
});
