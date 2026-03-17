import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'
import { logger } from '@/lib/logger'

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

/**
 * POST /api/notifications/unsubscribe
 *
 * Remove a push subscription for the authenticated user.
 * If no subscriptions remain, pushNotifications is set to false.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = unsubscribeSchema.parse(body)

    // Delete the subscription if it exists and belongs to this user
    const deleted = await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: session.userId,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Подписка не найдена' }, { status: 404 })
    }

    // Check if user has any remaining subscriptions
    const remaining = await prisma.pushSubscription.count({
      where: { userId: session.userId },
    })

    // If no subscriptions left, disable push in profile
    if (remaining === 0) {
      await prisma.userProfile.updateMany({
        where: { userId: session.userId },
        data: { pushNotifications: false },
      })
    }

    logger.info('push.unsubscribe.success', { userId: session.userId, endpoint })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('push.unsubscribe.error', { error: String(error) })
    return NextResponse.json(
      { error: 'Ошибка при отписке от уведомлений' },
      { status: 500 }
    )
  }
}
