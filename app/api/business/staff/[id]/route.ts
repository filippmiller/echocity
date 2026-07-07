import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getBusinessAccess } from '@/lib/business-access'
import { canManageStaff } from '@/lib/permissions'
import { createAuditEntry, AuditAction } from '@/lib/audit'

const updateStaffSchema = z.object({
  staffRole: z.enum(['CASHIER', 'MANAGER']),
  branchId: z.string().cuid().optional().nullable(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.merchantStaff.findUnique({
    where: { id },
    include: { merchant: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { access } = await getBusinessAccess(session, existing.merchantId, existing.branchId)
  if (!canManageStaff(access)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: z.infer<typeof updateStaffSchema>
  try {
    body = updateStaffSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Managers cannot promote to manager or modify other managers
  if (access === 'manager') {
    if (body.staffRole === 'MANAGER' || existing.staffRole === 'MANAGER') {
      return NextResponse.json({ error: 'Only the owner can manage managers' }, { status: 403 })
    }
  }

  if (body.branchId) {
    const branch = await prisma.place.findFirst({
      where: { id: body.branchId, businessId: existing.merchantId, isActive: true },
      select: { id: true },
    })
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found or does not belong to this business' }, { status: 403 })
    }
  }

  const updated = await prisma.merchantStaff.update({
    where: { id },
    data: {
      staffRole: body.staffRole,
      branchId: body.branchId === undefined ? existing.branchId : body.branchId,
    },
  })

  await createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action: AuditAction.UPDATE,
    entityType: 'MerchantStaff',
    entityId: id,
    oldValue: {
      staffRole: existing.staffRole,
      branchId: existing.branchId,
      isActive: existing.isActive,
    },
    newValue: {
      staffRole: updated.staffRole,
      branchId: updated.branchId,
      isActive: updated.isActive,
    },
    req,
  })

  return NextResponse.json({ staff: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.merchantStaff.findUnique({
    where: { id },
    include: { merchant: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { access } = await getBusinessAccess(session, existing.merchantId, existing.branchId)
  if (!canManageStaff(access)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Managers cannot remove other managers
  if (access === 'manager' && existing.staffRole === 'MANAGER') {
    return NextResponse.json({ error: 'Only the owner can remove managers' }, { status: 403 })
  }

  const updated = await prisma.merchantStaff.update({
    where: { id },
    data: { isActive: false },
  })

  await createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action: AuditAction.UPDATE,
    entityType: 'MerchantStaff',
    entityId: id,
    oldValue: {
      staffRole: existing.staffRole,
      branchId: existing.branchId,
      isActive: existing.isActive,
    },
    newValue: {
      staffRole: updated.staffRole,
      branchId: updated.branchId,
      isActive: updated.isActive,
    },
    req: _req,
  })

  return NextResponse.json({ success: true })
}
