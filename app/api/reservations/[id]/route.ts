import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { cancelReservation } from '@/modules/reservations/service'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

const cancelSchema = z.object({
  action: z.literal('cancel'),
  reason: z.string().max(1000).optional(),
})

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      place: { select: { id: true, title: true, address: true, city: true } },
      table: { select: { id: true, tableNumber: true, zone: true, seats: true } },
    },
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Не найдено' }, { status: 404 })
  }

  // Only allow the user who made the reservation to view it
  if (reservation.userId !== session.userId) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  return NextResponse.json({
    reservation: {
      ...reservation,
      date: reservation.date.toISOString(),
      confirmedAt: reservation.confirmedAt?.toISOString() || null,
      canceledAt: reservation.canceledAt?.toISOString() || null,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
    },
  })
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  let body: z.infer<typeof cancelSchema>
  try {
    body = cancelSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const reservation = await cancelReservation(id, session.userId, body.reason)
    return NextResponse.json({
      reservation: {
        ...reservation,
        date: reservation.date.toISOString(),
        confirmedAt: reservation.confirmedAt?.toISOString() || null,
        canceledAt: reservation.canceledAt?.toISOString() || null,
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
