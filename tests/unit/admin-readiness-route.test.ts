import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}))

vi.mock('@/modules/auth/session', () => ({
  getSession: mockGetSession,
}))

const ADMIN_SESSION = { userId: 'admin-1', role: 'ADMIN' as const, email: 'admin@example.test' }

describe('/api/admin/readiness', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()

    process.env.DATABASE_URL = 'postgres://localhost/echocity'
    process.env.SESSION_SECRET = 'session-secret'
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.test'
    process.env.MINIO_ENDPOINT = 'http://localhost:9000'
    process.env.MINIO_ACCESS_KEY = 'minio'
    process.env.MINIO_SECRET_KEY = 'minio123'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.EMAIL_FROM = 'no-reply@example.test'
    process.env.YANDEX_MAPS_API_KEY = 'ymaps-key'
    process.env.YOKASSA_SHOP_ID = 'shop-id'
    process.env.YOKASSA_SECRET_KEY = 'yokassa-secret'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'vapid-public'
    process.env.VAPID_PRIVATE_KEY = 'vapid-private'
    process.env.VAPID_SUBJECT = 'mailto:ops@example.test'
    process.env.SENTRY_DSN = 'sentry-dsn'
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'public-sentry-dsn'
    process.env.YOKASSA_WEBHOOK_SECRET = 'webhook-secret'
    process.env.LEGAL_NAME = 'ООО «ГдеСейчас»'
    process.env.LEGAL_INN = '1234567890'
    process.env.LEGAL_OGRN = '0987654321098'
    process.env.LEGAL_ADDRESS = 'г. Санкт-Петербург'
    process.env.SUPPORT_EMAIL = 'info@gdesejchas.ru'
    process.env.SUPPORT_PHONE = '+7 999 000-00-00'

    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('rejects non-admin users', async () => {
    mockGetSession.mockResolvedValueOnce({ userId: 'user-1', role: 'CITIZEN', email: 'user@example.test' })
    const { GET } = await import('@/app/api/admin/readiness/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('rejects unauthenticated users', async () => {
    mockGetSession.mockResolvedValueOnce(null)
    const { GET } = await import('@/app/api/admin/readiness/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns env checklist and integration group without exposing values', async () => {
    const { GET } = await import('@/app/api/admin/readiness/route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.env.complete).toBe(true)
    expect(body.env.missing).toEqual([])
    expect(body.integrations.complete).toBe(true)
    expect(body.integrations.missing).toEqual([])
    expect(body.legal.complete).toBe(true)
    expect(body.legal.missing).toEqual([])

    for (const item of body.env.checklist) {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('present')
      expect(item).not.toHaveProperty('value')
    }

    for (const item of body.integrations.checklist) {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('present')
      expect(item).not.toHaveProperty('value')
    }

    const integrationKeys = body.integrations.checklist.map((i: { key: string }) => i.key)
    expect(integrationKeys).toContain('RESEND_API_KEY')
    expect(integrationKeys).toContain('EMAIL_FROM')
    expect(integrationKeys).toContain('SENTRY_DSN')
    expect(integrationKeys).toContain('NEXT_PUBLIC_SENTRY_DSN')
    expect(integrationKeys).toContain('YOKASSA_SHOP_ID')
    expect(integrationKeys).toContain('YOKASSA_SECRET_KEY')
    expect(integrationKeys).toContain('YOKASSA_WEBHOOK_SECRET')

    const legalKeys = body.legal.checklist.map((i: { key: string }) => i.key)
    expect(legalKeys).toContain('LEGAL_NAME')
    expect(legalKeys).toContain('LEGAL_INN')
    expect(legalKeys).toContain('LEGAL_OGRN')
    expect(legalKeys).toContain('LEGAL_ADDRESS')
    expect(legalKeys).toContain('SUPPORT_EMAIL')
    expect(legalKeys).toContain('SUPPORT_PHONE')
  })

  it('reports missing integration env vars', async () => {
    delete process.env.SENTRY_DSN
    delete process.env.YOKASSA_WEBHOOK_SECRET

    const { GET } = await import('@/app/api/admin/readiness/route')
    const response = await GET()
    const body = await response.json()

    expect(body.integrations.complete).toBe(false)
    expect(body.integrations.missing).toContain('SENTRY_DSN')
    expect(body.integrations.missing).toContain('YOKASSA_WEBHOOK_SECRET')
  })

  it('reports missing legal env vars', async () => {
    delete process.env.LEGAL_INN
    delete process.env.SUPPORT_PHONE

    const { GET } = await import('@/app/api/admin/readiness/route')
    const response = await GET()
    const body = await response.json()

    expect(body.legal.complete).toBe(false)
    expect(body.legal.missing).toContain('LEGAL_INN')
    expect(body.legal.missing).toContain('SUPPORT_PHONE')
  })
})
