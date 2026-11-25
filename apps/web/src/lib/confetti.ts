import confetti from 'canvas-confetti';
import { prefersReducedMotion } from './format';

// Brand palette (docs/06 §6) — the canvas API needs literal colours.
const COLORS = ['#0652DD', '#E02424', '#FF3EA5', '#FFC93C', '#22C55E', '#8B5CF6'];

/** Small confetti burst from the clicked button; nothing if reduced motion. */
export function celebrate(origin?: HTMLElement | null): void {
  if (prefersReducedMotion()) return;
  let x = 0.5;
  let y = 0.4;
  if (origin) {
    const r = origin.getBoundingClientRect();
    x = (r.left + r.width / 2) / window.innerWidth;
    y = (r.top + r.height / 2) / window.innerHeight;
  }
  void confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: { x, y },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}
