import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const updatePreferencesSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
})

/**
 * GET /api/notifications/preferences
 *
 * Return the current user's notification preference flags.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
      select: {
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: true,
      },
    })

    // Return defaults if profile does not exist yet
    if (!profile) {
      return NextResponse.json({
        preferences: {
          notificationsEnabled: true,
          pushNotifications: false,
          emailNotifications: true,
        },
      })
    }

    return NextResponse.json({ preferences: profile })
  } catch (error) {
    logger.error('notifications.preferences.get.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при получении настроек' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/preferences
 *
 * Update notification preference flags on the user's profile.
 *
 * When pushNotifications is disabled, all PushSubscription records
 * for the user are also removed.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updatePreferencesSchema.parse(body)

    const profile = await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...data,
      },
      update: data,
      select: {
        notificationsEnabled: true,
        pushNotifications: true,
        emailNotifications: true,
      },
    })

    // If push was explicitly disabled, clean up subscriptions
    if (data.pushNotifications === false) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.userId },
      })
      logger.info('push.subscriptions.cleared', { userId: session.userId })
    }

    logger.info('notifications.preferences.updated', { userId: session.userId, data })

    return NextResponse.json({ preferences: profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('notifications.preferences.update.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при обновлении настроек' },
      { status: 500 }
    )
  }
}
