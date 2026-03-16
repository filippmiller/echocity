'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'

export function SubscriptionBadge() {
  const { user } = useAuth()
  const [planCode, setPlanCode] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/subscriptions/status')
      .then((r) => r.json())
      .then((data) => setPlanCode(data.planCode || 'free'))
      .catch(() => {})
  }, [user])

  if (!user || !planCode || planCode === 'free') return null

  const colors = planCode === 'premium'
    ? 'bg-amber-500 text-white'
    : 'bg-purple-600 text-white'

  return (
    <Link href="/subscription" className={`${colors} px-2 py-0.5 rounded text-xs font-medium`}>
      {planCode === 'premium' ? 'Premium' : 'Plus'}
    </Link>
  )
}
