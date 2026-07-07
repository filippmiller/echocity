import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { getBusinessAccess } from '@/lib/business-access'
import { canManageStaff } from '@/lib/permissions'
import { createAuditEntry, AuditAction } from '@/lib/audit'

const addStaffSchema = z.object({
  email: z.string().email().max(255),
  merchantId: z.string().cuid(),
  branchId: z.string().cuid().optional(),
  staffRole: z.enum(['CASHIER', 'MANAGER']).default('CASHIER'),
})

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessible = await prisma.business.findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { staff: { some: { userId: session.userId, isActive: true, staffRole: 'MANAGER' } } },
      ],
    },
    select: { id: true },
  })
  const merchantIds = accessible.map((b) => b.id)

  const staff = await prisma.merchantStaff.findMany({
    where: { merchantId: { in: merchantIds }, isActive: true },
    include: {
      user: { select: { id: true, firstName: true, email: true } },
      branch: { select: { id: true, title: true } },
    },
  })

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof addStaffSchema>
  try {
    body = addStaffSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify access
  const { access } = await getBusinessAccess(session, body.merchantId, body.branchId)
  if (!canManageStaff(access)) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 403 })
  }

  // Managers can only invite cashiers
  if (access === 'manager' && body.staffRole === 'MANAGER') {
    return NextResponse.json({ error: 'Only the owner can invite managers' }, { status: 403 })
  }

  if (body.branchId) {
    const branch = await prisma.place.findFirst({
      where: { id: body.branchId, businessId: body.merchantId, isActive: true },
      select: { id: true },
    })
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found or does not belong to this business' }, { status: 403 })
    }
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email: body.email } })
  if (!user) return NextResponse.json({ error: 'User not found with this email' }, { status: 404 })

  const existing = await prisma.merchantStaff.findUnique({
    where: { merchantId_userId: { merchantId: body.merchantId, userId: user.id } },
  })

  // Create or reactivate staff record
  const staffMember = await prisma.merchantStaff.upsert({
    where: { merchantId_userId: { merchantId: body.merchantId, userId: user.id } },
    update: { isActive: true, staffRole: body.staffRole, branchId: body.branchId },
    create: {
      merchantId: body.merchantId,
      userId: user.id,
      branchId: body.branchId || null,
      staffRole: body.staffRole,
    },
  })

  // Update user role if not already MERCHANT_STAFF or BUSINESS_OWNER
  if (user.role === 'CITIZEN') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'MERCHANT_STAFF' } })
  }

  // Audit log
  await createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
    entityType: 'MerchantStaff',
    entityId: staffMember.id,
    oldValue: existing
      ? {
          staffRole: existing.staffRole,
          branchId: existing.branchId,
          isActive: existing.isActive,
        }
      : null,
    newValue: {
      staffRole: staffMember.staffRole,
      branchId: staffMember.branchId,
      isActive: staffMember.isActive,
      merchantId: staffMember.merchantId,
      userId: staffMember.userId,
    },
    req,
  })

  return NextResponse.json({ staff: staffMember }, { status: 201 })
}
