import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getBundlesByMerchant } from '@/modules/bundles/service'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bundles = await getBundlesByMerchant(session.userId)
    return NextResponse.json({ bundles })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
