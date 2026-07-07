import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const MAX_TAKE = 200
const DEFAULT_TAKE = 50

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const skip = Math.max(parseInt(searchParams.get('skip') || '0') || 0, 0)
  const take = Math.min(
    Math.max(parseInt(searchParams.get('take') || `${DEFAULT_TAKE}`) || DEFAULT_TAKE, 1),
    MAX_TAKE,
  )
  const actorId = searchParams.get('actorId') || undefined
  const entityType = searchParams.get('entityType') || undefined
  const entityId = searchParams.get('entityId') || undefined
  const action = searchParams.get('action') || undefined

  const where = {
    ...(actorId ? { actorId } : {}),
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(action ? { action } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        actorId: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, skip, take })
}
