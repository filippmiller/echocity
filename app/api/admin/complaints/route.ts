import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const VALID_TYPES = ['OFFER_NOT_HONORED', 'RUDE_STAFF', 'FALSE_ADVERTISING', 'WRONG_DISCOUNT', 'FRAUD', 'CONTENT_ISSUE', 'OTHER'] as const

/**
 * GET /api/admin/complaints
 * List all complaints with optional filters.
 * Query params: status, priority, type, sort, limit, offset
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const type = searchParams.get('type')
  const sort = searchParams.get('sort') || 'newest'
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

  // Validate enum params to prevent Prisma runtime errors on invalid values
  const where: Record<string, unknown> = {}
  if (status && (VALID_STATUSES as readonly string[]).includes(status)) where.status = status
  if (priority && (VALID_PRIORITIES as readonly string[]).includes(priority)) where.priority = priority
  if (type && (VALID_TYPES as readonly string[]).includes(type)) where.type = type

  const orderBy = sort === 'oldest'
    ? { createdAt: 'asc' as const }
    : sort === 'priority'
      ? { priority: 'desc' as const }
      : { createdAt: 'desc' as const }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.complaint.count({ where }),
  ])

  return NextResponse.json({ complaints, total })
}
