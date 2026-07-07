import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getPasswordStrengthError, hashPassword } from '@/lib/password'
import { logger } from '@/lib/logger'
import { sendPasswordResetEmail } from '@/modules/auth/password-reset-email'

const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000
const RESET_REQUEST_MESSAGE = 'Если аккаунт с таким email существует, мы отправим инструкции по восстановлению.'

export interface PasswordResetRequestResult {
  success: true
  message: string
  resetUrl?: string
}

export interface PasswordResetConfirmResult {
  success: boolean
  error?: string
  errorCode?: string
}

export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function buildResetUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  return `${appUrl.replace(/\/$/, '')}/auth/reset-password?token=${encodeURIComponent(token)}`
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, isActive: true },
  })

  if (!user || !user.isActive) {
    logger.info('auth.password_reset.request.ignored', { email: normalizedEmail })
    return { success: true, message: RESET_REQUEST_MESSAGE }
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString('base64url')
  const resetUrl = buildResetUrl(token)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  })

  await sendPasswordResetEmail(user.email, resetUrl)

  logger.info('auth.password_reset.request.created', {
    userId: user.id,
    email: user.email,
    resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
  })

  return {
    success: true,
    message: RESET_REQUEST_MESSAGE,
    resetUrl: process.env.NODE_ENV === 'production' ? undefined : resetUrl,
  }
}

export async function confirmPasswordReset(
  token: string,
  password: string,
): Promise<PasswordResetConfirmResult> {
  const passwordError = getPasswordStrengthError(password)
  if (passwordError) {
    return { success: false, error: passwordError, errorCode: 'WEAK_PASSWORD' }
  }

  const tokenHash = hashResetToken(token)
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: { select: { isActive: true } },
    },
  })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date() || !resetToken.user.isActive) {
    return {
      success: false,
      error: 'Ссылка для восстановления недействительна или истекла',
      errorCode: 'INVALID_TOKEN',
    }
  }

  const passwordHash = await hashPassword(password)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
        id: { not: resetToken.id },
      },
      data: { usedAt: new Date() },
    }),
  ])

  logger.info('auth.password_reset.confirmed', { userId: resetToken.userId })
  return { success: true }
}
