import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/logger', () => ({ logger: mockLogger }))

import { isEmailDeliveryConfigured, sendEmail } from '@/modules/email/resend'

describe('email/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
  })

  it('reports email delivery as configured only when both required env vars exist', () => {
    expect(isEmailDeliveryConfigured()).toBe(false)

    process.env.RESEND_API_KEY = 'test-api-key'
    expect(isEmailDeliveryConfigured()).toBe(false)

    process.env.EMAIL_FROM = 'no-reply@example.test'
    expect(isEmailDeliveryConfigured()).toBe(true)
  })

  it('sends email through the Resend API', async () => {
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.EMAIL_FROM = 'no-reply@example.test'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(''),
    })
    vi.stubGlobal('fetch', fetchMock)

    await sendEmail({
      to: 'user@example.test',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'no-reply@example.test',
        to: 'user@example.test',
        subject: 'Subject',
        html: '<p>Hello</p>',
        text: 'Hello',
      }),
    })
  })

  it('fails visibly when Resend rejects the message', async () => {
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.EMAIL_FROM = 'no-reply@example.test'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('unauthorized'),
    }))

    await expect(sendEmail({
      to: 'user@example.test',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
    })).rejects.toThrow('Email delivery failed')

    expect(mockLogger.error).toHaveBeenCalledWith('email.resend.failed', {
      status: 401,
      body: 'unauthorized',
    })
  })
})
