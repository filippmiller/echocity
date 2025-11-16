import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  homeCity: z.string().optional(),
  preferredLanguage: z.enum(['ru', 'en']).optional(),
  timezone: z.string().optional(),
  preferredRadius: z.number().int().positive().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  favoriteCity: z.string().optional(),
})

// GET /api/profile - Get user profile
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            city: true,
            language: true,
          },
        },
      },
    })

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              city: true,
              language: true,
            },
          },
        },
      })
    } else {
      // If profile exists, fetch with user data
      profile = await prisma.userProfile.findUnique({
        where: { userId: session.userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              city: true,
              language: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    logger.error('profile.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении профиля' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateProfileSchema.parse(body)

    // Ensure profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
    })

    let profile
    if (existingProfile) {
      profile = await prisma.userProfile.update({
        where: { userId: session.userId },
        data: validated,
      })
    } else {
      profile = await prisma.userProfile.create({
        data: {
          userId: session.userId,
          ...validated,
        },
      })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('profile.update.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при обновлении профиля' },
      { status: 500 }
    )
  }
}

