import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
  }

  // Find family plan owned by this user
  const familyPlan = await prisma.familyPlan.findUnique({
    where: { ownerUserId: session.userId },
    include: { members: true },
  })

  if (!familyPlan) {
    return NextResponse.json({ error: 'Семейный план не найден. Сначала создайте его.' }, { status: 404 })
  }

  // Check member limit
  if (familyPlan.members.length >= familyPlan.maxMembers) {
    return NextResponse.json({ error: `Достигнут лимит участников (${familyPlan.maxMembers})` }, { status: 400 })
  }

  // Find user by email
  const invitedUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  if (!invitedUser) {
    return NextResponse.json({ error: 'Пользователь с таким email не найден' }, { status: 404 })
  }

  if (invitedUser.id === session.userId) {
    return NextResponse.json({ error: 'Нельзя добавить себя' }, { status: 400 })
  }

  // Check if already a member
  const existingMember = await prisma.familyMember.findUnique({
    where: { familyPlanId_userId: { familyPlanId: familyPlan.id, userId: invitedUser.id } },
  })

  if (existingMember) {
    return NextResponse.json({ error: 'Этот пользователь уже в семейном плане' }, { status: 409 })
  }

  // Check if user is already in another family plan
  const otherMembership = await prisma.familyMember.findFirst({
    where: { userId: invitedUser.id },
  })

  if (otherMembership) {
    return NextResponse.json({ error: 'Этот пользователь уже состоит в другом семейном плане' }, { status: 409 })
  }

  const member = await prisma.familyMember.create({
    data: {
      familyPlanId: familyPlan.id,
      userId: invitedUser.id,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  })

  return NextResponse.json({ member }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memberId } = await req.json()
  if (!memberId || typeof memberId !== 'string') {
    return NextResponse.json({ error: 'memberId обязателен' }, { status: 400 })
  }

  // Find family plan owned by this user
  const familyPlan = await prisma.familyPlan.findUnique({
    where: { ownerUserId: session.userId },
  })

  if (!familyPlan) {
    return NextResponse.json({ error: 'Семейный план не найден' }, { status: 404 })
  }

  // Find the member
  const member = await prisma.familyMember.findFirst({
    where: { id: memberId, familyPlanId: familyPlan.id },
  })

  if (!member) {
    return NextResponse.json({ error: 'Участник не найден' }, { status: 404 })
  }

  await prisma.familyMember.delete({ where: { id: memberId } })

  return NextResponse.json({ success: true })
}
