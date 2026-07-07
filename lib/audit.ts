import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { NextRequest } from 'next/server'
import type { IncomingMessage } from 'http'

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  SUBMIT_FOR_MODERATION: 'SUBMIT_FOR_MODERATION',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  DUPLICATE: 'DUPLICATE',
  REDEEM: 'REDEEM',
  FLAG_FRAUD: 'FLAG_FRAUD',
  DISMISS_FRAUD: 'DISMISS_FRAUD',
  EXPORT: 'EXPORT',
} as const

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]

export interface CreateAuditEntryInput {
  actorId: string
  actorRole: string
  action: AuditAction | string
  entityType: string
  entityId: string
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  req?: NextRequest | IncomingMessage
}

function extractRequestMeta(req?: NextRequest | IncomingMessage) {
  if (!req) return {}

  if (req instanceof Request || 'headers' in req) {
    const headers = (req as NextRequest).headers
    return {
      ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    }
  }

  const headers = (req as IncomingMessage).headers
  return {
    ipAddress:
      (Array.isArray(headers['x-forwarded-for']) ? headers['x-forwarded-for'][0] : headers['x-forwarded-for'])?.split(',')[0]?.trim() ??
      headers['x-real-ip']?.toString() ??
      undefined,
    userAgent: headers['user-agent']?.toString() ?? undefined,
  }
}

export async function createAuditEntry(input: CreateAuditEntryInput) {
  const { actorId, actorRole, action, entityType, entityId, oldValue, newValue, metadata, req } = input
  const { ipAddress, userAgent } = extractRequestMeta(req)

  return prisma.auditLog.create({
    data: {
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      ...(oldValue ? { oldValue: oldValue as Prisma.JsonObject } : {}),
      ...(newValue ? { newValue: newValue as Prisma.JsonObject } : {}),
      ...(metadata ? { metadata: metadata as Prisma.JsonObject } : {}),
      ipAddress,
      userAgent,
    },
  })
}

export interface ListAuditEntriesInput {
  skip?: number
  take?: number
  actorId?: string
  entityType?: string
  entityId?: string
  action?: string
}

export async function listAuditEntries(input: ListAuditEntriesInput = {}) {
  const { skip = 0, take = 50, actorId, entityType, entityId, action } = input

  return prisma.auditLog.findMany({
    where: {
      ...(actorId ? { actorId } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(action ? { action } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  })
}
