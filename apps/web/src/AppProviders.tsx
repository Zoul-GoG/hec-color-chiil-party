import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Fragment, useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AudioPreviewProvider } from './audio/AudioPreviewProvider';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useLang } from './i18n';
import { ThemeProvider, useTheme } from './lib/theme';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: true, retry: 1 } },
  });
}

function AppToaster() {
  const { theme } = useTheme();
  const desktop = useMediaQuery('(min-width: 640px)');
  return (
    <Toaster
      theme={theme}
      position={desktop ? 'top-right' : 'top-center'}
      duration={3500}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast: '!bg-surface !text-fg !border-border !shadow-float !font-sans',
          description: '!text-fg-muted',
        },
      }}
    />
  );
}

/** Re-mounts the UI when the language changes so every string is re-read (caches are kept above). */
function LangBoundary({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  return <Fragment key={lang}>{children}</Fragment>;
}

export function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? createQueryClient());
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AudioPreviewProvider>
          <LangBoundary>{children}</LangBoundary>
          <AppToaster />
        </AudioPreviewProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
