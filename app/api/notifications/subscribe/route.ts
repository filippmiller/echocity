import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

/**
 * POST /api/notifications/subscribe
 *
 * Register a push subscription for the authenticated user.
 * Creates or updates the PushSubscription record and enables
 * pushNotifications on the user profile.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint, keys } = subscribeSchema.parse(body)

    // Upsert: if this endpoint already exists, update keys (they can rotate)
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: session.userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    // Enable push notifications on user profile
    await prisma.userProfile.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        pushNotifications: true,
        notificationsEnabled: true,
      },
      update: {
        pushNotifications: true,
      },
    })

    logger.info('push.subscribe.success', { userId: session.userId, endpoint })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Некорректные данные подписки', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('push.subscribe.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при подписке на уведомления' },
      { status: 500 }
    )
  }
}
