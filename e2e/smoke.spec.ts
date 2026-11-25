import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('guest: search -> add -> card visible in the playlist', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Chill Party');
  await page.getByRole('combobox', { name: 'Rechercher un morceau' }).fill('magic system');
  await page.keyboard.press('Enter');
  const panel = page.locator('#search-suggestions');
  const firstRow = panel.locator('li').first();
  await expect(firstRow).toBeVisible({ timeout: 15_000 });
  const title = (await firstRow.locator('p').first().textContent())!.trim();

  const addButton = firstRow.getByRole('button', { name: /^Ajouter/ });
  if (await addButton.count()) {
    await addButton.click();
    await expect(page.getByText(/est dans la playlist|ajouté ! Tu rejoins|déjà ajouté ce son/)).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Rechercher un morceau' })).toHaveValue('');
  }
  await expect(
    page.getByRole('article', { name: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} — `) }),
  ).toBeVisible();
});

test('admin: login -> dashboard shows the ranking -> logout', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel('Adresse email').fill('e2e@hec.local');
  await page.getByLabel('Mot de passe', { exact: true }).fill('e2e-password-123');
  await page.getByRole('button', { name: /Se connecter/ }).click();
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Classement des morceaux' })).toBeVisible();
  await expect(page.getByText(/^\d+ titres?$/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
