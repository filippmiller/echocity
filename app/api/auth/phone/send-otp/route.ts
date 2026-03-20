import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+7\d{10}$/, 'Номер телефона должен быть в формате +7XXXXXXXXXX'),
})

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX = 3
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = sendOtpSchema.parse(body)
    const { phone } = validated

    // Rate limit: count non-expired OTPs for this phone in the last 10 minutes
    const recentOtpCount = await prisma.phoneOtp.count({
      where: {
        phone,
        expiresAt: { gt: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
    })

    if (recentOtpCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Подождите 10 минут.' },
        { status: 429 }
      )
    }

    // Generate 4-digit OTP code
    const code = String(Math.floor(1000 + Math.random() * 9000))

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

    // Store OTP in database
    await prisma.phoneOtp.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    })

    // Dev stub: log OTP to console (replace with real SMS provider later)
    console.log(`[OTP] ${phone}: ${code}`)
    logger.info('auth.phone.otp.sent', { phone, expiresAt })

    return NextResponse.json({ sent: true, expiresIn: 300 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Неверный формат телефона' },
        { status: 400 }
      )
    }

    logger.error('auth.phone.send-otp.error', { error: String(error) })
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
