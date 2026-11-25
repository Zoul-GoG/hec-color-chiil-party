import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { txt } from '../i18n';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused';

export interface PreviewMeta {
  title: string;
  artist: string;
  cover: string;
}

export interface AudioState {
  currentKey: string | null;
  /** Shown by the mobile mini-player (US-12). */
  meta: PreviewMeta | null;
  status: AudioStatus;
  /** 0..1 */
  progress: number;
}

export interface PreviewSource {
  /** Direct URL (search suggestions). When absent, `resolve` is called first (playlist, dashboard). */
  url?: string | null;
  /** Fetches a fresh URL via GET /api/tracks/:trackKey/preview. */
  resolve: () => Promise<string | null>;
  meta?: PreviewMeta;
}

interface AudioContextValue {
  state: AudioState;
  toggle: (key: string, source: PreviewSource) => void;
  /** Pause / resume the current preview (mini-player). */
  togglePause: () => void;
  stop: () => void;
}

const Ctx = createContext<AudioContextValue | null>(null);

// 1-sample silent WAV used to unlock the element synchronously inside the click (iOS).
const SILENT = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQIAAACAgA==';

const IDLE: AudioState = { currentKey: null, meta: null, status: 'idle', progress: 0 };

/** One shared <audio> for the whole app: a single preview plays at a time (US-2). */
export function AudioPreviewProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>(IDLE);
  const keyRef = useRef<string | null>(null);
  const sourceRef = useRef<PreviewSource | null>(null);
  const retriedRef = useRef(false);
  const tokenRef = useRef(0);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'none';
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const fail = useCallback(() => {
    keyRef.current = null;
    setState(IDLE);
    toast.error(txt.toasts.previewUnavailable);
  }, []);

  const start = useCallback(
    async (url: string | null, token: number) => {
      if (token !== tokenRef.current) return;
      if (!url) return fail();
      const a = getAudio();
      a.src = url;
      try {
        await a.play();
      } catch (e) {
        if ((e as Error).name === 'AbortError' || token !== tokenRef.current) return;
        // onerror handles media errors (expired URL); NotAllowedError etc. end here.
        if ((e as Error).name !== 'NotSupportedError') fail();
      }
    },
    [fail, getAudio],
  );

  // Wire element events once.
  useEffect(() => {
    const a = getAudio();
    const onTime = () =>
      setState((s) => (s.currentKey ? { ...s, progress: a.duration ? a.currentTime / a.duration : 0 } : s));
    const onPlaying = () => setState((s) => (s.currentKey ? { ...s, status: 'playing' } : s));
    const onEnded = () => {
      keyRef.current = null;
      setState(IDLE);
    };
    const onError = () => {
      if (!keyRef.current || !a.src || a.src.startsWith('data:')) return;
      const source = sourceRef.current;
      if (!retriedRef.current && source) {
        retriedRef.current = true;
        const token = tokenRef.current;
        source.resolve().then(
          (url) => start(url, token),
          () => token === tokenRef.current && fail(),
        );
      } else {
        fail();
      }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      a.pause();
    };
  }, [fail, getAudio, start]);

  const stop = useCallback(() => {
    tokenRef.current++;
    keyRef.current = null;
    audioRef.current?.pause();
    setState(IDLE);
  }, []);

  const togglePause = useCallback(() => {
    const a = getAudio();
    if (!keyRef.current) return;
    if (a.paused) {
      void a.play().catch(() => undefined);
      setState((s) => ({ ...s, status: 'playing' }));
    } else {
      a.pause();
      setState((s) => ({ ...s, status: 'paused' }));
    }
  }, [getAudio]);

  const toggle = useCallback(
    (key: string, source: PreviewSource) => {
      const a = getAudio();
      if (keyRef.current === key) return togglePause();
      const token = ++tokenRef.current;
      keyRef.current = key;
      sourceRef.current = source;
      retriedRef.current = !source.url; // resolver already used once when no direct URL
      setState({ currentKey: key, meta: source.meta ?? null, status: 'loading', progress: 0 });
      if (source.url) {
        void start(source.url, token);
        return;
      }
      // Unlock playback within the user gesture before the async URL lookup (iOS Safari).
      a.src = SILENT;
      void a.play().catch(() => undefined);
      source.resolve().then(
        (url) => start(url, token),
        () => token === tokenRef.current && fail(),
      );
    },
    [fail, getAudio, start, togglePause],
  );

  const value = useMemo(() => ({ state, toggle, togglePause, stop }), [state, toggle, togglePause, stop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAudioPreview(): AudioContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudioPreview must be used inside AudioPreviewProvider');
  return ctx;
}
