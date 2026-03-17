import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0/I/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get or create referral code
  let referralCode = await prisma.referralCode.findUnique({
    where: { userId: session.userId },
  })

  if (!referralCode) {
    // Generate unique code with retry
    let code = generateReferralCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.referralCode.findUnique({ where: { code } })
      if (!existing) break
      code = generateReferralCode()
      attempts++
    }

    referralCode = await prisma.referralCode.create({
      data: {
        userId: session.userId,
        code,
      },
    })
  }

  // Get referral stats
  const referrals = await prisma.referral.findMany({
    where: { referralCodeId: referralCode.id },
    select: { status: true, rewardGranted: true },
  })

  const totalInvited = referrals.length
  const completed = referrals.filter((r) => r.status === 'COMPLETED' || r.status === 'REWARDED').length
  const rewarded = referrals.filter((r) => r.rewardGranted).length

  return NextResponse.json({
    code: referralCode.code,
    stats: {
      totalInvited,
      completed,
      rewarded,
      target: 3, // friends needed for reward
    },
  })
}
