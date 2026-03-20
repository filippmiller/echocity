import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const verifySchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, 'Номер телефона должен быть в формате +7XXXXXXXXXX'),
  code: z.string().length(4, 'Код должен состоять из 4 цифр'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = verifySchema.parse(body)
    const { phone, code } = validated

    // Find valid OTP: matching phone+code, not expired, not used
    const otp = await prisma.phoneOtp.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json(
        { error: 'Неверный или просроченный код' },
        { status: 401 }
      )
    }

    // Mark OTP as used
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { used: true },
    })

    // Find or create user with this phone number
    let user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (user) {
      // Existing user — check if active
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Аккаунт деактивирован' },
          { status: 403 }
        )
      }
      logger.info('auth.phone.login', { userId: user.id, phone })
    } else {
      // New user — create with phone, auto-generate placeholder email
      const placeholderEmail = `${phone.replace('+', '')}@echocity.local`

      const created = await prisma.user.create({
        data: {
          email: placeholderEmail,
          passwordHash: '', // phone-only user has no password
          role: 'CITIZEN',
          firstName: 'Пользователь',
          phone,
          phoneVerified: true,
          profile: {
            create: {
              homeCity: 'Санкт-Петербург',
              preferredLanguage: 'ru',
              phone,
            },
          },
        },
        select: { id: true, email: true, role: true, isActive: true },
      })

      user = created
      logger.info('auth.phone.register', { userId: user.id, phone })
    }

    // Create session (same as email login)
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Ошибка валидации' },
        { status: 400 }
      )
    }

    logger.error('auth.phone.verify.error', { error: String(error) })
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
