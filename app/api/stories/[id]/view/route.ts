import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { recordView } from '@/modules/stories/service'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: storyId } = await params

  try {
    const view = await recordView(storyId, session.userId)
    return NextResponse.json({ view })
  } catch (error) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }
}
