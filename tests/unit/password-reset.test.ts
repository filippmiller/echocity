import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPrisma, mockLogger, mockSendPasswordResetEmail } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  mockSendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@/lib/logger', () => ({ logger: mockLogger }))
vi.mock('@/modules/auth/password-reset-email', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}))

import {
  confirmPasswordReset,
  hashResetToken,
  requestPasswordReset,
} from '@/modules/auth/password-reset'

describe('auth/password-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'test')
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.test'
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    mockSendPasswordResetEmail.mockResolvedValue(undefined)
    mockPrisma.$transaction.mockImplementation(async (operations: unknown[]) => operations)
  })

  it('returns a generic success response when the email does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const result = await requestPasswordReset('missing@example.test')

    expect(result.success).toBe(true)
    expect(result.resetUrl).toBeUndefined()
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
  })

  it('creates a hashed single-use token for an active user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'USER@example.test',
      isActive: true,
    })

    const result = await requestPasswordReset('USER@example.test')

    expect(result.resetUrl).toMatch(/^https:\/\/example\.test\/auth\/reset-password\?token=/)
    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', usedAt: null },
      data: { usedAt: expect.any(Date) },
    })
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
    })
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      'USER@example.test',
      expect.stringMatching(/^https:\/\/example\.test\/auth\/reset-password\?token=/),
    )
  })

  it('does not expose the reset URL in production responses', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.test',
      isActive: true,
    })

    const result = await requestPasswordReset('user@example.test')

    expect(result.resetUrl).toBeUndefined()
    expect(mockSendPasswordResetEmail).toHaveBeenCalledOnce()
  })

  it('rejects expired or already used reset tokens', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      user: { isActive: true },
    })

    const result = await confirmPasswordReset('expired-token', 'StrongPass1')

    expect(result).toEqual({
      success: false,
      error: 'Ссылка для восстановления недействительна или истекла',
      errorCode: 'INVALID_TOKEN',
    })
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it('updates the password and marks reset tokens used for a valid token', async () => {
    const token = 'valid-token'
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      user: { isActive: true },
    })
    mockPrisma.user.update.mockResolvedValue({})
    mockPrisma.passwordResetToken.update.mockResolvedValue({})
    mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 })

    const result = await confirmPasswordReset(token, 'StrongPass1')

    expect(result).toEqual({ success: true })
    expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashResetToken(token) },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { isActive: true } },
      },
    })
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: expect.stringMatching(/^\$2[aby]\$/) },
    })
    expect(mockPrisma.$transaction).toHaveBeenCalledWith([
      expect.any(Promise),
      expect.any(Promise),
      expect.any(Promise),
    ])
  })
})
