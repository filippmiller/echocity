import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/modules/auth/session'
import { getActiveStories } from '@/modules/stories/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city = searchParams.get('city') || undefined
  const branchId = searchParams.get('branchId') || undefined
  const session = await getSession()

  const stories = await getActiveStories({
    city,
    branchId,
    userId: session?.userId,
  })

  // Group stories by merchant
  const merchantMap = new Map<string, {
    merchantId: string
    merchantName: string
    branchId: string
    branchTitle: string
    stories: any[]
  }>()

  for (const story of stories) {
    const key = story.merchantId
    if (!merchantMap.has(key)) {
      merchantMap.set(key, {
        merchantId: story.merchantId,
        merchantName: story.merchant.name,
        branchId: story.branchId,
        branchTitle: story.branch.title,
        stories: [],
      })
    }

    merchantMap.get(key)!.stories.push({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption,
      linkOfferId: story.linkOfferId,
      offerTitle: story.offer?.title || null,
      viewCount: story.viewCount,
      viewed: story.viewed,
      expiresAt: story.expiresAt.toISOString(),
      createdAt: story.createdAt.toISOString(),
    })
  }

  const grouped = Array.from(merchantMap.values())

  // Sort: merchants with unseen stories first
  grouped.sort((a, b) => {
    const aHasUnseen = a.stories.some((s: any) => !s.viewed)
    const bHasUnseen = b.stories.some((s: any) => !s.viewed)
    if (aHasUnseen && !bHasUnseen) return -1
    if (!aHasUnseen && bHasUnseen) return 1
    return 0
  })

  return NextResponse.json({ groups: grouped })
}
