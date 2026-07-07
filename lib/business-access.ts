import { prisma } from '@/lib/prisma'
import type { SessionData } from '@/modules/auth/session'
import type { Prisma } from '@prisma/client'

export type BusinessAccessLevel = 'owner' | 'manager' | 'cashier' | 'none'

export interface BusinessAccessResult {
  access: BusinessAccessLevel
  staffRecord?: { id: string; staffRole: 'CASHIER' | 'MANAGER'; branchId: string | null; merchantId: string; userId: string }
}

export interface BusinessAccessSummary {
  merchantIds: string[]
  access: BusinessAccessLevel
}

export async function getBusinessAccess(
  session: SessionData | null,
  merchantId: string,
  branchId?: string | null,
): Promise<BusinessAccessResult> {
  if (!session) return { access: 'none' }

  const business = await prisma.business.findUnique({
    where: { id: merchantId },
    select: { id: true, ownerId: true },
  })
  if (!business) return { access: 'none' }

  if (business.ownerId === session.userId) {
    return { access: 'owner' }
  }

  const where: Prisma.MerchantStaffWhereInput = {
    merchantId,
    userId: session.userId,
    isActive: true,
  }
  if (branchId) {
    where.OR = [{ branchId: null }, { branchId }]
  }

  const staffRecord = await prisma.merchantStaff.findFirst({
    where,
    select: { id: true, staffRole: true, branchId: true, merchantId: true, userId: true },
  })
  if (!staffRecord) return { access: 'none' }

  return {
    access: staffRecord.staffRole === 'MANAGER' ? 'manager' : 'cashier',
    staffRecord,
  }
}

export async function getBusinessAccessSummary(session: SessionData | null): Promise<BusinessAccessSummary> {
  if (!session) return { merchantIds: [], access: 'none' }

  const [owned, staff] = await Promise.all([
    prisma.business.findMany({ where: { ownerId: session.userId }, select: { id: true } }),
    prisma.merchantStaff.findMany({
      where: { userId: session.userId, isActive: true },
      select: { merchantId: true, staffRole: true },
    }),
  ])

  const ownedIds = owned.map((b) => b.id)
  const staffIds = staff.map((s) => s.merchantId)
  const merchantIds = Array.from(new Set([...ownedIds, ...staffIds]))

  let access: BusinessAccessLevel = 'none'
  if (owned.length > 0) {
    access = 'owner'
  } else if (staff.some((s) => s.staffRole === 'MANAGER')) {
    access = 'manager'
  } else if (staff.length > 0) {
    access = 'cashier'
  }

  return { merchantIds, access }
}
