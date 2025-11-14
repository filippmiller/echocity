import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerUser, registerBusiness } from '@/modules/auth/service'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const registerUserSchema = z.object({
  accountType: z.enum(['USER', 'BUSINESS_OWNER']),
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
  // User fields
  fullName: z.string().optional(),
  homeCity: z.string().optional(),
  preferredLanguage: z.string().optional(),
  // Business fields
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  displayName: z.string().optional(),
  legalName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  placeName: z.string().optional(),
  placeCategory: z.string().optional(),
  placeDescription: z.string().optional(),
  placeCity: z.string().optional(),
  placeAddress: z.string().optional(),
  placePhone: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerUserSchema.parse(body)

    let result

    if (validated.accountType === 'USER') {
      // Validate required user fields
      if (!validated.email || !validated.password) {
        return NextResponse.json(
          { error: 'Email и пароль обязательны' },
          { status: 400 }
        )
      }

      result = await registerUser({
        email: validated.email,
        password: validated.password,
        fullName: validated.fullName,
        homeCity: validated.homeCity,
        preferredLanguage: validated.preferredLanguage,
      })
    } else if (validated.accountType === 'BUSINESS_OWNER') {
      // Validate required business fields
      if (
        !validated.email ||
        !validated.password ||
        !validated.contactName ||
        !validated.contactPhone ||
        !validated.displayName ||
        !validated.contactEmail ||
        !validated.placeName ||
        !validated.placeCategory ||
        !validated.placeCity ||
        !validated.placeAddress ||
        !validated.placePhone
      ) {
        return NextResponse.json(
          { error: 'Все поля обязательны для регистрации бизнеса' },
          { status: 400 }
        )
      }

      result = await registerBusiness({
        email: validated.email,
        password: validated.password,
        contactName: validated.contactName!,
        contactPhone: validated.contactPhone!,
        displayName: validated.displayName!,
        legalName: validated.legalName,
        contactEmail: validated.contactEmail!,
        placeName: validated.placeName!,
        placeCategory: validated.placeCategory!,
        placeDescription: validated.placeDescription,
        placeCity: validated.placeCity!,
        placeAddress: validated.placeAddress!,
        placePhone: validated.placePhone!,
      })
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

