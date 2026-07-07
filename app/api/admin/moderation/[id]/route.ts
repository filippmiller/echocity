import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { approveOffer, rejectOffer, requestOfferChanges } from '@/modules/offers/service'
import { createAuditEntry } from '@/lib/audit'
import { logger } from '@/lib/logger'

const actionSchema = z.object({
  type: z.enum(['offer', 'business', 'complaint']),
  action: z.enum(['approve', 'reject', 'requestChanges', 'suspend', 'resolve']),
  reason: z.string().max(2000).optional(),
})

function audit(
  session: { userId: string; role: string },
  action: string,
  entityType: string,
  entityId: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null,
) {
  createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action,
    entityType,
    entityId,
    oldValue: oldValue ?? undefined,
    newValue: newValue ?? undefined,
    metadata: metadata ?? undefined,
  }).catch((e) => {
    logger.error('audit.moderation.failed', {
      entityType,
      entityId,
      action,
      error: e instanceof Error ? e.message : String(e),
    })
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof actionSchema>
  try {
    body = actionSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    if (body.type === 'offer') {
      return await handleOfferAction(id, body.action as 'approve' | 'reject' | 'requestChanges', session, body.reason)
    }

    if (body.type === 'business') {
      return await handleBusinessAction(id, body.action as 'approve' | 'reject' | 'suspend', session, body.reason)
    }

    if (body.type === 'complaint') {
      return await handleComplaintAction(id, body.action as 'resolve', session, body.reason)
    }

    return NextResponse.json({ error: 'Unknown item type' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

async function handleOfferAction(
  offerId: string,
  action: 'approve' | 'reject' | 'requestChanges',
  session: { userId: string; role: string },
  reason?: string,
) {
  const existing = await prisma.offer.findUnique({ where: { id: offerId }, select: { approvalStatus: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  if (action === 'approve') {
    const offer = await approveOffer(offerId)
    audit(session, 'APPROVE', 'OFFER', offerId, { approvalStatus: existing.approvalStatus }, { approvalStatus: offer.approvalStatus })
    return NextResponse.json({ success: true, offer })
  }

  if (action === 'reject') {
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 })
    }
    const offer = await rejectOffer(offerId, reason.trim())
    audit(session, 'REJECT', 'OFFER', offerId, { approvalStatus: existing.approvalStatus }, { approvalStatus: offer.approvalStatus, rejectionReason: reason.trim() }, { reason: reason.trim() })
    return NextResponse.json({ success: true, offer })
  }

  // requestChanges
  if (!reason || !reason.trim()) {
    return NextResponse.json({ error: 'Reason is required for changes request' }, { status: 400 })
  }
  const offer = await requestOfferChanges(offerId, { reason: reason.trim(), requestedById: session.userId })
  audit(session, 'REQUEST_CHANGES', 'OFFER', offerId, { approvalStatus: existing.approvalStatus }, { approvalStatus: offer.approvalStatus }, { reason: reason.trim() })
  return NextResponse.json({ success: true, offer })
}

async function handleBusinessAction(
  businessId: string,
  action: 'approve' | 'reject' | 'suspend',
  session: { userId: string; role: string },
  reason?: string,
) {
  const existing = await prisma.business.findUnique({ where: { id: businessId } })
  if (!existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  let newStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  if (action === 'approve') newStatus = 'APPROVED'
  else if (action === 'reject') newStatus = 'REJECTED'
  else newStatus = 'SUSPENDED'

  if (newStatus === 'REJECTED' && (!reason || !reason.trim())) {
    return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'REJECTED' && reason) {
    updateData.description = `[REJECTED] ${reason.trim()}\n\n${existing.description || ''}`
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data: updateData,
  })

  const auditAction = action === 'approve' ? 'APPROVE' : action === 'reject' ? 'REJECT' : 'SUSPEND'
  audit(
    session,
    auditAction,
    'BUSINESS',
    businessId,
    { status: existing.status },
    { status: business.status },
    reason ? { reason: reason.trim() } : undefined,
  )

  return NextResponse.json({ success: true, business })
}

async function handleComplaintAction(
  complaintId: string,
  _action: 'resolve',
  session: { userId: string; role: string },
  reason?: string,
) {
  const existing = await prisma.complaint.findUnique({ where: { id: complaintId } })
  if (!existing) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  const complaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedById: session.userId,
      ...(reason ? { adminNote: reason.trim() } : {}),
    },
  })

  audit(
    session,
    'RESOLVE',
    'COMPLAINT',
    complaintId,
    { status: existing.status },
    { status: complaint.status, resolvedAt: complaint.resolvedAt?.toISOString() },
    reason ? { reason: reason.trim() } : undefined,
  )

  return NextResponse.json({ success: true, complaint })
}
