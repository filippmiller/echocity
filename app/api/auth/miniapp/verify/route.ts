import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyVKLaunchParams, verifyMaxLaunchParams } from '@/modules/miniapp/auth'
import { createSession } from '@/modules/auth/session'

const verifySchema = z.object({
  platform: z.enum(['vk', 'max']),
  launchParams: z.string().optional(),
  token: z.string().optional(),
})

export async function POST(request: NextRequest) {
  let body: z.infer<typeof verifySchema>
  try {
    body = verifySchema.parse(await request.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ошибка валидации', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  let result

  if (body.platform === 'vk') {
    const appSecret = process.env.VK_CLIENT_SECRET
    if (!appSecret || !body.launchParams) {
      return NextResponse.json({ error: 'VK not configured' }, { status: 500 })
    }
    result = await verifyVKLaunchParams(body.launchParams, appSecret)
  } else {
    const maxSecret = process.env.MAX_CLIENT_SECRET
    if (!maxSecret || !body.token) {
      return NextResponse.json({ error: 'Max not configured' }, { status: 500 })
    }
    result = await verifyMaxLaunchParams(body.token, maxSecret)
  }

  if (!result.success || !result.userId) {
    return NextResponse.json({ error: result.error || 'AUTH_FAILED' }, { status: 401 })
  }

  // Look up user to get email and role for session
  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { email: true, role: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 401 })
  }

  // Create session
  await createSession({ userId: result.userId, email: user.email, role: user.role })
  return NextResponse.json({ success: true })
}
