import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { updateOfferSchema } from '@/modules/offers/validation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await prisma.offer.findUnique({ where: { id }, include: { merchant: true } })
  if (!offer || offer.merchant.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (offer.approvalStatus !== 'DRAFT' && offer.approvalStatus !== 'REJECTED') {
    return NextResponse.json({ error: 'Can only edit DRAFT or REJECTED offers' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = updateOfferSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const { schedules, blackoutDates, rules, limits, ...simpleFields } = parsed.data
  const updated = await prisma.$transaction(async (tx) => {
    const baseOffer = await tx.offer.update({
      where: { id },
      data: {
        ...simpleFields,
        offerType: simpleFields.offerType as any,
        benefitType: simpleFields.benefitType as any,
        visibility: simpleFields.visibility as any,
        startAt: simpleFields.startAt ? new Date(simpleFields.startAt) : undefined,
        endAt: simpleFields.endAt ? new Date(simpleFields.endAt) : undefined,
      },
    })

    if (schedules !== undefined) {
      await tx.offerSchedule.deleteMany({ where: { offerId: id } })
      if (schedules.length > 0) {
        await tx.offerSchedule.createMany({
          data: schedules.map((schedule) => ({
            offerId: id,
            weekday: schedule.weekday,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          })),
        })
      }
    }

    if (blackoutDates !== undefined) {
      await tx.offerBlackoutDate.deleteMany({ where: { offerId: id } })
      if (blackoutDates.length > 0) {
        await tx.offerBlackoutDate.createMany({
          data: blackoutDates.map((blackout) => ({
            offerId: id,
            date: new Date(blackout.date),
            reason: blackout.reason ?? null,
          })),
        })
      }
    }

    if (rules !== undefined) {
      await tx.offerRule.deleteMany({ where: { offerId: id } })
      if (rules.length > 0) {
        await tx.offerRule.createMany({
          data: rules.map((rule) => ({
            offerId: id,
            ruleType: rule.ruleType as any,
            operator: rule.operator ?? null,
            value: rule.value as any,
          })),
        })
      }
    }

    if (limits !== undefined) {
      const hasLimits = Object.values(limits).some((value) => value !== undefined)
      if (hasLimits) {
        await tx.offerLimit.upsert({
          where: { offerId: id },
          update: {
            dailyLimit: limits.dailyLimit ?? null,
            weeklyLimit: limits.weeklyLimit ?? null,
            monthlyLimit: limits.monthlyLimit ?? null,
            totalLimit: limits.totalLimit ?? null,
            perUserDailyLimit: limits.perUserDailyLimit ?? null,
            perUserWeeklyLimit: limits.perUserWeeklyLimit ?? null,
            perUserLifetimeLimit: limits.perUserLifetimeLimit ?? null,
          },
          create: {
            offerId: id,
            dailyLimit: limits.dailyLimit ?? null,
            weeklyLimit: limits.weeklyLimit ?? null,
            monthlyLimit: limits.monthlyLimit ?? null,
            totalLimit: limits.totalLimit ?? null,
            perUserDailyLimit: limits.perUserDailyLimit ?? null,
            perUserWeeklyLimit: limits.perUserWeeklyLimit ?? null,
            perUserLifetimeLimit: limits.perUserLifetimeLimit ?? null,
          },
        })
      } else {
        await tx.offerLimit.deleteMany({ where: { offerId: id } })
      }
    }

    return tx.offer.findUniqueOrThrow({
      where: { id: baseOffer.id },
      include: {
        schedules: true,
        blackoutDates: true,
        rules: true,
        limits: true,
        branch: { select: { id: true, title: true, address: true } },
      },
    })
  })

  return NextResponse.json({ offer: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const offer = await prisma.offer.findUnique({ where: { id }, include: { merchant: true } })
  if (!offer || offer.merchant.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.offer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
