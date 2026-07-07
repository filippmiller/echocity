import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    newBusinesses24h,
    newBusinesses7d,
    pendingOffers,
    pendingBusinesses,
    openComplaints,
    failedPayments24h,
    webhookFailures24h,
  ] = await Promise.all([
    prisma.business.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.offer.count({ where: { approvalStatus: 'PENDING' } }),
    prisma.business.count({ where: { status: 'PENDING' } }),
    prisma.complaint.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    prisma.payment.count({ where: { status: 'FAILED', createdAt: { gte: dayAgo } } }),
    prisma.webhookLog.count({ where: { status: 'failed', createdAt: { gte: dayAgo } } }),
  ])

  // No persisted health check model; this is a synthetic operational risk indicator.
  const lowHealthChecks = 0

  return NextResponse.json({
    counts: {
      newBusinesses24h,
      newBusinesses7d,
      pendingOffers,
      pendingBusinesses,
      openComplaints,
      failedPayments24h,
      webhookFailures24h,
      lowHealthChecks,
    },
  })
}
