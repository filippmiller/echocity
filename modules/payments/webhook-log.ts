import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type WebhookLogStatus = 'received' | 'processed' | 'failed' | 'duplicate' | 'invalid_signature'

export interface LogWebhookInput {
  provider: string
  eventType: string
  externalId?: string | null
  payload: Record<string, unknown>
  status: WebhookLogStatus | string
  error?: string | null
  signatureValid?: boolean | null
  processedAt?: Date | null
}

export async function logWebhook(input: LogWebhookInput) {
  return prisma.webhookLog.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      externalId: input.externalId ?? null,
      payload: input.payload as Prisma.JsonObject,
      status: input.status,
      error: input.error ?? null,
      signatureValid: input.signatureValid ?? null,
      processedAt: input.processedAt ?? null,
    },
  })
}
