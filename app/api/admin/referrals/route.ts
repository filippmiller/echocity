import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { listReferralsForAdmin } from '@/modules/referrals/service'

const VALID_STATUSES = ['PENDING', 'COMPLETED', 'EXPIRED', 'REWARDED'] as const

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const statusParam = sp.get('status') ?? 'PENDING'
  const status = VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
    ? (statusParam as (typeof VALID_STATUSES)[number])
    : 'PENDING'

  const limit = Math.min(Math.max(parseInt(sp.get('limit') ?? '50', 10), 1), 100)
  const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10), 0)

  const { items, total } = await listReferralsForAdmin({ status, limit, offset })

  return NextResponse.json({
    referrals: items.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
    total,
    limit,
    offset,
    status,
  })
}
