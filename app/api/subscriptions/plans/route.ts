import { NextResponse } from 'next/server'
import { getPlans } from '@/modules/subscriptions/service'
import { cached } from '@/lib/cache'

const TEN_MINUTES = 10 * 60 * 1000

export async function GET() {
  const plans = await cached('subscription:plans', TEN_MINUTES, getPlans)
  return NextResponse.json({ plans }, {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
  })
}
