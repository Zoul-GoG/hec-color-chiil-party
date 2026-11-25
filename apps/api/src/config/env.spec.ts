import { validateEnv } from './env';

const valid = {
  ADMIN_EMAIL: 'bde@hec.ci',
  ADMIN_PASSWORD: 'long-password',
  JWT_SECRET: '0123456789abcdef0123',
};

describe('validateEnv', () => {
  it('accepts the 4 variables', () => {
    expect(validateEnv({ ...valid, MONGODB_URI: 'mongodb://x/db' }, true)).toEqual({
      ...valid,
      MONGODB_URI: 'mongodb://x/db',
    });
  });

  it('allows a missing MONGODB_URI outside production (in-memory fallback)', () => {
    expect(validateEnv({ ...valid, MONGODB_URI: '' }, false).MONGODB_URI).toBeUndefined();
  });

  it('requires MONGODB_URI in production', () => {
    expect(() => validateEnv(valid, true)).toThrow(/MONGODB_URI/);
  });

  it('rejects a missing admin email with a clear message', () => {
    expect(() => validateEnv({ ...valid, ADMIN_EMAIL: undefined }, false)).toThrow(
      'variable(s) manquante(s) : ADMIN_EMAIL',
    );
    expect(() => validateEnv({}, true)).toThrow('MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET');
    expect(() => validateEnv({ ...valid, ADMIN_EMAIL: 'nope' }, false)).toThrow(
      /ADMIN_EMAIL doit être un email valide/,
    );
  });
});
