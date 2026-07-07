import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockRequestPasswordReset, mockConfirmPasswordReset, mockLogger } = vi.hoisted(() => ({
  mockRequestPasswordReset: vi.fn(),
  mockConfirmPasswordReset: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/modules/auth/password-reset', () => ({
  requestPasswordReset: mockRequestPasswordReset,
  confirmPasswordReset: mockConfirmPasswordReset,
}))

vi.mock('@/lib/logger', () => ({ logger: mockLogger }))

import { POST as requestReset } from '@/app/api/auth/password-reset/request/route'
import { POST as confirmReset } from '@/app/api/auth/password-reset/confirm/route'

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('password reset API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequestPasswordReset.mockResolvedValue({
      success: true,
      message: 'Если аккаунт с таким email существует, мы отправим инструкции по восстановлению.',
    })
    mockConfirmPasswordReset.mockResolvedValue({ success: true })
  })

  it('request route returns 200 for a valid email', async () => {
    const response = await requestReset(jsonRequest('http://localhost/api/auth/password-reset/request', {
      email: 'user@example.test',
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      success: true,
      message: 'Если аккаунт с таким email существует, мы отправим инструкции по восстановлению.',
    })
    expect(mockRequestPasswordReset).toHaveBeenCalledWith('user@example.test')
  })

  it('request route returns 400 for invalid email payload', async () => {
    const response = await requestReset(jsonRequest('http://localhost/api/auth/password-reset/request', {
      email: 'not-an-email',
    }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Ошибка валидации')
    expect(mockRequestPasswordReset).not.toHaveBeenCalled()
  })

  it('confirm route returns 200 on successful password reset', async () => {
    const response = await confirmReset(jsonRequest('http://localhost/api/auth/password-reset/confirm', {
      token: 'valid-reset-token-1234567890',
      password: 'StrongPass1',
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(mockConfirmPasswordReset).toHaveBeenCalledWith('valid-reset-token-1234567890', 'StrongPass1')
  })

  it('confirm route returns 400 for weak passwords', async () => {
    mockConfirmPasswordReset.mockResolvedValueOnce({
      success: false,
      error: 'Пароль слишком простой',
      errorCode: 'WEAK_PASSWORD',
    })

    const response = await confirmReset(jsonRequest('http://localhost/api/auth/password-reset/confirm', {
      token: 'valid-reset-token-1234567890',
      password: 'Weakpass1',
    }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: 'Пароль слишком простой',
      errorCode: 'WEAK_PASSWORD',
    })
  })

  it('confirm route returns 410 for invalid or expired tokens', async () => {
    mockConfirmPasswordReset.mockResolvedValueOnce({
      success: false,
      error: 'Ссылка для восстановления недействительна или истекла',
      errorCode: 'INVALID_TOKEN',
    })

    const response = await confirmReset(jsonRequest('http://localhost/api/auth/password-reset/confirm', {
      token: 'expired-reset-token-123456789',
      password: 'StrongPass1',
    }))
    const body = await response.json()

    expect(response.status).toBe(410)
    expect(body.errorCode).toBe('INVALID_TOKEN')
  })
})
