import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestPasswordReset } from '@/modules/auth/password-reset'
import { logger } from '@/lib/logger'

const requestSchema = z.object({
  email: z.string().email('Некорректный email').max(255),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = requestSchema.parse(body)
    const result = await requestPasswordReset(validated.email)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 },
      )
    }

    logger.error('auth.password_reset.request.api.error', { error: String(error) })
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
