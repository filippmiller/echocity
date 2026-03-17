import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''

  if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return NextResponse.json({ error: 'Неверный формат кода' }, { status: 400 })
  }

  // Find the referral code
  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
    select: { id: true, userId: true },
  })

  if (!referralCode) {
    return NextResponse.json({ error: 'Код не найден' }, { status: 404 })
  }

  // Prevent self-referral
  if (referralCode.userId === session.userId) {
    return NextResponse.json({ error: 'Нельзя использовать свой собственный код' }, { status: 400 })
  }

  // Check if user was already referred
  const existing = await prisma.referral.findUnique({
    where: { invitedUserId: session.userId },
  })

  if (existing) {
    return NextResponse.json({ error: 'Вы уже использовали реферальный код' }, { status: 409 })
  }

  // Create referral with PENDING status
  const referral = await prisma.referral.create({
    data: {
      referralCodeId: referralCode.id,
      invitedUserId: session.userId,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ success: true, referralId: referral.id })
}
