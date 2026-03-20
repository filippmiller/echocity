import type { Page } from '@playwright/test'
import { api } from './auth-helpers'

const E2E_PREFIX = 'e2e-test'
let counter = 0

/**
 * Generate a unique e2e test email.
 */
export function generateTestEmail(suffix?: string): string {
  const ts = Date.now()
  const s = suffix || `${++counter}`
  return `${E2E_PREFIX}-${ts}-${s}@test.echocity.ru`
}

/**
 * Register a new citizen user via the /api/auth/register endpoint.
 * Returns { email, password, name }.
 */
export async function registerCitizen(page: Page, overrides?: { email?: string; name?: string }) {
  const email = overrides?.email || generateTestEmail('citizen')
  const name = overrides?.name || 'E2E Test User'
  const password = 'E2eTest1234!'

  const result = await api(page, '/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password,
      confirmPassword: password,
      firstName: name,
      role: 'CITIZEN',
    },
  })

  return { email, password, name, ok: result.ok, status: result.status, body: result.body }
}

/**
 * Register a new business owner via the /api/auth/register endpoint.
 */
export async function registerBusiness(page: Page, overrides?: { email?: string; businessName?: string }) {
  const email = overrides?.email || generateTestEmail('biz')
  const businessName = overrides?.businessName || 'E2E Test Business'
  const password = 'E2eTest1234!'

  const result = await api(page, '/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password,
      confirmPassword: password,
      firstName: 'BizOwner',
      role: 'BUSINESS_OWNER',
      businessName,
      businessType: 'CAFE',
      phone: '+79001234567',
    },
  })

  return { email, password, businessName, ok: result.ok, status: result.status, body: result.body }
}
