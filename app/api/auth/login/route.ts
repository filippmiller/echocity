import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loginUser } from '@/modules/auth/service'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    const result = await loginUser({
      email: validated.email,
      password: validated.password,
    })

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: result.errorCode === 'INVALID_CREDENTIALS' ? 401 : 403 }
      )
    }

    // Create session
    await createSession({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    })

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('auth.login.api.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

