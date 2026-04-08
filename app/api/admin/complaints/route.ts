import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

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

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (type) where.type = type

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
