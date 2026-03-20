'use client'

import { useParams, useRouter } from 'next/navigation'
import { QRRedeemScreen } from '@/components/QRRedeemScreen'
import { useAuth } from '@/lib/auth-client'
import { useEffect } from 'react'

export default function RedeemPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/offers/${id}/redeem`)}`)
    }
  }, [loading, user, id, router])

  if (loading || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center text-gray-500">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-center text-gray-900 mb-4">Активация предложения</h1>
      <QRRedeemScreen offerId={id} />
      <p className="text-center text-xs text-gray-400 mt-6">
        QR-код обновляется автоматически каждые 30 секунд
      </p>
    </div>
  )
}
