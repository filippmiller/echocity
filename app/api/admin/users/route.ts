import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const VALID_ROLES = ['ADMIN', 'CITIZEN', 'BUSINESS_OWNER', 'MERCHANT_STAFF'] as const
const VALID_SORT = ['createdAt', 'email', 'role'] as const

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '20', 10), 1), 100)
  const offset = Math.max(parseInt(sp.get('offset') || '0', 10), 0)
  const search = sp.get('search')?.trim() || ''
  const roleFilter = sp.get('role') || ''
  const activeFilter = sp.get('isActive') // "true" | "false" | null (all)
  const sortBy = VALID_SORT.includes(sp.get('sortBy') as any) ? sp.get('sortBy')! : 'createdAt'
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc'

  // Build where clause
  const where: Prisma.UserWhereInput = {}

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (roleFilter && VALID_ROLES.includes(roleFilter as any)) {
    where.role = roleFilter as any
  }

  if (activeFilter === 'true') {
    where.isActive = true
  } else if (activeFilter === 'false') {
    where.isActive = false
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        city: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            redemptions: true,
            complaints: true,
            demandRequests: true,
          },
        },
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIALING'] },
          },
          select: {
            status: true,
            plan: { select: { name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortDir },
      skip: offset,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  // Flatten stats for the frontend
  const items = users.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    phone: u.phone,
    city: u.city,
    isActive: u.isActive,
    createdAt: u.createdAt,
    redemptionCount: u._count.redemptions,
    complaintsCount: u._count.complaints,
    demandCount: u._count.demandRequests,
    subscription: u.subscriptions[0]
      ? { status: u.subscriptions[0].status, planName: u.subscriptions[0].plan.name }
      : null,
  }))

  return NextResponse.json({ users: items, total, limit, offset })
}
