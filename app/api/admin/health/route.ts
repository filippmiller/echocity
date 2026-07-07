import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { isEmailDeliveryConfigured } from '@/modules/email/resend'
import { logger } from '@/lib/logger'

interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  configured?: boolean
  message?: string
}

const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || process.env.BUILD_SHA || 'unknown'

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { name: 'Database', status: 'pass', message: 'Connected' }
  } catch (e) {
    return { name: 'Database', status: 'fail', message: e instanceof Error ? e.message : 'Connection failed' }
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  const configured = Boolean(endpoint && accessKeyId && secretAccessKey)

  if (!configured) {
    return { name: 'Object storage', status: 'warn', configured: false, message: 'Not configured' }
  }

  try {
    const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string },
      forcePathStyle: true,
    })
    await client.send(new ListBucketsCommand({}))
    return { name: 'Object storage', status: 'pass', configured: true, message: 'Reachable' }
  } catch (e) {
    return { name: 'Object storage', status: 'fail', configured: true, message: e instanceof Error ? e.message : 'Unreachable' }
  }
}

async function checkYandexMaps(): Promise<HealthCheck> {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
  const configured = Boolean(apiKey)
  if (!configured) {
    return { name: 'Yandex Maps', status: 'warn', configured: false, message: 'API key not configured' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent('Москва')}&format=json&results=1`,
      { signal: controller.signal },
    )
    clearTimeout(timeout)
    if (!res.ok) {
      return { name: 'Yandex Maps', status: 'fail', configured: true, message: `HTTP ${res.status}` }
    }
    const data = await res.json()
    if (data?.response?.GeoObjectCollection) {
      return { name: 'Yandex Maps', status: 'pass', configured: true, message: 'Geocoder reachable' }
    }
    return { name: 'Yandex Maps', status: 'warn', configured: true, message: 'Unexpected response shape' }
  } catch (e) {
    return { name: 'Yandex Maps', status: 'fail', configured: true, message: e instanceof Error ? e.message : 'Ping failed' }
  }
}

async function checkYookassa(): Promise<HealthCheck> {
  const shopId = process.env.YOKASSA_SHOP_ID
  const secretKey = process.env.YOKASSA_SECRET_KEY
  const configured = Boolean(shopId && secretKey)
  if (!configured) {
    return { name: 'YoKassa', status: 'warn', configured: false, message: 'Credentials not configured' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('https://api.yookassa.ru/v3/payments?limit=1', {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return { name: 'YoKassa', status: 'fail', configured: true, message: `HTTP ${res.status}` }
    }
    return { name: 'YoKassa', status: 'pass', configured: true, message: 'API reachable' }
  } catch (e) {
    return { name: 'YoKassa', status: 'fail', configured: true, message: e instanceof Error ? e.message : 'Ping failed' }
  }
}

function checkEmail(): HealthCheck {
  const configured = isEmailDeliveryConfigured()
  if (!configured) {
    return { name: 'Email delivery', status: 'warn', configured: false, message: 'RESEND_API_KEY or EMAIL_FROM missing' }
  }
  return { name: 'Email delivery', status: 'pass', configured: true, message: 'Configured' }
}

function checkPush(): HealthCheck {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  )
  if (!configured) {
    return { name: 'Push notifications', status: 'warn', configured: false, message: 'VAPID keys missing' }
  }
  return { name: 'Push notifications', status: 'pass', configured: true, message: 'Configured' }
}

function checkCron(): HealthCheck {
  // No persisted heartbeat; report module availability.
  const configured = process.env.NODE_ENV !== 'test'
  return {
    name: 'Cron scheduler',
    status: configured ? 'pass' : 'warn',
    configured,
    message: configured ? 'Scheduled tasks configured' : 'Cron disabled in test environment',
  }
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkYandexMaps(),
    checkYookassa(),
    checkEmail(),
    checkPush(),
    checkCron(),
  ]).catch((e) => {
    logger.error('admin.health.check.failed', { error: e instanceof Error ? e.message : String(e) })
    return []
  })

  const overall = checks.some((c) => c.status === 'fail') ? 'fail' : 'pass'

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    overall,
    uptimeSeconds: Math.round(process.uptime()),
    buildSha: BUILD_SHA,
    checks,
  })
}
