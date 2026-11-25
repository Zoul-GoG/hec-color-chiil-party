import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from '../AppProviders';

export function renderApp(ui: ReactElement, initialEntries: string[] = ['/']) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchInterval: false } } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AppProviders>,
  );
}
