import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getReminderOpsStatus } from '@/modules/notifications/expiring-offer-reminders'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = await getReminderOpsStatus()

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ...status,
  })
}
