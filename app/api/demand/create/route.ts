import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { createDemandRequest } from '@/modules/demand/service'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Auto-resolve cityId from place if not provided
  let cityId = body.cityId
  if (!cityId && body.placeId) {
    const place = await prisma.place.findUnique({
      where: { id: body.placeId },
      select: { city: true },
    })
    if (place) {
      const city = await prisma.city.findFirst({
        where: { name: place.city },
        select: { id: true },
      })
      cityId = city?.id
    }
  }

  if (!cityId) {
    return NextResponse.json(
      { error: 'Could not resolve city. Please provide cityId or select a place with a known city.' },
      { status: 400 }
    )
  }

  const result = await createDemandRequest(session.userId, { ...body, cityId })
  return NextResponse.json({ result }, { status: 201 })
}
