'use client'

import { useParams } from 'next/navigation'
import { QRRedeemScreen } from '@/components/QRRedeemScreen'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'

export default function RedeemPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()

  if (loading) return <div className="max-w-md mx-auto px-4 py-8 text-center text-gray-500">Загрузка...</div>

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-gray-700 mb-4">Войдите, чтобы активировать предложение</p>
        <Link href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Войти
        </Link>
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
