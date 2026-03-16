'use client'

import { useAuth } from '@/lib/auth-client'
import { QRScanner } from '@/components/QRScanner'

export default function ScannerPage() {
  const { user, loading } = useAuth()

  if (loading) return <div className="max-w-md mx-auto px-4 py-8 text-gray-500 text-center">Загрузка...</div>

  if (!user || (user.role !== 'BUSINESS_OWNER' && user.role !== 'MERCHANT_STAFF')) {
    return <div className="max-w-md mx-auto px-4 py-8 text-red-500 text-center">Доступ запрещён</div>
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4 text-center">Сканер предложений</h1>
      <QRScanner />
    </div>
  )
}
