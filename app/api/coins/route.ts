import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getBalance, getHistory } from '@/modules/cashback/service'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [balance, transactions] = await Promise.all([
    getBalance(session.userId),
    getHistory(session.userId, 5),
  ])

  return NextResponse.json({ balance, transactions })
}
