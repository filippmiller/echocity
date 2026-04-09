import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    // DB down
  }

  // Admin detail: only if ?detail=1 query param (no DB session lookup)
  const wantDetail = request.nextUrl.searchParams.get('detail') === '1'

  if (!wantDetail) {
    return NextResponse.json(
      { ok: dbOk, durationMs: Date.now() - startedAt },
      { status: dbOk ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const checks = {
    database: dbOk,
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    redemptionSecret: Boolean(process.env.NEXTAUTH_SECRET),
    pushConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
    ),
  }

  const healthy = checks.database && checks.sessionSecret && checks.redemptionSecret

  return NextResponse.json(
    {
      ok: healthy,
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.round(process.uptime()),
      durationMs: Date.now() - startedAt,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
