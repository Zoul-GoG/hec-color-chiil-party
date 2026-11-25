import type { AdminUserDto } from '@hcc/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import { adminApi, api, ApiError } from '../../lib/api';
import { renderApp } from '../../test/render';

const user = (over: Partial<AdminUserDto>): AdminUserDto => ({
  id: 'u1',
  email: 'dj@hec.ci',
  isSuperAdmin: false,
  isMe: false,
  createdAt: '2026-11-25T10:00:00.000Z',
  lastLoginAt: null,
  ...over,
});
const SUPER = user({ id: 's1', email: 'bde@hec.ci', isSuperAdmin: true });
const ME = user({ id: 'm1', email: 'me@hec.ci', isMe: true, lastLoginAt: '2026-11-25T12:00:00.000Z' });
const DJ = user({});

beforeEach(() => {
  vi.spyOn(api, 'settings').mockResolvedValue({ submissionsOpen: true, eventName: 'x', eventDate: 'x' });
  vi.spyOn(adminApi, 'me').mockResolvedValue({ id: 'm1', email: 'me@hec.ci', isSuperAdmin: false });
  vi.spyOn(adminApi, 'users').mockResolvedValue([SUPER, ME, DJ]);
});
afterEach(() => vi.restoreAllMocks());

/** The account row (the header also shows my email, so pick the element inside a list item). */
const row = async (email: string) =>
  (await screen.findAllByText(email)).map((el) => el.closest('li')).find(Boolean) as HTMLElement;

describe('Users page', () => {
  it('is reachable from the dashboard header and lists accounts with badges', async () => {
    vi.spyOn(adminApi, 'stats').mockRejectedValue(new Error('x'));
    vi.spyOn(adminApi, 'tracks').mockRejectedValue(new Error('x'));
    renderApp(<AppRoutes />, ['/admin']);
    fireEvent.click(await screen.findByRole('link', { name: 'Utilisateurs' }));
    expect(await screen.findByRole('heading', { name: 'Utilisateurs' })).toBeInTheDocument();
    expect(await screen.findByText('3 comptes')).toBeInTheDocument();
    expect(within(await row('bde@hec.ci')).getByText('Super admin')).toBeInTheDocument();
    expect(within(await row('me@hec.ci')).getByText('Toi')).toBeInTheDocument();
    expect(within(await row('dj@hec.ci')).getByText(/Jamais connecté/)).toBeInTheDocument();
  });

  it('creates an account (client validation first)', async () => {
    const create = vi
      .spyOn(adminApi, 'createUser')
      .mockResolvedValue(user({ id: 'n1', email: 'new@hec.ci' }));
    renderApp(<AppRoutes />, ['/admin/users']);
    const submit = await screen.findByRole('button', { name: 'Créer le compte' });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'new@hec.ci' } });
    fireEvent.change(screen.getAllByLabelText('Mot de passe')[0]!, { target: { value: 'short' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Le mot de passe doit faire au moins 8 caractères.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();

    fireEvent.change(screen.getAllByLabelText('Mot de passe')[0]!, { target: { value: 'long-enough' } });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ email: 'new@hec.ci', password: 'long-enough' }),
    );
    expect(await screen.findByText('Compte créé pour new@hec.ci 🎉')).toBeInTheDocument();
  });

  it('shows the API error (duplicate email)', async () => {
    vi.spyOn(adminApi, 'createUser').mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', 'x'));
    renderApp(<AppRoutes />, ['/admin/users']);
    const submit = await screen.findByRole('button', { name: 'Créer le compte' });
    fireEvent.change(screen.getAllByLabelText('Email')[0]!, { target: { value: 'dj@hec.ci' } });
    fireEvent.change(screen.getAllByLabelText('Mot de passe')[0]!, { target: { value: 'long-enough' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Un compte existe déjà avec cet email.')).toBeInTheDocument();
  });

  it('edits another account: only changed fields are sent', async () => {
    const update = vi.spyOn(adminApi, 'updateUser').mockResolvedValue(DJ);
    renderApp(<AppRoutes />, ['/admin/users']);
    fireEvent.click(
      within(await row('dj@hec.ci')).getByRole('button', { name: 'Modifier le compte dj@hec.ci' }),
    );
    const r = await row('dj@hec.ci');
    fireEvent.change(within(r).getByLabelText('Nouveau mot de passe'), { target: { value: 'rotated-pw' } });
    fireEvent.click(within(r).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('u1', { password: 'rotated-pw' }));
  });

  it('super admin row: no delete; email and password locked for other admins', async () => {
    renderApp(<AppRoutes />, ['/admin/users']);
    const r = await row('bde@hec.ci');
    expect(within(r).getByRole('button', { name: 'Supprimer le compte bde@hec.ci' })).toBeDisabled();
    const edit = within(r).getByRole('button', { name: 'Modifier le compte bde@hec.ci' });
    expect(edit).toBeDisabled();
    expect(edit).toHaveAttribute('title', 'Seul le super admin peut changer son mot de passe.');
  });

  it('super admin editing itself: password editable, email locked', async () => {
    vi.mocked(adminApi.users).mockResolvedValue([{ ...SUPER, isMe: true }, DJ]);
    const update = vi.spyOn(adminApi, 'updateUser').mockResolvedValue(SUPER);
    renderApp(<AppRoutes />, ['/admin/users']);
    const r = await row('bde@hec.ci');
    fireEvent.click(within(r).getByRole('button', { name: 'Modifier le compte bde@hec.ci' }));
    expect(within(r).getByLabelText('Email')).toBeDisabled();
    expect(
      within(r).getByText("L'email du super admin est défini sur le serveur (ADMIN_EMAIL)."),
    ).toBeInTheDocument();
    fireEvent.change(within(r).getByLabelText('Nouveau mot de passe'), {
      target: { value: 'my-new-super-pw' },
    });
    fireEvent.click(within(r).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('s1', { password: 'my-new-super-pw' }));
    expect(
      await screen.findByText('Mot de passe changé. Tes autres sessions ont été déconnectées.'),
    ).toBeInTheDocument();
  });

  it('deletes after an inline confirmation', async () => {
    const del = vi.spyOn(adminApi, 'deleteUser').mockResolvedValue(undefined);
    renderApp(<AppRoutes />, ['/admin/users']);
    const r = await row('dj@hec.ci');
    fireEvent.click(within(r).getByRole('button', { name: 'Supprimer le compte dj@hec.ci' }));
    expect(del).not.toHaveBeenCalled();
    const dialog = within(r).getByRole('alertdialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('u1'));
    expect(await screen.findByText('Compte dj@hec.ci supprimé.')).toBeInTheDocument();
  });
});
