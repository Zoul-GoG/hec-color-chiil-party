import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../App';
import { adminApi, api, ApiError } from '../../lib/api';
import { renderApp } from '../../test/render';

const unauthorized = () => new ApiError(401, 'UNAUTHORIZED', 'x');

beforeEach(() => {
  vi.spyOn(api, 'tracks').mockResolvedValue({ items: [], total: 0, page: 1, limit: 24, hasMore: false });
});
afterEach(() => vi.restoreAllMocks());

const fill = (email: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Adresse email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: password } });
};

describe('Admin auth (front)', () => {
  it('redirects /admin to the login page when not logged in', async () => {
    vi.spyOn(adminApi, 'me').mockRejectedValue(unauthorized());
    renderApp(<AppRoutes />, ['/admin']);
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activer le mode/ })).toBeInTheDocument();
  });

  it('validates fields client-side without calling the API', async () => {
    vi.spyOn(adminApi, 'me').mockRejectedValue(unauthorized());
    const login = vi.spyOn(adminApi, 'login');
    renderApp(<AppRoutes />, ['/admin/login']);
    await screen.findByRole('heading', { name: 'Connexion' });
    fill('nope', '');
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));
    expect(screen.getByText('Saisis une adresse email valide.')).toBeInTheDocument();
    expect(screen.getByText('Saisis ton mot de passe.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the generic error on bad credentials', async () => {
    vi.spyOn(adminApi, 'me').mockRejectedValue(unauthorized());
    vi.spyOn(adminApi, 'login').mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'x'));
    renderApp(<AppRoutes />, ['/admin/login']);
    await screen.findByRole('heading', { name: 'Connexion' });
    fill('bde@hec.ci', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.');
  });

  it('shows the 429 message', async () => {
    vi.spyOn(adminApi, 'me').mockRejectedValue(unauthorized());
    vi.spyOn(adminApi, 'login').mockRejectedValue(new ApiError(429, 'RATE_LIMITED', 'x'));
    renderApp(<AppRoutes />, ['/admin/login']);
    await screen.findByRole('heading', { name: 'Connexion' });
    fill('bde@hec.ci', 'wrong');
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Trop de tentatives. Réessaie dans 15 minutes.',
    );
  });

  it('logs in with remember me and lands on the dashboard', async () => {
    vi.spyOn(adminApi, 'me').mockRejectedValue(unauthorized());
    const login = vi.spyOn(adminApi, 'login').mockResolvedValue({ email: 'bde@hec.ci' });
    renderApp(<AppRoutes />, ['/admin/login']);
    await screen.findByRole('heading', { name: 'Connexion' });
    fill('bde@hec.ci', 'secret');
    fireEvent.click(screen.getByLabelText('Se souvenir de moi'));
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le mot de passe' }));
    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));
    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith({ email: 'bde@hec.ci', password: 'secret', remember: true });
  });

  it('already logged in: /admin/login redirects to /admin; logout goes back to login', async () => {
    const me = vi.spyOn(adminApi, 'me').mockResolvedValue({ email: 'bde@hec.ci' });
    vi.spyOn(adminApi, 'logout').mockResolvedValue(undefined);
    renderApp(<AppRoutes />, ['/admin/login']);
    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    me.mockRejectedValue(unauthorized());
    fireEvent.click(screen.getByRole('button', { name: 'Déconnexion' }));
    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });
});
