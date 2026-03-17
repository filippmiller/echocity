import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => mockCookieStore),
}))

// Set SESSION_SECRET before importing the module
process.env.SESSION_SECRET = 'test-secret-key-for-unit-tests-32chars!'

import { createSession, getSession, deleteSession } from '@/modules/auth/session'

describe('auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSession', () => {
    it('generates a signed cookie with base64url payload and HMAC signature', async () => {
      const data = { userId: 'user-1', email: 'test@example.com', role: 'CONSUMER' as const }

      await createSession(data)

      expect(mockCookieStore.set).toHaveBeenCalledOnce()
      const [cookieName, cookieValue, options] = mockCookieStore.set.mock.calls[0]

      expect(cookieName).toBe('cityecho_session')

      // Cookie value should be "payload.signature"
      const parts = cookieValue.split('.')
      expect(parts.length).toBe(2)

      // Payload should decode to the original data
      const decoded = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'))
      expect(decoded).toEqual(data)

      // Signature should be a hex string (64 chars for sha256)
      expect(parts[1]).toMatch(/^[a-f0-9]{64}$/)

      // Cookie options should be secure
      expect(options.httpOnly).toBe(true)
      expect(options.sameSite).toBe('lax')
      expect(options.path).toBe('/')
      expect(options.maxAge).toBe(60 * 60 * 24 * 7) // 7 days
    })
  })

  describe('getSession', () => {
    it('returns session data for a valid signed cookie', async () => {
      const data = { userId: 'user-1', email: 'test@example.com', role: 'CONSUMER' as const }

      // First create a session to capture the signed value
      await createSession(data)
      const signedValue = mockCookieStore.set.mock.calls[0][1]

      // Now mock the get to return that value
      mockCookieStore.get.mockReturnValue({ value: signedValue })

      const session = await getSession()
      expect(session).toEqual(data)
    })

    it('returns null for a tampered cookie (modified payload)', async () => {
      const data = { userId: 'user-1', email: 'test@example.com', role: 'CONSUMER' as const }

      await createSession(data)
      const signedValue = mockCookieStore.set.mock.calls[0][1] as string
      const [, signature] = signedValue.split('.')

      // Tamper the payload: encode different data
      const tampered = { userId: 'admin-hack', email: 'evil@hacker.com', role: 'ADMIN' }
      const tamperedPayload = Buffer.from(JSON.stringify(tampered)).toString('base64url')
      const tamperedCookie = `${tamperedPayload}.${signature}`

      mockCookieStore.get.mockReturnValue({ value: tamperedCookie })
      const session = await getSession()
      expect(session).toBeNull()
    })

    it('returns null for a tampered cookie (modified signature)', async () => {
      const data = { userId: 'user-1', email: 'test@example.com', role: 'CONSUMER' as const }

      await createSession(data)
      const signedValue = mockCookieStore.set.mock.calls[0][1] as string
      const [payload] = signedValue.split('.')

      // Replace last char of signature
      const fakeSignature = 'a'.repeat(64)
      const tamperedCookie = `${payload}.${fakeSignature}`

      mockCookieStore.get.mockReturnValue({ value: tamperedCookie })
      const session = await getSession()
      expect(session).toBeNull()
    })

    it('returns null when no cookie is present', async () => {
      mockCookieStore.get.mockReturnValue(undefined)
      const session = await getSession()
      expect(session).toBeNull()
    })

    it('returns null when cookie value is empty', async () => {
      mockCookieStore.get.mockReturnValue({ value: '' })
      const session = await getSession()
      expect(session).toBeNull()
    })

    it('returns null for a cookie without a dot separator', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'nodothere' })
      const session = await getSession()
      expect(session).toBeNull()
    })

    it('roundtrips session data correctly for different roles', async () => {
      for (const role of ['CONSUMER', 'MERCHANT', 'ADMIN'] as const) {
        vi.clearAllMocks()
        const data = { userId: `user-${role}`, email: `${role.toLowerCase()}@test.com`, role }

        await createSession(data)
        const signedValue = mockCookieStore.set.mock.calls[0][1]
        mockCookieStore.get.mockReturnValue({ value: signedValue })

        const session = await getSession()
        expect(session).toEqual(data)
      }
    })
  })

  describe('deleteSession', () => {
    it('deletes the session cookie', async () => {
      await deleteSession()
      expect(mockCookieStore.delete).toHaveBeenCalledWith('cityecho_session')
    })
  })
})
