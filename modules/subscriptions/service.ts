import { prisma } from '@/lib/prisma'
import type { UserSubscriptionStatus } from './types'

export async function getPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionStatus> {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!sub) return { isSubscribed: false, planCode: 'free', status: null, endAt: null }

  return {
    isSubscribed: true,
    planCode: sub.plan.code,
    status: sub.status,
    endAt: sub.endAt,
  }
}

export async function createSubscription(userId: string, planCode: string, externalSubscriptionId?: string) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } })
  if (!plan) throw new Error('Plan not found')
  if (plan.code === 'free') throw new Error('Cannot subscribe to free plan')

  const now = new Date()
  const endAt = new Date(now)
  endAt.setMonth(endAt.getMonth() + 1)

  const trialEndAt = plan.trialDays > 0
    ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
    : endAt

  return prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: plan.trialDays > 0 ? 'TRIALING' : 'ACTIVE',
      startAt: now,
      endAt: plan.trialDays > 0 ? trialEndAt : endAt,
      autoRenew: true,
      externalSubscriptionId,
    },
  })
}

export async function cancelSubscription(userId: string) {
  const sub = await prisma.userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) throw new Error('No active subscription')

  return prisma.userSubscription.update({
    where: { id: sub.id },
    data: { autoRenew: false, canceledAt: new Date() },
  })
}

// Cron job: expire past-grace subscriptions
export async function expireSubscriptions() {
  const now = new Date()
  const result = await prisma.userSubscription.updateMany({
    where: {
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      endAt: { lte: now },
      autoRenew: false,
    },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
