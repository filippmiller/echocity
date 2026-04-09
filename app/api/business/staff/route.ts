import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const addStaffSchema = z.object({
  email: z.string().email().max(255),
  merchantId: z.string().cuid(),
  branchId: z.string().cuid().optional(),
  staffRole: z.enum(['CASHIER', 'MANAGER']).default('CASHIER'),
})

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

  let body: z.infer<typeof addStaffSchema>
  try {
    body = addStaffSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify merchant ownership
  const business = await prisma.business.findFirst({
    where: { id: body.merchantId, ownerId: session.userId },
  })
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 403 })

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

  // Create staff record
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

  return NextResponse.json({ staff: staffMember }, { status: 201 })
}
