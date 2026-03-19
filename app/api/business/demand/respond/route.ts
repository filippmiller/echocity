import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const respondSchema = z.object({
  demandRequestId: z.string().min(1),
  message: z.string().optional(),
  offerId: z.string().optional(),
  merchantId: z.string().optional(),
}).refine(
  (data) => data.message || data.offerId,
  { message: 'Either message or offerId must be provided' }
)

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = respondSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 }
    )
  }

  const { demandRequestId, message, offerId } = parsed.data

  // Verify the demand request exists and is active
  const demandRequest = await prisma.demandRequest.findUnique({
    where: { id: demandRequestId },
    select: { id: true, placeId: true, status: true },
  })

  if (!demandRequest) {
    return NextResponse.json(
      { error: 'Demand request not found' },
      { status: 404 }
    )
  }

  if (!['OPEN', 'COLLECTING'].includes(demandRequest.status)) {
    return NextResponse.json(
      { error: 'Demand request is no longer active' },
      { status: 400 }
    )
  }

  // Get merchant's businesses
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  if (merchantIds.length === 0) {
    return NextResponse.json(
      { error: 'No business found' },
      { status: 403 }
    )
  }

  // Determine which merchant should respond
  let merchantId: string = merchantIds[0]

  if (demandRequest.placeId) {
    // Place-level demand: verify the place belongs to this merchant
    const place = await prisma.place.findFirst({
      where: {
        id: demandRequest.placeId,
        businessId: { in: merchantIds },
      },
      select: { businessId: true },
    })

    if (!place || !place.businessId) {
      return NextResponse.json(
        { error: 'This demand is not for your place' },
        { status: 403 }
      )
    }
    merchantId = place.businessId
  } else {
    // City/category-level demand — require explicit merchantId in body or use first business
    if (parsed.data.merchantId && merchantIds.includes(parsed.data.merchantId)) {
      merchantId = parsed.data.merchantId
    } else {
      merchantId = merchantIds[0]
    }
  }

  // If offerId provided, verify it belongs to this specific merchant
  if (offerId) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, merchantId },
    })
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found or not owned by you' },
        { status: 403 }
      )
    }
  }

  // Check for existing response from this merchant
  const existingResponse = await prisma.demandResponse.findUnique({
    where: {
      demandRequestId_merchantId: {
        demandRequestId,
        merchantId,
      },
    },
  })

  if (existingResponse) {
    return NextResponse.json(
      { error: 'You have already responded to this demand' },
      { status: 409 }
    )
  }

  // OPEN and COLLECTING are both valid active states. If the request is already
  // COLLECTING, we should still accept new merchant responses without raising a
  // false 500 from a conditional update.
  const response = await prisma.$transaction(async (tx) => {
    const created = await tx.demandResponse.create({
      data: {
        demandRequestId,
        merchantId,
        message: message ?? null,
        offerId: offerId ?? null,
        status: 'PENDING',
      },
    })

    await tx.demandRequest.updateMany({
      where: {
        id: demandRequestId,
        status: 'OPEN',
      },
      data: {
        status: 'COLLECTING',
      },
    })

    return created
  })

  return NextResponse.json({ response }, { status: 201 })
}
