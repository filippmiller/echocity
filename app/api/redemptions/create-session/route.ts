import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { createRedemptionSession } from '@/modules/redemptions/service'

const createSessionSchema = z.object({
  offerId: z.string().uuid(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof createSessionSchema>
  try {
    body = createSessionSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await createRedemptionSession(session.userId, body.offerId, body.lat, body.lng)

  if (!result.success) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: 400 })
  }

  return NextResponse.json(result, { status: 201 })
}
