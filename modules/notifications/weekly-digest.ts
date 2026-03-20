/**
 * Weekly digest push notification service.
 *
 * Sends a personalised push notification to every user who has
 * push notifications enabled, summarising new offers in their city
 * and how much they saved last week.
 */

import { prisma } from '@/lib/prisma'
import { sendPushNotification } from './push'
import { NotificationType } from './types'
import { logger } from '@/lib/logger'

const BATCH_SIZE = 50

/**
 * Send the weekly digest to all opted-in users.
 * Returns the number of users notified.
 */
export async function sendWeeklyDigests(): Promise<number> {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Collect users who have push enabled in batches via cursor pagination
  let cursor: string | undefined = undefined
  let notifiedCount = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DigestUser = { id: string; city: string; profile: { favoriteCity: string | null } | null }

  for (;;) {
    const findArgs = {
      where: {
        isActive: true,
        profile: {
          notificationsEnabled: true,
          pushNotifications: true,
        },
      },
      select: {
        id: true,
        city: true,
        profile: {
          select: { favoriteCity: true },
        },
      },
      take: BATCH_SIZE,
      orderBy: { id: 'asc' as const },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : undefined,
    }
    const users: DigestUser[] = await prisma.user.findMany(findArgs)

    if (users.length === 0) break

    // Gather per-user data and send notifications in parallel within this batch
    await Promise.allSettled(
      users.map(async (user) => {
        try {
          const city = user.profile?.favoriteCity || user.city || 'Санкт-Петербург'

          const [newOffersCount, savingsResult] = await Promise.all([
            // Count new offers in this user's city in the last 7 days
            prisma.offer.count({
              where: {
                lifecycleStatus: 'ACTIVE',
                approvalStatus: 'APPROVED',
                createdAt: { gte: weekAgo },
                branch: { city },
              },
            }),
            // Sum user savings from the last 7 days
            prisma.userSavings.aggregate({
              _sum: { savedAmount: true },
              where: {
                userId: user.id,
                savedAt: { gte: weekAgo },
              },
            }),
          ])

          const savedLastWeek = Math.floor((savingsResult._sum.savedAmount ?? 0) / 100)

          let body: string
          if (newOffersCount > 0 && savedLastWeek > 0) {
            body = `${newOffersCount} новых скидок на этой неделе. Вы сэкономили ${savedLastWeek}₽!`
          } else if (newOffersCount > 0) {
            body = `${newOffersCount} новых скидок ждут вас!`
          } else if (savedLastWeek > 0) {
            body = `Вы сэкономили ${savedLastWeek}₽ на прошлой неделе. Продолжайте!`
          } else {
            body = 'Посмотрите свежие скидки рядом с вами'
          }

          await sendPushNotification(user.id, {
            title: 'Новое на ГдеСейчас',
            body,
            url: '/offers',
            type: NotificationType.WEEKLY_DIGEST,
          })

          notifiedCount++
        } catch (err) {
          logger.error('weeklyDigest.user.failed', { userId: user.id, error: String(err) })
        }
      })
    )

    if (users.length < BATCH_SIZE) break
    cursor = users[users.length - 1].id
  }

  return notifiedCount
}
