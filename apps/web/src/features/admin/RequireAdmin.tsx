import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminMe } from '../../hooks/useAdmin';
import { txt } from '../../i18n';

/** Redirects to /admin/login when the session cookie is missing/expired. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const me = useAdminMe();
  const location = useLocation();
  if (me.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-fg-muted" role="status">
        <Spinner className="size-6" />
        <span className="sr-only">{txt.admin.loading}</span>
      </div>
    );
  }
  if (me.isError) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
