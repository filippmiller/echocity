import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { activateBundle, pauseBundle } from '@/modules/bundles/service'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { action } = body as { action: string }

  try {
    let bundle
    switch (action) {
      case 'activate':
        bundle = await activateBundle(id)
        break
      case 'pause':
        bundle = await pauseBundle(id)
        break
      case 'expire':
        bundle = await prisma.bundle.update({
          where: { id },
          data: { status: 'EXPIRED' },
        })
        break
      default:
        return NextResponse.json({ error: 'Invalid action. Use: activate, pause, expire' }, { status: 400 })
    }
    return NextResponse.json({ bundle })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
