import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const staff = await prisma.merchantStaff.findUnique({
    where: { id },
    include: { merchant: true },
  })
  if (!staff || staff.merchant.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.merchantStaff.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
