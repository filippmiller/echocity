import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const createCitySchema = z.object({
  name: z.string().min(1, 'Название города обязательно'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  countryCode: z.string().length(2, 'Код страны должен быть 2 символа'),
  timezone: z.string().min(1, 'Часовой пояс обязателен'),
  defaultLanguage: z.string().optional(),
  franchiseId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const cities = await prisma.city.findMany({
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            places: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ cities })
  } catch (error) {
    logger.error('admin.cities.list.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении списка городов' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createCitySchema.parse(body)

    // Check if slug already exists
    const existingCity = await prisma.city.findUnique({
      where: { slug: validated.slug },
    })

    if (existingCity) {
      return NextResponse.json(
        { error: 'Город с таким slug уже существует' },
        { status: 409 }
      )
    }

    // If franchiseId provided, verify it exists
    if (validated.franchiseId) {
      const franchise = await prisma.franchise.findUnique({
        where: { id: validated.franchiseId },
      })
      if (!franchise) {
        return NextResponse.json(
          { error: 'Франшиза не найдена' },
          { status: 404 }
        )
      }
    }

    const city = await prisma.city.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        countryCode: validated.countryCode,
        timezone: validated.timezone,
        defaultLanguage: validated.defaultLanguage,
        franchiseId: validated.franchiseId || null,
      },
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    logger.info('admin.city.created', { cityId: city.id, slug: city.slug })

    return NextResponse.json({ city }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('admin.city.create.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при создании города' },
      { status: 500 }
    )
  }
}


