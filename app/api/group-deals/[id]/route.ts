import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/group-deals/[id]
 * Group deal details with members
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const groupDeal = await prisma.groupDeal.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      offer: {
        select: {
          id: true,
          title: true,
          benefitType: true,
          benefitValue: true,
          branch: { select: { id: true, title: true, address: true } },
        },
      },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  })

  if (!groupDeal) {
    return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
  }

  return NextResponse.json({ groupDeal })
}

/**
 * DELETE /api/group-deals/[id]
 * Cancel group deal (creator only)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 })
  }

  const { id } = await params

  const groupDeal = await prisma.groupDeal.findUnique({
    where: { id },
    select: { id: true, creatorId: true, status: true },
  })

  if (!groupDeal) {
    return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
  }

  if (groupDeal.creatorId !== session.userId) {
    return NextResponse.json({ error: 'Только создатель может отменить группу' }, { status: 403 })
  }

  if (groupDeal.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Завершённую группу нельзя отменить' }, { status: 400 })
  }

  const updated = await prisma.groupDeal.update({
    where: { id },
    data: { status: 'EXPIRED' },
  })

  return NextResponse.json({ groupDeal: updated })
}
