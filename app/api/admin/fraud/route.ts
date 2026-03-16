import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') || 'OPEN'

  const flags = await prisma.fraudFlag.findMany({
    where: { status: status as any },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })

  return NextResponse.json({ flags })
}
