import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerUser, registerBusiness } from '@/modules/auth/service'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const registerUserSchema = z.object({
  accountType: z.enum(['CITIZEN', 'BUSINESS_OWNER']),
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
  // CITIZEN fields
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  language: z.enum(['ru', 'en']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerUserSchema.parse(body)

    let result

    if (validated.accountType === 'CITIZEN') {
      // Validate required user fields
      if (!validated.email || !validated.password || !validated.firstName) {
        return NextResponse.json(
          { error: 'Email, пароль и имя обязательны' },
          { status: 400 }
        )
      }

      result = await registerUser({
        email: validated.email,
        password: validated.password,
        firstName: validated.firstName!,
        lastName: validated.lastName,
        phone: validated.phone,
        city: validated.city,
        language: validated.language,
      })
    } else if (validated.accountType === 'BUSINESS_OWNER') {
      // Business registration should go through /business/register wizard
      return NextResponse.json(
        { error: 'Регистрация бизнеса доступна через мастер регистрации' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: 'Неверный тип аккаунта' },
        { status: 400 }
      )
    }

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error, errorCode: result.errorCode },
        { status: result.errorCode === 'EMAIL_EXISTS' ? 409 : 400 }
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

    logger.error('auth.register.api.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

