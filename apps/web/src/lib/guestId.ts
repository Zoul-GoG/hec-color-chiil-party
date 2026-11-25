import { STORAGE_KEYS } from '../config';

let memoryId: string | null = null;

function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback for non-secure contexts (e.g. testing on a LAN IP over http).
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Anonymous guest identity, persisted in localStorage (docs/01-PRD.md §5). */
export function getGuestId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.guestId);
    if (stored) return stored;
    const id = uuidV4();
    localStorage.setItem(STORAGE_KEYS.guestId, id);
    return id;
  } catch {
    memoryId ??= uuidV4();
    return memoryId;
  }
}
