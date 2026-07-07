import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { confirmPasswordReset } from '@/modules/auth/password-reset'
import { logger } from '@/lib/logger'

const confirmSchema = z.object({
  token: z.string().min(20, 'Некорректная ссылка').max(500),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов').max(200),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = confirmSchema.parse(body)
    const result = await confirmPasswordReset(validated.token, validated.password)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: result.errorCode === 'WEAK_PASSWORD' ? 400 : 410 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 },
      )
    }

    logger.error('auth.password_reset.confirm.api.error', { error: String(error) })
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
