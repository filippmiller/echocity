import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { ComplaintType, ComplaintPriority } from '@prisma/client'

const PRIORITY_MAP: Record<string, ComplaintPriority> = {
  FRAUD: 'URGENT',
  OFFER_NOT_HONORED: 'HIGH',
  FALSE_ADVERTISING: 'HIGH',
  WRONG_DISCOUNT: 'MEDIUM',
  RUDE_STAFF: 'MEDIUM',
  CONTENT_ISSUE: 'LOW',
  OTHER: 'LOW',
}

const VALID_TYPES = [
  'OFFER_NOT_HONORED',
  'RUDE_STAFF',
  'FALSE_ADVERTISING',
  'WRONG_DISCOUNT',
  'FRAUD',
  'CONTENT_ISSUE',
  'OTHER',
] as const

const complaintSchema = z.object({
  placeId: z.string().uuid().optional(),
  offerId: z.string().uuid().optional(),
  type: z.enum(VALID_TYPES),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof complaintSchema>
  try {
    body = complaintSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Rate limit: max 5 complaints per day per user
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

  const todayCount = await prisma.complaint.count({
    where: {
      userId: session.userId,
      createdAt: { gte: dayStart },
    },
  })

  if (todayCount >= 5) {
    return NextResponse.json(
      { error: 'Daily complaint limit reached (5). Try again tomorrow.' },
      { status: 429 },
    )
  }

  const priority = PRIORITY_MAP[body.type] || 'MEDIUM'

  const complaint = await prisma.complaint.create({
    data: {
      userId: session.userId,
      placeId: body.placeId || null,
      offerId: body.offerId || null,
      type: body.type as ComplaintType,
      description: body.description.trim(),
      priority,
    },
  })

  return NextResponse.json({ complaint }, { status: 201 })
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin sees all complaints, regular users see only their own
  const isAdmin = session.role === 'ADMIN'

  const complaints = await prisma.complaint.findMany({
    where: isAdmin ? {} : { userId: session.userId },
    include: {
      user: { select: { id: true, email: true, firstName: true } },
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return NextResponse.json({ complaints })
}
