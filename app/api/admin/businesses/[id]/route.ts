import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { BusinessStatus } from '@prisma/client'

const VALID_ACTIONS = ['APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, reason } = body

  if (!status || !VALID_ACTIONS.includes(status as BusinessStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await prisma.business.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // For rejection, require a reason
  if (status === 'REJECTED' && (!reason || !reason.trim())) {
    return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 })
  }

  const business = await prisma.business.update({
    where: { id },
    data: {
      status: status as BusinessStatus,
      // Store rejection reason in description if the business is being rejected
      ...(status === 'REJECTED' && reason
        ? { description: `[REJECTED] ${reason}\n\n${existing.description || ''}` }
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
