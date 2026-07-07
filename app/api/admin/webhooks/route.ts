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
  const take = Math.min(
    Math.max(parseInt(searchParams.get('take') || `${DEFAULT_TAKE}`) || DEFAULT_TAKE, 1),
    MAX_TAKE,
  )
  const provider = searchParams.get('provider') || undefined
  const status = searchParams.get('status') || undefined
  const eventType = searchParams.get('eventType') || undefined

  const where = {
    ...(provider ? { provider } : {}),
    ...(status ? { status } : {}),
    ...(eventType ? { eventType } : {}),
  }

  const logs = await prisma.webhookLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      provider: true,
      eventType: true,
      externalId: true,
      status: true,
      error: true,
      signatureValid: true,
      processedAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ logs })
}
