import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { notifyFlashDealNearby } from '@/modules/notifications/triggers'
import { logger } from '@/lib/logger'

const flashSchema = z.object({
  branchId: z.string(),
  title: z.string().min(3).max(200),
  benefitType: z.enum(['PERCENT', 'FIXED_AMOUNT', 'FIXED_PRICE', 'FREE_ITEM']),
  benefitValue: z.number().positive(),
  durationMinutes: z.number().int().min(10).max(120).default(30),
  totalLimit: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  // Verify user is a business owner
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, businesses: { select: { id: true } } },
  })

  if (!user || user.role !== 'BUSINESS_OWNER' || user.businesses.length === 0) {
    return NextResponse.json({ error: 'Только для бизнес-аккаунтов' }, { status: 403 })
  }

  let body: z.infer<typeof flashSchema>
  try {
    body = flashSchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ошибка валидации', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify the branch belongs to this merchant
  const branch = await prisma.place.findUnique({
    where: { id: body.branchId },
    select: { businessId: true },
  })

  if (!branch || !user.businesses.some((b) => b.id === branch.businessId)) {
    return NextResponse.json({ error: 'Филиал не принадлежит вашему бизнесу' }, { status: 403 })
  }

  const now = new Date()
  const endAt = new Date(now.getTime() + body.durationMinutes * 60 * 1000)

  // Create flash offer — auto-approved, immediately active
  const offer = await prisma.offer.create({
    data: {
      merchantId: branch.businessId!,
      branchId: body.branchId,
      title: body.title,
      offerType: 'FLASH',
      visibility: 'PUBLIC',
      benefitType: body.benefitType,
      benefitValue: body.benefitValue,
      currency: 'RUB',
      approvalStatus: 'APPROVED',
      lifecycleStatus: 'ACTIVE',
      startAt: now,
      endAt,
      redemptionChannel: 'IN_STORE',
      createdByUserId: session.userId,
      limits: body.totalLimit
        ? { create: { totalLimit: body.totalLimit } }
        : undefined,
    },
  })

  // Trigger push notifications (non-blocking)
  notifyFlashDealNearby(offer.id).catch((err) =>
    logger.error('flash.notifyFailed', { offerId: offer.id, error: String(err) })
  )

  return NextResponse.json(
    {
      offer: {
        id: offer.id,
        title: offer.title,
        endAt: offer.endAt,
        durationMinutes: body.durationMinutes,
      },
    },
    { status: 201 }
  )
}
