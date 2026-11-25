import { ADMIN_PASSWORD_MIN, type AdminUserDto } from '@hcc/shared';
import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from '../../hooks/useAdminUsers';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { locale, txt } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { AdminHeader } from './AdminHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputCls =
  'h-11 w-full rounded-md border border-border bg-surface-2 pl-10 text-sm text-fg placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-blue focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(locale(), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function validate(email: string | undefined, password: string | undefined, passwordRequired: boolean) {
  const errors: { email?: string; password?: string } = {};
  if (email !== undefined && !EMAIL_RE.test(email.trim())) errors.email = txt.users.emailInvalid;
  if ((passwordRequired || password) && (password ?? '').length < ADMIN_PASSWORD_MIN)
    errors.password = txt.users.passwordTooShort(ADMIN_PASSWORD_MIN);
  return errors;
}

/** /admin/users — every admin can list, add, edit and delete accounts (super admin protected). */
export function UsersPage() {
  useDocumentTitle(txt.titles.users);
  const users = useAdminUsers();

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 lg:px-8">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden /> {txt.users.back}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] leading-9 font-bold text-fg">{txt.users.title}</h1>
            {users.data ? <Badge variant="blue">{txt.users.count(users.data.length)}</Badge> : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{txt.users.subtitle}</p>
        </div>

        <AddUserCard />

        <Card className="p-0">
          {users.isPending ? (
            <ul aria-label={txt.admin.loading} className="divide-y divide-border">
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </li>
              ))}
            </ul>
          ) : users.isError ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 p-8 text-center text-sm text-fg-muted"
            >
              <AlertTriangle className="size-6 text-brand-red-text" aria-hidden />
              {txt.users.loadError}
              <Button size="sm" onClick={() => void users.refetch()}>
                {txt.users.retry}
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {users.data.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

function AddUserCard() {
  const create = useCreateAdminUser();
  const ids = { email: useId(), password: useId(), hint: useId() };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = validate(email, password, true);
    setErrors(v);
    if (v.email || v.password) return;
    create.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (u) => {
          toast.success(txt.users.created(u.email));
          setEmail('');
          setPassword('');
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-fg">
        <UserPlus className="size-5 text-brand-blue-text" aria-hidden />
        {txt.users.addTitle}
      </h2>
      <p id={ids.hint} className="mt-1 text-sm text-fg-muted">
        {txt.users.addHint(ADMIN_PASSWORD_MIN)}
      </p>
      <form
        onSubmit={submit}
        noValidate
        className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-start"
      >
        <Field id={ids.email} label={txt.users.email} error={errors.email}>
          <Mail
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
          />
          <input
            id={ids.email}
            type="email"
            autoComplete="off"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={txt.users.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${ids.email}-err` : undefined}
            className={cn(inputCls, 'pr-3', errors.email && 'border-brand-red')}
          />
        </Field>
        <Field id={ids.password} label={txt.users.password} error={errors.password}>
          <PasswordInput
            id={ids.password}
            value={password}
            onChange={setPassword}
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? `${ids.password}-err` : ids.hint}
          />
        </Field>
        <Button type="submit" variant="primary" loading={create.isPending} className="h-11 md:mt-[26px]">
          {txt.users.create}
        </Button>
      </form>
    </Card>
  );
}

function UserRow({ user }: { user: AdminUserDto }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view');
  const del = useDeleteAdminUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const confirmDelete = () =>
    del.mutate(user.id, {
      onSuccess: () => {
        toast.success(txt.users.deleted(user.email));
        if (user.isMe) {
          qc.removeQueries({ queryKey: ['admin'] });
          navigate('/admin/login', { replace: true });
        }
      },
      onError: (err) => toast.error(errorMessage(err)),
    });

  return (
    <li className="px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-full font-display text-base font-bold uppercase',
            user.isSuperAdmin
              ? 'bg-brand-red-soft text-brand-red-text'
              : 'bg-brand-blue-soft text-brand-blue-text',
          )}
        >
          {user.isSuperAdmin ? <Crown className="size-5" /> : user.email[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-fg">{user.email}</p>
            {user.isSuperAdmin ? <Badge variant="red">{txt.users.superAdmin}</Badge> : null}
            {user.isMe ? <Badge variant="blue">{txt.users.you}</Badge> : null}
          </div>
          <p className="tabular mt-0.5 text-xs text-fg-muted">
            {txt.users.createdAt(formatDate(user.createdAt))} ·{' '}
            {user.lastLoginAt ? txt.users.lastLogin(formatDate(user.lastLoginAt)) : txt.users.neverLoggedIn}
          </p>
        </div>
        {mode === 'view' ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              onClick={() => setMode('edit')}
              // Super admin seen by another admin: nothing is editable (email fixed, password its own).
              disabled={user.isSuperAdmin && !user.isMe}
              title={user.isSuperAdmin && !user.isMe ? txt.users.superPasswordLocked : undefined}
              aria-label={txt.users.editAria(user.email)}
            >
              <Pencil className="size-4" aria-hidden />
              <span className="max-sm:sr-only">{txt.users.edit}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode('delete')}
              disabled={user.isSuperAdmin}
              title={user.isSuperAdmin ? txt.users.superNoDelete : undefined}
              aria-label={txt.users.deleteAria(user.email)}
              // `!`: wins over the ghost variant's text colour.
              className="text-brand-red-text!"
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="max-sm:sr-only">{txt.users.delete}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {mode === 'delete' ? (
        <div
          role="alertdialog"
          aria-label={user.isMe ? txt.users.deleteSelfConfirm : txt.users.deleteConfirm(user.email)}
          className="mt-3 flex flex-col gap-3 rounded-md bg-brand-red-soft p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-brand-red-text">
            {user.isMe ? txt.users.deleteSelfConfirm : txt.users.deleteConfirm(user.email)}
          </p>
          <div className="flex shrink-0 justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setMode('view')} autoFocus>
              {txt.users.cancel}
            </Button>
            <Button size="sm" variant="primary" loading={del.isPending} onClick={confirmDelete}>
              {txt.users.delete}
            </Button>
          </div>
        </div>
      ) : null}

      {mode === 'edit' ? <EditUserForm user={user} onDone={() => setMode('view')} /> : null}
    </li>
  );
}

function EditUserForm({ user, onDone }: { user: AdminUserDto; onDone: () => void }) {
  const update = useUpdateAdminUser();
  const ids = { email: useId(), password: useId(), hint: useId() };
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const emailLocked = user.isSuperAdmin;
  const passwordLocked = user.isSuperAdmin && !user.isMe;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body: { email?: string; password?: string } = {};
    if (!emailLocked && email.trim().toLowerCase() !== user.email) body.email = email.trim();
    if (!passwordLocked && password) body.password = password;
    const v = validate(body.email, body.password, false);
    setErrors(v);
    if (v.email || v.password) return;
    if (!body.email && !body.password) {
      toast(txt.users.nothingToSave);
      onDone();
      return;
    }
    update.mutate(
      { id: user.id, body },
      {
        onSuccess: (u) => {
          if (body.password)
            toast.success(user.isMe ? txt.users.ownPasswordChanged : txt.users.otherPasswordChanged(u.email));
          else toast.success(txt.users.saved);
          onDone();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mt-4 grid gap-3 rounded-md border border-border bg-surface-2/50 p-3 sm:p-4 md:grid-cols-2"
    >
      <Field
        id={ids.email}
        label={txt.users.email}
        error={errors.email}
        note={emailLocked ? txt.users.superEmailLocked : undefined}
      >
        <Mail
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
        />
        <input
          id={ids.email}
          type="email"
          autoComplete="off"
          value={email}
          disabled={emailLocked}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${ids.email}-err` : emailLocked ? `${ids.email}-note` : undefined}
          className={cn(inputCls, 'pr-3', errors.email && 'border-brand-red')}
        />
      </Field>
      <Field
        id={ids.password}
        label={txt.users.newPassword}
        error={errors.password}
        note={passwordLocked ? txt.users.superPasswordLocked : txt.users.newPasswordHint(ADMIN_PASSWORD_MIN)}
      >
        <PasswordInput
          id={ids.password}
          value={password}
          onChange={setPassword}
          disabled={passwordLocked}
          invalid={Boolean(errors.password)}
          describedBy={errors.password ? `${ids.password}-err` : `${ids.password}-note`}
        />
      </Field>
      <div className="flex justify-end gap-2 md:col-span-2">
        <Button size="sm" variant="ghost" onClick={onDone}>
          {txt.users.cancel}
        </Button>
        <Button size="sm" type="submit" variant="brand" loading={update.isPending}>
          {txt.users.save}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  note,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="relative">{children}</div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-brand-red-text">
          {error}
        </p>
      ) : note ? (
        <p id={`${id}-note`} className="mt-1.5 text-xs text-fg-subtle">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  invalid,
  disabled,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Lock
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
      />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={cn(inputCls, 'pr-11', invalid && 'border-brand-red')}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        disabled={disabled}
        aria-label={show ? txt.users.hidePassword : txt.users.showPassword}
        aria-pressed={show}
        className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </>
  );
}
