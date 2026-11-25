import { escapeRegex, hashIp, isDuplicateKeyError } from './utils';

describe('utils', () => {
  it('escapes regex special chars', () => {
    const re = new RegExp(escapeRegex('a.(b)*[c]?'), 'i');
    expect(re.test('A.(B)*[C]?')).toBe(true);
    expect(() => new RegExp(escapeRegex('('))).not.toThrow();
  });

  it('hashes IPs deterministically without exposing them', () => {
    const h = hashIp('1.2.3.4', 'secret');
    expect(h).toMatch(/^[0-9a-f]{16}$/);
    expect(h).toBe(hashIp('1.2.3.4', 'secret'));
    expect(h).not.toBe(hashIp('1.2.3.4', 'other'));
  });

  it('detects duplicate key errors', () => {
    expect(isDuplicateKeyError({ code: 11000 })).toBe(true);
    expect(isDuplicateKeyError(new Error('x'))).toBe(false);
  });
});
