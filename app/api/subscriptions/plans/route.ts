import { NextResponse } from 'next/server'
import { getPlans } from '@/modules/subscriptions/service'

export async function GET() {
  const plans = await getPlans()
  return NextResponse.json({ plans })
}
