'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { OfferWizard } from '@/components/OfferWizard'
import Link from 'next/link'

export default function CreateOfferPage() {
  const { user, loading: authLoading } = useAuth()
  const [merchantData, setMerchantData] = useState<{ merchantId: string; branches: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'BUSINESS_OWNER') return

    fetch('/api/business/places')
      .then((r) => r.json())
      .then((data) => {
        if (data.businesses?.length > 0) {
          const biz = data.businesses[0]
          setMerchantData({
            merchantId: biz.id,
            branches: biz.places || [],
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'BUSINESS_OWNER') {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          Доступ запрещён
        </div>
      </div>
    )
  }

  if (!merchantData || merchantData.branches.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-600 mb-4">
            Сначала добавьте хотя бы одно заведение
          </p>
          <Link
            href="/business/places"
            className="inline-block bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Перейти к заведениям
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Новое предложение</h1>
      <OfferWizard merchantId={merchantData.merchantId} branches={merchantData.branches} />
    </div>
  )
}
