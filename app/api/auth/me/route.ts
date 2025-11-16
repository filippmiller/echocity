import { NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Always get fresh data from database to reflect role changes
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  // Get avatar URL from profile
  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { avatarUrl: true },
  })

  return NextResponse.json({
    user: {
      userId: user.id,
      email: user.email,
      role: user.role,
      avatarUrl: profile?.avatarUrl || null,
    },
  })
}

