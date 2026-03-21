import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { BusinessStatus } from '@prisma/client'

const updateBusinessSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING']),
  reason: z.string().min(1).max(2000).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof updateBusinessSchema>
  try {
    body = updateBusinessSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const existing = await prisma.business.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // For rejection, require a reason
  if (body.status === 'REJECTED' && (!body.reason || !body.reason.trim())) {
    return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 })
  }

  const business = await prisma.business.update({
    where: { id },
    data: {
      status: body.status as BusinessStatus,
      ...(body.status === 'REJECTED' && body.reason
        ? { description: `[REJECTED] ${body.reason}\n\n${existing.description || ''}` }
        : {}),
    },
  })

  return NextResponse.json({ business })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
      places: { select: { id: true, title: true, address: true, city: true, isActive: true } },
      offers: {
        select: {
          id: true,
          title: true,
          offerType: true,
          approvalStatus: true,
          lifecycleStatus: true,
        },
        take: 20,
      },
      _count: { select: { places: true, offers: true, staff: true, redemptions: true } },
    },
  })

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  return NextResponse.json({ business })
}
