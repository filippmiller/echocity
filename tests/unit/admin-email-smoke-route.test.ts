import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}))

const { mockSendEmail, mockIsEmailDeliveryConfigured } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockIsEmailDeliveryConfigured: vi.fn(),
}))

vi.mock('@/modules/auth/session', () => ({
  getSession: mockGetSession,
}))

vi.mock('@/modules/email/resend', () => ({
  sendEmail: mockSendEmail,
  isEmailDeliveryConfigured: mockIsEmailDeliveryConfigured,
}))

const ADMIN_SESSION = { userId: 'admin-1', role: 'ADMIN' as const, email: 'admin@example.test' }

describe('/api/admin/email/smoke', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(ADMIN_SESSION)
  })

  it('rejects non-admin users', async () => {
    mockGetSession.mockResolvedValueOnce({ userId: 'user-1', role: 'CITIZEN', email: 'user@example.test' })
    const { POST } = await import('@/app/api/admin/email/smoke/route')
    const response = await POST()
    expect(response.status).toBe(401)
  })

  it('returns actionable status when email is not configured', async () => {
    mockIsEmailDeliveryConfigured.mockReturnValue(false)
    const { POST } = await import('@/app/api/admin/email/smoke/route')
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.sent).toBe(false)
    expect(body.configured).toBe(false)
    expect(body.message).toContain('RESEND_API_KEY')
    expect(body.message).toContain('EMAIL_FROM')
  })

  it('sends a test email when configured', async () => {
    mockIsEmailDeliveryConfigured.mockReturnValue(true)
    mockSendEmail.mockResolvedValue(undefined)
    const { POST } = await import('@/app/api/admin/email/smoke/route')
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.sent).toBe(true)
    expect(body.configured).toBe(true)
    expect(body.message).toContain(ADMIN_SESSION.email)
    expect(mockSendEmail).toHaveBeenCalledOnce()

    const args = mockSendEmail.mock.calls[0][0]
    expect(args.to).toBe(ADMIN_SESSION.email)
    expect(args.subject).toBe('EchoCity email smoke test')
    expect(args.html).toContain('test email')
    expect(args.text).toContain('test email')
  })

  it('returns 502 when sending fails', async () => {
    mockIsEmailDeliveryConfigured.mockReturnValue(true)
    mockSendEmail.mockRejectedValue(new Error('Resend API error'))
    const { POST } = await import('@/app/api/admin/email/smoke/route')
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.sent).toBe(false)
    expect(body.configured).toBe(true)
    expect(body.message).toContain('Resend API error')
  })
})
