import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui/Button';
import { useAdminMe, useLogout } from '../../hooks/useAdmin';
import { txt } from '../../i18n';

export function AdminHeader({ extra }: { extra?: ReactNode }) {
  const me = useAdminMe();
  const logout = useLogout();
  return (
    <Header
      suffix={txt.admin.suffix}
      right={
        <>
          {extra}
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
