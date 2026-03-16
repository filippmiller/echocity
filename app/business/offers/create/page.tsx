'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { OfferWizard } from '@/components/OfferWizard'

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

  if (authLoading || loading) return <div className="max-w-lg mx-auto px-4 py-8 text-gray-500">Загрузка...</div>
  if (!user || user.role !== 'BUSINESS_OWNER') return <div className="max-w-lg mx-auto px-4 py-8 text-red-500">Доступ запрещён</div>

  if (!merchantData || merchantData.branches.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-gray-600">
        Сначала добавьте хотя бы одно заведение в разделе &quot;Мои заведения&quot;
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Новое предложение</h1>
      <OfferWizard merchantId={merchantData.merchantId} branches={merchantData.branches} />
    </div>
  )
}
