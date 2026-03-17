import { NextRequest, NextResponse } from 'next/server'
import { getBundleDetail } from '@/modules/bundles/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const bundle = await getBundleDetail(id)
    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })
    }
    return NextResponse.json({ bundle })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
