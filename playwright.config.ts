import { defineConfig, devices } from '@playwright/test';

const PORT = 3500;

/** US-14 smoke tests against the production build (Nest serves the web build). Needs network (real Deezer). */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node apps/api/dist/main.js',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    // No MONGODB_URI outside production -> in-memory MongoDB.
    env: {
      PORT: String(PORT),
      MONGODB_URI: '',
      ADMIN_EMAIL: 'e2e@hec.local',
      ADMIN_PASSWORD: 'e2e-password-123',
      JWT_SECRET: 'e2e-jwt-secret-0123456789abcdef',
    },
  },
});
