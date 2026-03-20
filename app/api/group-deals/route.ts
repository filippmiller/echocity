import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/group-deals
 * Create a group deal for an offer. Creator auto-joins.
 * Body: { offerId }
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
  }

  let body: { offerId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 })
  }

  const { offerId } = body
  if (!offerId) {
    return NextResponse.json({ error: 'offerId обязателен' }, { status: 400 })
  }

  // Verify offer exists and is active
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, title: true, lifecycleStatus: true, approvalStatus: true },
  })

  if (!offer) {
    return NextResponse.json({ error: 'Предложение не найдено' }, { status: 404 })
  }
  if (offer.lifecycleStatus !== 'ACTIVE' || offer.approvalStatus !== 'APPROVED') {
    return NextResponse.json({ error: 'Предложение недоступно для групп' }, { status: 400 })
  }

  // Check if user already has an active group for this offer as creator
  const existingGroup = await prisma.groupDeal.findFirst({
    where: {
      offerId,
      creatorId: session.userId,
      status: { in: ['OPEN', 'READY'] },
    },
  })

  if (existingGroup) {
    return NextResponse.json({ groupDeal: existingGroup })
  }

  // Create group deal with 24h expiry, creator auto-joins via member record
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const groupDeal = await prisma.groupDeal.create({
    data: {
      offerId,
      creatorId: session.userId,
      expiresAt,
      members: {
        create: {
          userId: session.userId,
        },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      offer: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json({ groupDeal }, { status: 201 })
}

/**
 * GET /api/group-deals
 * List current user's active group deals (as creator or member)
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
  }

  const now = new Date()

  // Mark expired groups before fetching
  await prisma.groupDeal.updateMany({
    where: {
      status: { in: ['OPEN', 'READY'] },
      expiresAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  const groupDeals = await prisma.groupDeal.findMany({
    where: {
      status: { in: ['OPEN', 'READY'] },
      members: {
        some: { userId: session.userId },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      offer: {
        select: {
          id: true,
          title: true,
          benefitType: true,
          benefitValue: true,
          branch: { select: { id: true, title: true } },
        },
      },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ groupDeals })
}
