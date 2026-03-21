import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getAllBundles, createBundle } from '@/modules/bundles/service'
import type { BundleStatus } from '@prisma/client'

const VALID_STATUSES: BundleStatus[] = ['DRAFT', 'PENDING_PARTNERS', 'ACTIVE', 'PAUSED', 'EXPIRED']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawStatus = req.nextUrl.searchParams.get('status') || ''
  const statusFilter = VALID_STATUSES.includes(rawStatus as BundleStatus)
    ? (rawStatus as BundleStatus)
    : undefined

  try {
    const bundles = await getAllBundles(statusFilter)
    return NextResponse.json({ bundles })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (!body.title || !body.validFrom || !body.items?.length) {
      return NextResponse.json(
        { error: 'title, validFrom, and at least one item are required' },
        { status: 400 }
      )
    }

    const bundle = await createBundle(session.userId, body)
    return NextResponse.json({ bundle }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
