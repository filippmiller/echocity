import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerUser, registerBusiness } from '@/modules/auth/service'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const registerUserSchema = z.object({
  accountType: z.enum(['CITIZEN', 'BUSINESS_OWNER']),
  email: z.string().email('Некорректный email').max(255),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  firstName: z.string().min(1, 'Имя обязательно').max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(200).optional(),
  language: z.enum(['ru', 'en']).optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять условия использования' }),
  }),
}).refine(
  (data) => data.accountType !== 'CITIZEN' || (data.firstName && data.firstName.length > 0),
  { message: 'Имя обязательно для регистрации', path: ['firstName'] },
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerUserSchema.parse(body)

    let result

    if (validated.accountType === 'CITIZEN') {
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

