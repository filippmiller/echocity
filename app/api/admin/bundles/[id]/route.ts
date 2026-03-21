import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { activateBundle, pauseBundle } from '@/modules/bundles/service'
import { prisma } from '@/lib/prisma'

const bundleActionSchema = z.object({
  action: z.enum(['activate', 'pause', 'expire']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: z.infer<typeof bundleActionSchema>
  try {
    body = bundleActionSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid action. Use: activate, pause, expire' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    let bundle
    switch (body.action) {
      case 'activate':
        bundle = await activateBundle(id)
        break
      case 'pause':
        bundle = await pauseBundle(id)
        break
      case 'expire':
        bundle = await prisma.bundle.update({
          where: { id },
          data: { status: 'EXPIRED' },
        })
        break
    }
    return NextResponse.json({ bundle })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
