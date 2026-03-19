import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startedAt = Date.now()

  const checks = {
    database: false,
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    redemptionSecret: Boolean(process.env.NEXTAUTH_SECRET),
    pushConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
    ),
  }

  let databaseError: string | null = null

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    databaseError = error instanceof Error ? error.message : String(error)
  }

  const healthy = checks.database && checks.sessionSecret && checks.redemptionSecret
  const status = healthy ? 200 : 503

  return NextResponse.json(
    {
      ok: healthy,
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.round(process.uptime()),
      durationMs: Date.now() - startedAt,
      checks,
      databaseError,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}
