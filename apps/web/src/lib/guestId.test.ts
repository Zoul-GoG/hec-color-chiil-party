import { describe, expect, it } from 'vitest';
import { getGuestId } from './guestId';

describe('getGuestId', () => {
  it('creates and persists a UUID v4', () => {
    const id = getGuestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(localStorage.getItem('hcc-guest-id')).toBe(id);
    expect(getGuestId()).toBe(id);
  });
});
