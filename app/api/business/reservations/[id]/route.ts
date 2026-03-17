import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { confirmReservation, cancelReservation } from '@/modules/reservations/service'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const body = await req.json()
  const { action, reason } = body

  try {
    let reservation

    switch (action) {
      case 'confirm':
        reservation = await confirmReservation(id, session.userId)
        break

      case 'cancel':
        reservation = await cancelReservation(id, session.userId, reason)
        break

      case 'complete':
        // Verify merchant owns the place
        reservation = await prisma.reservation.findUnique({
          where: { id },
          include: {
            place: {
              select: {
                businessId: true,
                businessAccount: { select: { ownerUserId: true } },
              },
            },
          },
        })
        if (!reservation) throw new Error('Не найдено')

        const ownsViaAccount = reservation.place.businessAccount?.ownerUserId === session.userId
        let ownsViaBiz = false
        if (reservation.place.businessId) {
          const biz = await prisma.business.findFirst({
            where: { id: reservation.place.businessId, ownerId: session.userId },
          })
          ownsViaBiz = !!biz
        }
        if (!ownsViaAccount && !ownsViaBiz) throw new Error('Нет доступа')

        reservation = await prisma.reservation.update({
          where: { id },
          data: { status: 'COMPLETED' },
        })
        break

      case 'no_show':
        // Verify merchant owns the place
        const res = await prisma.reservation.findUnique({
          where: { id },
          include: {
            place: {
              select: {
                businessId: true,
                businessAccount: { select: { ownerUserId: true } },
              },
            },
          },
        })
        if (!res) throw new Error('Не найдено')

        const ownsAcct = res.place.businessAccount?.ownerUserId === session.userId
        let ownsBusiness = false
        if (res.place.businessId) {
          const b = await prisma.business.findFirst({
            where: { id: res.place.businessId, ownerId: session.userId },
          })
          ownsBusiness = !!b
        }
        if (!ownsAcct && !ownsBusiness) throw new Error('Нет доступа')

        reservation = await prisma.reservation.update({
          where: { id },
          data: { status: 'NO_SHOW' },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
