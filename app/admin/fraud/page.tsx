'use client'

import { ShieldAlert } from 'lucide-react'

export default function AdminFraudPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-deal-flash" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Фрод-мониторинг</h1>
          <p className="text-sm text-gray-500">Контроль подозрительной активности</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
        <ShieldAlert className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-900 font-semibold">Раздел в разработке</p>
        <p className="text-sm text-gray-500 mt-1">Фрод-мониторинг будет доступен в ближайшем обновлении</p>
      </div>
    </div>
  )
}
