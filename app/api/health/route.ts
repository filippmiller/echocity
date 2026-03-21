import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/modules/auth/session'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    // DB down
  }

  // Skip admin check if no cookie header present (load balancer probes)
  const cookieHeader = request.headers.get('cookie')
  let isAdmin = false
  if (cookieHeader?.includes('cityecho_session')) {
    const session = await getSession()
    isAdmin = session?.role === 'ADMIN'
  }

  // Public response: minimal
  if (!isAdmin) {
    return NextResponse.json(
      { ok: dbOk, durationMs: Date.now() - startedAt },
      { status: dbOk ? 200 : 503 }
    )
  }

  // Admin response: detailed diagnostics
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
    { status: healthy ? 200 : 503 }
  )
}
