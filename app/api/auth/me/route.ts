import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import type { StaffRole } from '@prisma/client'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Always get fresh data from database to reflect role changes
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Get avatar URL from profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { avatarUrl: true },
  })

  let staffRole: StaffRole | null = null
  let merchantIds: string[] = []
  if (user.role === 'MERCHANT_STAFF') {
    const staff = await prisma.merchantStaff.findMany({
      where: { userId: user.id, isActive: true },
      select: { merchantId: true, staffRole: true },
    })
    merchantIds = staff.map((s) => s.merchantId)
    staffRole = staff.some((s) => s.staffRole === 'MANAGER')
      ? 'MANAGER'
      : staff[0]?.staffRole ?? null
  }

  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
      avatarUrl: profile?.avatarUrl || null,
      staffRole,
      merchantIds,
    },
  })
}

