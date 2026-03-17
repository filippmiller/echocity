import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { acceptBundleItem } from '@/modules/bundles/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bundleItemId } = await params

  try {
    const item = await acceptBundleItem(bundleItemId, session.userId)
    return NextResponse.json({ item })
  } catch (err: any) {
    const message = err.message || 'Server error'
    const status = message.includes('not found') ? 404
      : message.includes('Not your') ? 403
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
