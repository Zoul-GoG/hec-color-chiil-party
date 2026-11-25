import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useAudioPreview } from '../audio/AudioPreviewProvider';
import { fr } from '../i18n/fr';
import { api, ApiError } from '../lib/api';
import { celebrate } from '../lib/confetti';
import { errorMessage } from '../lib/errors';

/**
 * Add flow (US-3): stop audio → POST → toast + confetti → refresh lists → highlight.
 * Resolves to true on success (incl. "already added by me") so the caller can clear the search.
 */
export function useAddTrack(onAdded?: (trackKey: string) => void) {
  const qc = useQueryClient();
  const { stop } = useAudioPreview();
  const [pending, setPending] = useState<ReadonlySet<number>>(new Set());

  const add = useCallback(
    async (deezerId: number, origin?: HTMLElement | null): Promise<boolean> => {
      stop();
      setPending((s) => new Set(s).add(deezerId));
      try {
        const res = await api.addTrack(deezerId);
        const { title, artist } = res.track;
        if (res.alreadyAddedByMe) {
          toast(fr.toasts.already);
        } else {
          toast.success(
            res.created || res.othersCount === 0
              ? fr.toasts.created(title, artist)
              : fr.toasts.joined(title, res.othersCount),
          );
          celebrate(origin);
        }
        void qc.invalidateQueries({ queryKey: ['tracks'] });
        void qc.invalidateQueries({ queryKey: ['search'] });
        onAdded?.(res.track.trackKey);
        return true;
      } catch (e) {
        toast.error(errorMessage(e));
        if (e instanceof ApiError && e.code === 'SUBMISSIONS_CLOSED')
          void qc.invalidateQueries({ queryKey: ['settings'] });
        return false;
      } finally {
        setPending((s) => {
          const next = new Set(s);
          next.delete(deezerId);
          return next;
        });
      }
    },
    [onAdded, qc, stop],
  );

  return { add, isPending: (deezerId: number) => pending.has(deezerId) };
}
