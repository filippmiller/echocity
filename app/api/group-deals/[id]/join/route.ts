import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/group-deals/[id]/join
 * Join an existing group deal (auth required)
 */
export async function POST(
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
    include: {
      members: { select: { userId: true } },
    },
  })

  if (!groupDeal) {
    return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 })
  }

  if (groupDeal.status === 'EXPIRED' || groupDeal.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Группа уже закрыта' }, { status: 400 })
  }

  if (groupDeal.expiresAt < new Date()) {
    await prisma.groupDeal.update({ where: { id }, data: { status: 'EXPIRED' } })
    return NextResponse.json({ error: 'Время группы истекло' }, { status: 400 })
  }

  // Check if already a member
  const alreadyMember = groupDeal.members.some(m => m.userId === session.userId)
  if (alreadyMember) {
    // Return the current group state without error
    const full = await prisma.groupDeal.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
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
    return NextResponse.json({ groupDeal: full, alreadyMember: true })
  }

  // Add the member and possibly update status to READY
  const newMemberCount = groupDeal.members.length + 1
  const newStatus = newMemberCount >= groupDeal.minMembers ? 'READY' : groupDeal.status

  const [, updatedGroupDeal] = await prisma.$transaction([
    prisma.groupDealMember.create({
      data: { groupDealId: id, userId: session.userId },
    }),
    prisma.groupDeal.update({
      where: { id },
      data: { status: newStatus },
      include: {
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
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
    }),
  ])

  return NextResponse.json({ groupDeal: updatedGroupDeal }, { status: 201 })
}
