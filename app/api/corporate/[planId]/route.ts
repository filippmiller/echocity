import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getCorporateDashboard } from '@/modules/corporate/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходимо войти в аккаунт' }, { status: 401 })
  }

  const { planId } = await params
  const dashboard = await getCorporateDashboard(planId)

  if (!dashboard) {
    return NextResponse.json({ error: 'План не найден' }, { status: 404 })
  }

  return NextResponse.json(dashboard)
}
