import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { registerBusiness } from '@/modules/auth/service'
import { createSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const registerBusinessSchema = z.object({
  // Step 1: Contact person
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'Телефон обязателен'),
  
  // Step 2: Business data
  businessName: z.string().min(1, 'Название бизнеса обязательно'),
  legalName: z.string().optional(),
  businessType: z.string().min(1, 'Тип бизнеса обязателен'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  instagram: z.string().optional(),
  vk: z.string().optional(),
  telegram: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal('')),
  supportPhone: z.string().optional(),
  
  // Step 3: First place
  placeTitle: z.string().min(1, 'Название точки обязательно'),
  placeCity: z.string().min(1, 'Город обязателен'),
  placeAddress: z.string().min(1, 'Адрес обязателен'),
  placeLat: z.number().optional(),
  placeLng: z.number().optional(),
  placePhone: z.string().optional(),
  placeType: z.string().min(1, 'Тип точки обязателен'),
  hasWorkspace: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  hasSockets: z.boolean().optional(),
  isSpecialtyCoffee: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  isKidsFriendly: z.boolean().optional(),
  openingHours: z.any().optional(),
  averageCheck: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = registerBusinessSchema.parse(body)

    const result = await registerBusiness({
      email: validated.email,
      password: validated.password,
      firstName: validated.firstName,
      lastName: validated.lastName,
      phone: validated.phone,
      businessName: validated.businessName,
      legalName: validated.legalName,
      businessType: validated.businessType,
      description: validated.description,
      website: validated.website || undefined,
      instagram: validated.instagram,
      vk: validated.vk,
      telegram: validated.telegram,
      supportEmail: validated.supportEmail || undefined,
      supportPhone: validated.supportPhone,
      placeTitle: validated.placeTitle,
      placeCity: validated.placeCity,
      placeAddress: validated.placeAddress,
      placeLat: validated.placeLat,
      placeLng: validated.placeLng,
      placePhone: validated.placePhone,
      placeType: validated.placeType,
      hasWorkspace: validated.hasWorkspace,
      hasWifi: validated.hasWifi,
      hasSockets: validated.hasSockets,
      isSpecialtyCoffee: validated.isSpecialtyCoffee,
      hasParking: validated.hasParking,
      isKidsFriendly: validated.isKidsFriendly,
      openingHours: validated.openingHours,
      averageCheck: validated.averageCheck,
    })

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

    logger.error('business.register.api.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}


