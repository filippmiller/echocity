/**
 * YooKassa webhook endpoint (Sprint B.2 + B.3 hardening).
 *
 * Guards applied in order:
 *   1. IP allowlist — reject non-YooKassa remote IPs immediately with 403.
 *   2. Optional HTTP Basic — if YOKASSA_WEBHOOK_BASIC is set (user:password),
 *      require matching Authorization header. Also returns 401 on mismatch.
 *   3. JSON parse — 400 on malformed body.
 *   4. Signature + atomic upsert live in `handleWebhookEvent`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent, YookassaWebhookError } from '@/modules/payments/yokassa'
import { clientIpFromHeaders, ipInAllowlist } from '@/lib/ipAllowlist'
import { logger } from '@/lib/logger'

function checkBasicAuth(headers: Headers): { ok: boolean; reason?: string } {
  const configured = process.env.YOKASSA_WEBHOOK_BASIC
  if (!configured) return { ok: true } // basic auth disabled
  const header = headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) {
    return { ok: false, reason: 'missing-basic-auth' }
  }
  const provided = header.slice('Basic '.length).trim()
  const expected = Buffer.from(configured, 'utf8').toString('base64')
  // Constant-time compare to avoid leaking credential length.
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return { ok: false, reason: 'basic-auth-mismatch' }
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0 ? { ok: true } : { ok: false, reason: 'basic-auth-mismatch' }
}

export async function POST(req: NextRequest) {
  // 1. IP allowlist.
  const ip = clientIpFromHeaders(req.headers)
  if (!ipInAllowlist(ip)) {
    logger.warn('ЮKassa webhook: rejected non-allowlisted IP', { ip })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Optional Basic auth.
  const basic = checkBasicAuth(req.headers)
  if (!basic.ok) {
    logger.warn('ЮKassa webhook: basic-auth failed', { reason: basic.reason })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Body parse + dispatch.
  let rawBody = ''
  try {
    rawBody = await req.text()
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    await handleWebhookEvent(body as Record<string, unknown>, rawBody)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('ЮKassa webhook processing error', { error: String(e) })
    if (e instanceof YookassaWebhookError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
