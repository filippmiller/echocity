import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { trackOfferView } from '@/modules/analytics/impressions'

const requestSchema = z.object({
  offerId: z.string().min(1),
  source: z.string().optional(),
})

/**
 * POST /api/analytics/offer-view
 * Fire-and-forget impression tracking for an offer.
 * The current user's session is read server-side so the client never
 * has to send a userId.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, source } = requestSchema.parse(body)

    const session = await getSession()
    await trackOfferView(offerId, {
      userId: session?.userId,
      source: source || 'list',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
