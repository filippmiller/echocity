import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { requestOfferChanges } from '@/modules/offers/service'
import { createAuditEntry, AuditAction } from '@/lib/audit'

const requestChangesSchema = z.object({
  reason: z.string().min(1, 'reason required').max(2000),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof requestChangesSchema>
  try {
    body = requestChangesSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const existing = await prisma.offer.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  try {
    const offer = await requestOfferChanges(id, { reason: body.reason, requestedById: session.userId })

    await createAuditEntry({
      actorId: session.userId,
      actorRole: session.role,
      action: AuditAction.REQUEST_CHANGES,
      entityType: 'Offer',
      entityId: id,
      oldValue: {
        approvalStatus: existing.approvalStatus,
      },
      newValue: {
        approvalStatus: offer.approvalStatus,
        reason: body.reason,
      },
      req,
    })

    return NextResponse.json({ offer })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
