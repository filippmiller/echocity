import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { createDemandRequest } from '@/modules/demand/service'
import { prisma } from '@/lib/prisma'

const createDemandSchema = z.object({
  placeId: z.string().cuid().optional(),
  placeName: z.string().min(1).max(200).optional(),
  categoryId: z.string().cuid().optional(),
  cityId: z.string().cuid().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof createDemandSchema>
  try {
    body = createDemandSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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
