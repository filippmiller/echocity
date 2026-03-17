import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const familyPlan = await prisma.familyPlan.findUnique({
    where: { ownerUserId: session.userId },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      },
      subscription: {
        include: { plan: true },
      },
    },
  })

  // Also check if user is a member of someone else's plan
  const membership = !familyPlan
    ? await prisma.familyMember.findFirst({
        where: { userId: session.userId },
        include: {
          familyPlan: {
            include: {
              owner: { select: { id: true, email: true, firstName: true } },
              subscription: { include: { plan: true } },
            },
          },
        },
      })
    : null

  return NextResponse.json({ familyPlan, membership })
}

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check active subscription
  const sub = await prisma.userSubscription.findFirst({
    where: { userId: session.userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  if (!sub) {
    return NextResponse.json({ error: 'Нужна активная подписка Plus или Premium' }, { status: 403 })
  }

  if (sub.plan.code === 'free') {
    return NextResponse.json({ error: 'Семейный план недоступен для бесплатного тарифа' }, { status: 403 })
  }

  // Check if already has a family plan
  const existing = await prisma.familyPlan.findUnique({
    where: { ownerUserId: session.userId },
  })
  if (existing) {
    return NextResponse.json({ error: 'Семейный план уже создан' }, { status: 409 })
  }

  // Determine max members based on plan
  const maxMembers = sub.plan.code === 'premium' ? 4 : 2

  const familyPlan = await prisma.familyPlan.create({
    data: {
      ownerUserId: session.userId,
      subscriptionId: sub.id,
      maxMembers,
    },
    include: {
      members: true,
      subscription: { include: { plan: true } },
    },
  })

  return NextResponse.json({ familyPlan }, { status: 201 })
}
