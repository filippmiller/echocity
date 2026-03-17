import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params
  const body = await req.json()

  // Find table and verify ownership
  const table = await prisma.tableConfig.findUnique({
    where: { id },
    include: {
      place: {
        select: {
          businessId: true,
          businessAccount: { select: { ownerUserId: true } },
        },
      },
    },
  })

  if (!table) {
    return NextResponse.json({ error: 'Стол не найден' }, { status: 404 })
  }

  const ownsViaAccount = table.place.businessAccount?.ownerUserId === session.userId
  let ownsViaBusiness = false
  if (table.place.businessId) {
    const biz = await prisma.business.findFirst({
      where: { id: table.place.businessId, ownerId: session.userId },
    })
    ownsViaBusiness = !!biz
  }

  if (!ownsViaAccount && !ownsViaBusiness) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  const data: Record<string, unknown> = {}
  if (body.tableNumber !== undefined) data.tableNumber = String(body.tableNumber)
  if (body.seats !== undefined) data.seats = Number(body.seats)
  if (body.zone !== undefined) data.zone = body.zone || null
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)

  const updated = await prisma.tableConfig.update({
    where: { id },
    data,
  })

  return NextResponse.json({ table: updated })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'BUSINESS_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await ctx.params

  // Find table and verify ownership
  const table = await prisma.tableConfig.findUnique({
    where: { id },
    include: {
      place: {
        select: {
          businessId: true,
          businessAccount: { select: { ownerUserId: true } },
        },
      },
    },
  })

  if (!table) {
    return NextResponse.json({ error: 'Стол не найден' }, { status: 404 })
  }

  const ownsViaAccount = table.place.businessAccount?.ownerUserId === session.userId
  let ownsViaBusiness = false
  if (table.place.businessId) {
    const biz = await prisma.business.findFirst({
      where: { id: table.place.businessId, ownerId: session.userId },
    })
    ownsViaBusiness = !!biz
  }

  if (!ownsViaAccount && !ownsViaBusiness) {
    return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
  }

  // Soft-delete: deactivate instead of deleting
  await prisma.tableConfig.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ success: true })
}
