import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.userId },
    select: { id: true },
  })
  const merchantIds = businesses.map((b) => b.id)

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
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, merchantId, branchId, staffRole: rawStaffRole } = await req.json()
  if (!email || !merchantId) {
    return NextResponse.json({ error: 'email and merchantId required' }, { status: 400 })
  }

  // Validate staffRole enum — default to CASHIER if invalid
  const validStaffRoles = ['CASHIER', 'MANAGER'] as const
  const staffRole = validStaffRoles.includes(rawStaffRole) ? rawStaffRole : 'CASHIER'

  // Verify merchant ownership
  const business = await prisma.business.findFirst({
    where: { id: merchantId, ownerId: session.userId },
  })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 403 })

  if (branchId) {
    const branch = await prisma.place.findFirst({
      where: { id: branchId, businessId: merchantId, isActive: true },
      select: { id: true },
    })
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found or does not belong to this business' }, { status: 403 })
    }
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'User not found with this email' }, { status: 404 })

  // Create staff record
  const staffMember = await prisma.merchantStaff.upsert({
    where: { merchantId_userId: { merchantId, userId: user.id } },
    update: { isActive: true, staffRole: staffRole || 'CASHIER', branchId },
    create: {
      merchantId,
      userId: user.id,
      branchId: branchId || null,
      staffRole: staffRole || 'CASHIER',
    },
  })

  // Update user role if not already MERCHANT_STAFF or BUSINESS_OWNER
  if (user.role === 'CITIZEN') {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'MERCHANT_STAFF' } })
  }

  return NextResponse.json({ staff: staffMember }, { status: 201 })
}
