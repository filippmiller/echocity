import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent, YookassaWebhookError } from '@/modules/payments/yokassa'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  let rawBody = ''

  try {
    rawBody = await req.text()
    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    await handleWebhookEvent(body, rawBody)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('ЮKassa webhook processing error', { error: String(e) })
    if (e instanceof YookassaWebhookError) {
      logger.error('payment.critical_failure', {
        reason: 'webhook_processing_error',
        provider: 'YOKASSA',
        status: e.status,
        message: e.message,
      })
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
