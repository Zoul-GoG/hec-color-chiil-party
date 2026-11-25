import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { LangToggle } from '../../components/LangToggle';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { ADMIN_ME_KEY, useAdminMe } from '../../hooks/useAdmin';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { txt } from '../../i18n';
import { adminApi } from '../../lib/api';
import { errorCode, errorMessage } from '../../lib/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** /admin/login (docs/07 §2). */
export function LoginPage() {
  useDocumentTitle(txt.titles.login);
  const me = useAdminMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const ids = { email: useId(), password: useId(), emailErr: useId(), passwordErr: useId() };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.data) return <Navigate to="/admin" replace />;

  const emailError = touched && !EMAIL_RE.test(email.trim()) ? txt.login.emailInvalid : null;
  const passwordError = touched && !password ? txt.login.passwordRequired : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!EMAIL_RE.test(email.trim()) || !password) return;
    setSubmitting(true);
    try {
      const res = await adminApi.login({ email: email.trim(), password, remember });
      qc.setQueryData(ADMIN_ME_KEY, res);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from?.startsWith('/admin') && from !== '/admin/login' ? from : '/admin', { replace: true });
    } catch (err) {
      setError(errorCode(err) === 'RATE_LIMITED' ? txt.login.tooMany : errorMessage(err));
      setSubmitting(false);
    }
  };

  const inputCls =
    'h-12 w-full rounded-md border border-border bg-surface-2 pl-11 text-base text-fg placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-blue focus:outline-none';

  return (
    <div className="bg-gradient-login relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-red/25 blur-3xl dark:bg-brand-red/12" />
        <div className="absolute -top-24 -left-24 hidden size-96 rounded-full bg-brand-blue/18 blur-3xl dark:block" />
      </div>
      <header className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo onDark suffix={txt.login.brandSuffix} />
        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-xl border border-border bg-surface px-6 py-8 shadow-float sm:px-10 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <Badge variant="blue">
              <ShieldCheck className="size-3.5" aria-hidden /> {txt.login.badge}
            </Badge>
            <h1 className="mt-4 font-display text-[26px] leading-8 font-bold text-fg sm:text-[32px] sm:leading-10">
              {txt.login.title}
            </h1>
            <p className="mt-2 text-sm text-fg-muted">{txt.login.subtitle}</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor={ids.email} className="mb-1.5 block text-sm font-semibold text-fg">
                {txt.login.email}
              </label>
              <div className="relative">
                <Mail
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id={ids.email}
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={txt.login.emailPlaceholder}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? ids.emailErr : undefined}
                  className={cn(inputCls, 'pr-4', emailError && 'border-brand-red')}
                />
              </div>
              {emailError ? (
                <p id={ids.emailErr} className="mt-1.5 text-xs text-brand-red-text">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor={ids.password} className="mb-1.5 block text-sm font-semibold text-fg">
                {txt.login.password}
              </label>
              <div className="relative">
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-fg-subtle"
                />
                <input
                  id={ids.password}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? ids.passwordErr : undefined}
                  className={cn(inputCls, 'pr-12', passwordError && 'border-brand-red')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? txt.login.hidePassword : txt.login.showPassword}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-1.5 inline-flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-fg-muted hover:bg-surface-3"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden />
                  ) : (
                    <Eye className="size-5" aria-hidden />
                  )}
                </button>
              </div>
              {passwordError ? (
                <p id={ids.passwordErr} className="mt-1.5 text-xs text-brand-red-text">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-fg">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 cursor-pointer accent-brand-blue"
              />
              {txt.login.remember}
            </label>

            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md bg-brand-red-soft px-3 py-2.5 text-sm text-brand-red-text"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </div>
            ) : null}

            <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full">
              {txt.login.submit} {submitting ? null : <ArrowRight className="size-5" aria-hidden />}
            </Button>
          </form>

          <div className="mt-6 rounded-md bg-surface-2 px-4 py-3 text-center text-xs text-fg-muted">
            <p className="flex items-center justify-center gap-1.5 font-semibold text-fg">
              <ShieldCheck className="size-4" aria-hidden /> {txt.login.restrictedTitle}
            </p>
            <p className="mt-1">{txt.login.restrictedText}</p>
          </div>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-white/90 hover:text-white dark:text-fg-muted dark:hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden /> {txt.login.back}
        </Link>
      </main>
    </div>
  );
}
