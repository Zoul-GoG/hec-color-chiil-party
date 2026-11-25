import type { ReactNode } from 'react';
import { LayoutDashboard, LogOut, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui/Button';
import { useAdminMe, useLogout } from '../../hooks/useAdmin';
import { txt } from '../../i18n';

export function AdminHeader({ extra }: { extra?: ReactNode }) {
  const me = useAdminMe();
  const logout = useLogout();
  const onUsersPage = useLocation().pathname.startsWith('/admin/users');
  const nav = onUsersPage
    ? { to: '/admin', label: txt.admin.dashboardLink, Icon: LayoutDashboard }
    : { to: '/admin/users', label: txt.admin.usersLink, Icon: Users };
  return (
    <Header
      compactBrand
      suffix={txt.admin.suffix}
      right={
        <>
          {extra}
          <Link
            to={nav.to}
            aria-label={nav.label}
            title={nav.label}
            className="inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-semibold text-fg hover:bg-surface-2 max-sm:w-10 max-sm:justify-center max-sm:px-0"
          >
            <nav.Icon className="size-4" aria-hidden />
            <span className="hidden sm:inline">{nav.label}</span>
          </Link>
          {me.data ? (
            <span className="hidden max-w-48 truncate text-sm text-fg-muted md:inline">{me.data.email}</span>
          ) : null}
          <Button
            variant="ghost"
            size="md"
            loading={logout.isPending}
            onClick={() => logout.mutate()}
            aria-label={txt.admin.logout}
            className="max-sm:size-10 max-sm:px-0"
          >
            {logout.isPending ? null : <LogOut className="size-4" aria-hidden />}
            <span className="hidden sm:inline">{txt.admin.logout}</span>
          </Button>
        </>
      }
    />
  );
}
