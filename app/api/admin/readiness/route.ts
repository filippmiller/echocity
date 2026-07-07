import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { promises as fs } from 'fs'
import path from 'path'

const REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'YANDEX_MAPS_API_KEY',
  'YOKASSA_SHOP_ID',
  'YOKASSA_SECRET_KEY',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
]

const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.BUILD_SHA || 'unknown'
const DEPLOYED_AT = process.env.DEPLOYED_AT || process.env.NEXT_PUBLIC_BUILD_TIME || null

async function getMigrationStatus(): Promise<{ status: 'ok' | 'warning' | 'error'; message: string }> {
  try {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations')
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true })
    const sqlFiles = entries
      .filter((e) => e.isDirectory())
      .flatMap((dir) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return fs.readdir(path.join(migrationsDir, dir.name)).then((files) =>
          files.filter((f) => f.endsWith('.sql')),
        )
      })

    const sqlCounts = await Promise.all(sqlFiles)
    const total = sqlCounts.reduce((sum, list) => sum + list.length, 0)

    if (total > 0) {
      return { status: 'ok', message: `${total} migration file(s) present` }
    }
    return { status: 'warning', message: 'No migration SQL files found' }
  } catch (e) {
    return { status: 'error', message: e instanceof Error ? e.message : 'Unable to read migrations' }
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envChecklist = REQUIRED_ENV_KEYS.map((key) => ({
    key,
    present: Boolean(process.env[key]),
  }))

  const missing = envChecklist.filter((e) => !e.present).map((e) => e.key)
  const migrationStatus = await getMigrationStatus()

  const sentryConfigured = Boolean(
    process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  )

  return NextResponse.json({
    buildSha: BUILD_SHA,
    lastDeploy: DEPLOYED_AT || new Date().toISOString(),
    env: {
      checklist: envChecklist,
      complete: missing.length === 0,
      missing,
    },
    migrations: migrationStatus,
    observability: {
      sentryConfigured,
      healthEndpointConfigured: true,
    },
  })
}
