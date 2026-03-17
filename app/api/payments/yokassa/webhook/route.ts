import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/modules/payments/yokassa'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const body = JSON.parse(rawBody)
    await handleWebhookEvent(body, rawBody)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('ЮKassa webhook processing error', { error: String(e) })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
