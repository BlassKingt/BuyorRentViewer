import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'browser.spec.ts', fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5173', channel: process.platform === 'win32' ? 'msedge' : undefined, trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Edge'], viewport: { width: 1440, height: 1080 } } }],
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
