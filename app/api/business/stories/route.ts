import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createStory, getStoriesByMerchant } from '@/modules/stories/service'

const createStorySchema = z.object({
  branchId: z.string().cuid(),
  mediaUrl: z.string().url().max(2000),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  caption: z.string().max(500).optional(),
  linkOfferId: z.string().cuid().optional(),
})

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
    take: 100,
  })

  return NextResponse.json({ stories })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof createStorySchema>
  try {
    body = createStorySchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify the branch belongs to a business owned by this user
  const branch = await prisma.place.findFirst({
    where: {
      id: body.branchId,
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
  if (body.linkOfferId) {
    const offer = await prisma.offer.findFirst({
      where: { id: body.linkOfferId, merchantId: branch.business.id },
    })
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found or does not belong to your business' },
        { status: 403 }
      )
    }
  }

  const story = await createStory(branch.business.id, body.branchId, {
    mediaUrl: body.mediaUrl,
    mediaType: body.mediaType,
    caption: body.caption,
    linkOfferId: body.linkOfferId,
  })

  return NextResponse.json({ story }, { status: 201 })
}
