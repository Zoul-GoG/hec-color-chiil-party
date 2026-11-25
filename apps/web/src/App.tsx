import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { DashboardPage } from './features/admin/DashboardPage';
import { LoginPage } from './features/admin/LoginPage';
import { RequireAdmin } from './features/admin/RequireAdmin';
import { GuestPage } from './features/guest/GuestPage';
import { NotFoundPage } from './features/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <DashboardPage />
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
