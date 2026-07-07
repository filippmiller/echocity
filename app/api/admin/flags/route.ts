import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'
import { createAuditEntry, AuditAction } from '@/lib/audit'
import { FEATURE_FLAGS, type FeatureFlagKey, getAllFeatureFlags } from '@/lib/feature-flags'

const flagKeySchema = z.enum(FEATURE_FLAGS as unknown as [FeatureFlagKey, ...FeatureFlagKey[]])

const createUpdateSchema = z.object({
  key: flagKeySchema,
  description: z.string().max(500).optional(),
  allowedRoles: z.array(z.string()).max(10).optional(),
})

const toggleSchema = z.object({
  key: flagKeySchema,
  enabled: z.boolean(),
})

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

async function requireAdmin(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return { session: null }
  }
  return { session }
}

export async function GET(request: NextRequest) {
  const { session } = await requireAdmin(request)
  if (!session) return unauthorized()

  const flags = await getAllFeatureFlags()
  return NextResponse.json({ flags })
}

export async function POST(request: NextRequest) {
  const { session } = await requireAdmin(request)
  if (!session) return unauthorized()

  try {
    const body = await request.json()
    const { key, description, allowedRoles } = createUpdateSchema.parse(body)

    const existing = await prisma.featureFlag.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json({ error: 'Flag already exists; use PATCH to toggle' }, { status: 409 })
    }

    const created = await prisma.featureFlag.create({
      data: {
        key,
        enabled: false,
        description,
        allowedRoles: allowedRoles ?? [],
      },
    })

    await createAuditEntry({
      actorId: session.userId,
      actorRole: session.role,
      action: AuditAction.CREATE,
      entityType: 'FeatureFlag',
      entityId: created.id,
      newValue: { key, enabled: created.enabled, description, allowedRoles: created.allowedRoles },
      req: request,
    })

    return NextResponse.json({ flag: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { session } = await requireAdmin(request)
  if (!session) return unauthorized()

  try {
    const body = await request.json()
    const { key, enabled } = toggleSchema.parse(body)

    const existing = await prisma.featureFlag.findUnique({ where: { key } })
    if (!existing) {
      // Allow toggling a flag that has not been persisted yet by creating it.
      const created = await prisma.featureFlag.create({
        data: { key, enabled, description: '', allowedRoles: [] },
      })

      await createAuditEntry({
        actorId: session.userId,
        actorRole: session.role,
        action: AuditAction.CREATE,
        entityType: 'FeatureFlag',
        entityId: created.id,
        newValue: { key, enabled: created.enabled, allowedRoles: [] },
        req: request,
      })

      return NextResponse.json({ flag: created })
    }

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: { enabled, updatedAt: new Date() },
    })

    await createAuditEntry({
      actorId: session.userId,
      actorRole: session.role,
      action: AuditAction.UPDATE,
      entityType: 'FeatureFlag',
      entityId: updated.id,
      oldValue: { key, enabled: existing.enabled },
      newValue: { key, enabled: updated.enabled },
      req: request,
    })

    return NextResponse.json({ flag: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { session } = await requireAdmin(request)
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key || !FEATURE_FLAGS.includes(key as FeatureFlagKey)) {
    return NextResponse.json({ error: 'Invalid or missing flag key' }, { status: 400 })
  }

  const existing = await prisma.featureFlag.findUnique({ where: { key } })
  if (!existing) {
    return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
  }

  // Soft-disable only: never delete a flag so audit history and DB values are preserved.
  const updated = await prisma.featureFlag.update({
    where: { key },
    data: { enabled: false, updatedAt: new Date() },
  })

  await createAuditEntry({
    actorId: session.userId,
    actorRole: session.role,
    action: AuditAction.DELETE,
    entityType: 'FeatureFlag',
    entityId: updated.id,
    oldValue: { key, enabled: existing.enabled },
    newValue: { key, enabled: false },
    metadata: { note: 'Soft-disabled via DELETE; row preserved for audit' },
    req: request,
  })

  return NextResponse.json({ flag: updated })
}
