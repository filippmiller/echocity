import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor') ?? undefined

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = transactions.length > PAGE_SIZE
  if (hasMore) transactions.pop()

  return NextResponse.json({
    transactions,
    nextCursor: hasMore ? transactions[transactions.length - 1]?.id : null,
  })
}
