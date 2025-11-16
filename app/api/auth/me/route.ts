import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Get avatar URL from profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.userId },
    select: { avatarUrl: true },
  })

  return NextResponse.json({
    user: {
      ...session,
      avatarUrl: profile?.avatarUrl || null,
    },
  })
}

