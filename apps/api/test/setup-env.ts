// Deterministic env for tests (overrides any local .env file).
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.JWT_SECRET = 'test-jwt-secret-0123456789abcdef';
process.env.MONGODB_URI = '';
