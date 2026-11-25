import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppProviders } from './AppProviders';
import { GuestPage } from './features/guest/GuestPage';
import { NotFoundPage } from './features/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GuestPage />} />
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
