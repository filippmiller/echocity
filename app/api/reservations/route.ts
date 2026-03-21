import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { createReservation, getReservationsByUser } from '@/modules/reservations/service'

const reservationSchema = z.object({
  placeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'timeSlot must be HH:MM'),
  partySize: z.number().int().min(1).max(20),
  guestName: z.string().min(1).max(200),
  guestPhone: z.string().max(30).optional(),
  note: z.string().max(1000).optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reservations = await getReservationsByUser(session.userId)

  return NextResponse.json({
    reservations: reservations.map((r) => ({
      ...r,
      date: r.date.toISOString(),
      confirmedAt: r.confirmedAt?.toISOString() || null,
      canceledAt: r.canceledAt?.toISOString() || null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof reservationSchema>
  try {
    body = reservationSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const reservation = await createReservation(session.userId, {
      placeId: body.placeId,
      date: body.date,
      timeSlot: body.timeSlot,
      partySize: body.partySize,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      note: body.note,
    })

    return NextResponse.json({
      reservation: {
        ...reservation,
        date: reservation.date.toISOString(),
        confirmedAt: reservation.confirmedAt?.toISOString() || null,
        canceledAt: reservation.canceledAt?.toISOString() || null,
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка создания бронирования'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
