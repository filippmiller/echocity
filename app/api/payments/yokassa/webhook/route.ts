import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent } from '@/modules/payments/yokassa'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await handleWebhookEvent(body)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error('ЮKassa webhook processing error', { error: String(e) })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
