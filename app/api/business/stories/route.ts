import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createStory, getStoriesByMerchant } from '@/modules/stories/service'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

  const stories = await prisma.story.findMany({
    where: { merchantId: { in: merchantIds } },
    include: {
      branch: { select: { id: true, title: true, address: true } },
      offer: { select: { id: true, title: true } },
      _count: { select: { views: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ stories })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { branchId, mediaUrl, mediaType, caption, linkOfferId } = body

  if (!branchId || !mediaUrl) {
    return NextResponse.json(
      { error: 'branchId and mediaUrl are required' },
      { status: 400 }
    )
  }

  // Verify the branch belongs to a business owned by this user
  const branch = await prisma.place.findFirst({
    where: {
      id: branchId,
      business: { ownerId: session.userId },
    },
    include: { business: { select: { id: true } } },
  })

  if (!branch || !branch.business) {
    return NextResponse.json(
      { error: 'Branch not found or not owned by you' },
      { status: 403 }
    )
  }

  // If linkOfferId provided, verify it belongs to the same merchant
  if (linkOfferId) {
    const offer = await prisma.offer.findFirst({
      where: { id: linkOfferId, merchantId: branch.business.id },
    })
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found or does not belong to your business' },
        { status: 403 }
      )
    }
  }

  const story = await createStory(branch.business.id, branchId, {
    mediaUrl,
    mediaType: mediaType || 'IMAGE',
    caption,
    linkOfferId,
  })

  return NextResponse.json({ story }, { status: 201 })
}
