import type { AdminTrackDto, AdminTracksResponseDto, StatsDto } from '@hcc/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import { adminApi, api, ApiError } from '../../lib/api';
import { track } from '../../test/factories';
import { renderApp } from '../../test/render';

const stats: StatsDto = {
  range: 'all',
  uniqueTracks: 4,
  totalAdditions: 13,
  uniqueGuests: 10,
  additionsLastHour: 3,
  additionsPrevHour: 2,
  topArtist: { name: 'Didi B', count: 5 },
  genres: [
    { name: 'Rap/Hip Hop', count: 5, share: 0.625 },
    { name: 'Autres', count: 3, share: 0.375 },
  ],
  timeline: [
    { bucketStart: '2026-11-27T20:00:00.000Z', count: 2 },
    { bucketStart: '2026-11-27T20:15:00.000Z', count: 5 },
  ],
  generatedAt: new Date().toISOString(),
};

const adminTrack = (over: Partial<AdminTrackDto> = {}): AdminTrackDto => ({
  ...track({ addCount: 3 }),
  rank: 1,
  played: false,
  playedAt: null,
  hidden: false,
  ...over,
});

const list = (items: AdminTrackDto[]): AdminTracksResponseDto => ({
  items,
  total: items.length,
  page: 1,
  limit: 50,
  hasMore: false,
  genres: [{ name: 'Rap/Hip Hop', count: items.length }],
});

beforeEach(() => {
  vi.spyOn(api, 'settings').mockResolvedValue({ submissionsOpen: true, eventName: 'x', eventDate: 'x' });
  vi.spyOn(adminApi, 'me').mockResolvedValue({ email: 'bde@hec.ci' });
  vi.spyOn(adminApi, 'stats').mockResolvedValue(stats);
});
afterEach(() => vi.restoreAllMocks());

describe('Dashboard', () => {
  it('shows KPIs, top artist, genres and the chart', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    renderApp(<AppRoutes />, ['/admin']);
    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(await screen.findByText('13')).toBeInTheDocument();
    expect(screen.getByText('Moy. 3,3 par titre')).toBeInTheDocument();
    expect(screen.getByText('+50 %')).toBeInTheDocument();
    expect(screen.getByText('Didi B')).toBeInTheDocument();
    expect(screen.getByText('63 %')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Ajouts par tranche horaire' })).toBeInTheDocument();
    expect(screen.getByText('bde@hec.ci')).toBeInTheDocument();
  });

  it('period switch refetches stats with range=1h', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([]));
    renderApp(<AppRoutes />, ['/admin']);
    fireEvent.click(await screen.findByRole('radio', { name: 'Dernière heure' }));
    await waitFor(() => expect(adminApi.stats).toHaveBeenCalledWith('1h'));
    await waitFor(() =>
      expect(adminApi.tracks).toHaveBeenLastCalledWith(expect.objectContaining({ range: '1h', page: 1 })),
    );
  });

  it('filters are read from the URL and sent to the API', async () => {
    const tracks = vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([]));
    renderApp(<AppRoutes />, ['/admin?sort=count_asc&q=didi&page=2']);
    await waitFor(() =>
      expect(tracks).toHaveBeenCalledWith(expect.objectContaining({ sort: 'count_asc', q: 'didi', page: 2 })),
    );
    expect(await screen.findByText('Aucun morceau ne correspond à ces filtres.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser les filtres' }));
    await waitFor(() =>
      expect(tracks).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'count_desc', page: 1 })),
    );
  });

  it('empty playlist -> copy link', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([]));
    renderApp(<AppRoutes />, ['/admin']);
    expect(await screen.findByText(/Partage le lien de la playlist/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copier le lien/ })).toBeInTheDocument();
  });

  it('marks as played optimistically', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    let resolve!: (v: AdminTrackDto) => void;
    const patch = vi.spyOn(adminApi, 'patchTrack').mockReturnValue(new Promise((r) => (resolve = r)));
    renderApp(<AppRoutes />, ['/admin']);
    const [btn] = await screen.findAllByRole('button', { name: 'Marquer « Bâtiment » comme joué' });
    fireEvent.click(btn);
    await waitFor(() => expect(patch).toHaveBeenCalledWith('isrc:FR9W11916593', { played: true }));
    // Optimistic: the toggle flips before the server answers.
    expect(
      (await screen.findAllByRole('button', { name: 'Marquer « Bâtiment » comme non joué' })).length,
    ).toBeGreaterThan(0);
    resolve(adminTrack({ played: true }));
  });

  it('rolls back and toasts on error', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    vi.spyOn(adminApi, 'patchTrack').mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'x'));
    renderApp(<AppRoutes />, ['/admin']);
    const [btn] = await screen.findAllByRole('button', { name: 'Marquer « Bâtiment » comme joué' });
    fireEvent.click(btn);
    expect(await screen.findByText("L'action n'a pas pu être enregistrée.")).toBeInTheDocument();
    expect(
      (await screen.findAllByRole('button', { name: 'Marquer « Bâtiment » comme joué' })).length,
    ).toBeGreaterThan(0);
  });

  it('hiding asks for an inline confirmation', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    const patch = vi.spyOn(adminApi, 'patchTrack').mockResolvedValue(adminTrack({ hidden: true }));
    renderApp(<AppRoutes />, ['/admin']);
    const [more] = await screen.findAllByRole('button', { name: "Plus d'actions pour « Bâtiment »" });
    fireEvent.click(more);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Masquer de la playlist' }));
    const [dialog] = screen.getAllByRole('alertdialog');
    expect(patch).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Masquer' }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('isrc:FR9W11916593', { hidden: true }));
  });

  it('US-10: Excel export link carries the current filters', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    renderApp(<AppRoutes />, ['/admin?q=didi&page=3']);
    const link = await screen.findByRole('link', { name: /Exporter Excel/ });
    expect(link).toHaveAttribute('href', '/api/admin/tracks/export.xlsx?q=didi&sort=count_desc&range=all');
  });

  it('no status / explicit filters and no auto-sync switch', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack()]));
    renderApp(<AppRoutes />, ['/admin']);
    await screen.findByRole('link', { name: /Exporter Excel/ });
    expect(screen.queryByText('Statut')).not.toBeInTheDocument();
    expect(screen.queryByText('Masquer explicites')).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /Synchro auto/ })).not.toBeInTheDocument();
  });

  it('hidden tracks stay listed (no rank) and can be unhidden', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([adminTrack({ hidden: true })]));
    const patch = vi.spyOn(adminApi, 'patchTrack').mockResolvedValue(adminTrack());
    renderApp(<AppRoutes />, ['/admin']);
    const [more] = await screen.findAllByRole('button', { name: /Plus d'actions/ });
    fireEvent.click(more);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Réafficher' }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('isrc:FR9W11916593', { hidden: false }));
  });

  it('US-11: admin can close submissions', async () => {
    vi.spyOn(adminApi, 'tracks').mockResolvedValue(list([]));
    const set = vi.spyOn(adminApi, 'setSubmissionsOpen').mockResolvedValue({ submissionsOpen: false });
    renderApp(<AppRoutes />, ['/admin']);
    const sw = await screen.findByRole('switch', { name: /Propositions/ });
    await waitFor(() => expect(sw).toHaveAttribute('aria-checked', 'true'));
    fireEvent.click(sw);
    await waitFor(() => expect(set).toHaveBeenCalledWith(false));
    expect(await screen.findByText('Propositions closes 🔒')).toBeInTheDocument();
  });
});
