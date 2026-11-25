import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { Spinner } from './components/ui/Spinner';
import { RequireAdmin } from './features/admin/RequireAdmin';
import { GuestPage } from './features/guest/GuestPage';
import { NotFoundPage } from './features/NotFoundPage';

// Admin pages are split out so guests (90 % on phones) never download them.
const LoginPage = lazy(() => import('./features/admin/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('./features/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const UsersPage = lazy(() => import('./features/admin/UsersPage').then((m) => ({ default: m.UsersPage })));

const fallback = (
  <div className="flex min-h-dvh items-center justify-center text-fg-muted" role="status">
    <Spinner className="size-6" />
  </div>
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestPage />} />
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={fallback}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Suspense fallback={fallback}>
              <DashboardPage />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAdmin>
            <Suspense fallback={fallback}>
              <UsersPage />
            </Suspense>
          </RequireAdmin>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}
