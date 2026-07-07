import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { approveOffer } from '@/modules/offers/service'
import { createAuditEntry, AuditAction } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  try {
    const offer = await approveOffer(id)

    await createAuditEntry({
      actorId: session.userId,
      actorRole: session.role,
      action: AuditAction.APPROVE,
      entityType: 'Offer',
      entityId: id,
      oldValue: {
        approvalStatus: existing.approvalStatus,
        lifecycleStatus: existing.lifecycleStatus,
      },
      newValue: {
        approvalStatus: offer.approvalStatus,
        lifecycleStatus: offer.lifecycleStatus,
      },
      req,
    })

    return NextResponse.json({ offer })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
