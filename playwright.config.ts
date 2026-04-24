import { defineConfig, devices } from '@playwright/test'

// Default to localhost. Running against a non-local host requires explicit opt-in
// via E2E_FORCE_PROD=1 so a mis-set BASE_URL can't accidentally hammer production.
const DEFAULT_BASE_URL = 'http://localhost:3010'
const BASE_URL = process.env.BASE_URL || DEFAULT_BASE_URL

const isLocal = BASE_URL.startsWith('http://localhost') || BASE_URL.startsWith('http://127.0.0.1')
if (!isLocal && process.env.E2E_FORCE_PROD !== '1') {
  throw new Error(
    `Refusing to run Playwright against non-local BASE_URL=${BASE_URL} without E2E_FORCE_PROD=1. ` +
      `If you really intend to hit a remote environment, re-run with E2E_FORCE_PROD=1.`,
  )
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // NB: storageState (e.g. the echocity_onboarded=1 localStorage stub) is per-test,
    // not global — a global stub silently flips every flow past onboarding and
    // masks regressions in the real first-visit experience.
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: isLocal
    ? {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
})
