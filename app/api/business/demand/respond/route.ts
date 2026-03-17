import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { demandRequestId, message, offerId } = body as {
    demandRequestId?: string
    message?: string
    offerId?: string
  }

  if (!demandRequestId) {
    return NextResponse.json(
      { error: 'demandRequestId is required' },
      { status: 400 }
    )
  }

  if (!message && !offerId) {
    return NextResponse.json(
      { error: 'Either message or offerId must be provided' },
      { status: 400 }
    )
  }

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

  // Verify the demand's place belongs to this merchant
  if (demandRequest.placeId) {
    const place = await prisma.place.findFirst({
      where: {
        id: demandRequest.placeId,
        businessId: { in: merchantIds },
      },
    })

    if (!place) {
      return NextResponse.json(
        { error: 'This demand is not for your place' },
        { status: 403 }
      )
    }
  }

  // If offerId provided, verify it belongs to this merchant
  if (offerId) {
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, merchantId: { in: merchantIds } },
    })
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found or not owned by you' },
        { status: 403 }
      )
    }
  }

  // Use the first matching merchant ID (the one that owns the place)
  const merchantId = merchantIds[0]

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

  // Create response and update demand status in a transaction
  const [response] = await prisma.$transaction([
    prisma.demandResponse.create({
      data: {
        demandRequestId,
        merchantId,
        message: message ?? null,
        offerId: offerId ?? null,
        status: 'PENDING',
      },
    }),
    // Move to COLLECTING status on first response
    prisma.demandRequest.update({
      where: { id: demandRequestId, status: 'OPEN' },
      data: { status: 'COLLECTING' },
    }),
  ])

  return NextResponse.json({ response }, { status: 201 })
}
