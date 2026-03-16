'use client'

import { useAuth } from '@/lib/auth-client'
import { QRScanner } from '@/components/QRScanner'

export default function ScannerPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6 flex justify-center">
        <div className="animate-pulse w-full max-w-sm space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-72 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user || (user.role !== 'BUSINESS_OWNER' && user.role !== 'MERCHANT_STAFF')) {
    return (
      <div className="px-4 py-8 sm:px-6 max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm text-center">
          Доступ запрещён
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Сканер</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Сканируйте QR-код клиента или введите код вручную
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <QRScanner />
        </div>
      </div>
    </div>
  )
}
