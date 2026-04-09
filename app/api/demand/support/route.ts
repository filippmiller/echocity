import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/modules/auth/session'
import { supportDemandRequest } from '@/modules/demand/service'

const supportSchema = z.object({
  demandRequestId: z.string().cuid('demandRequestId must be a valid CUID'),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof supportSchema>
  try {
    body = supportSchema.parse(await req.json())
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await supportDemandRequest(body.demandRequestId, session.userId)
  return NextResponse.json(result)
}
