'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'

interface RedemptionRow {
  id: string
  status: string
  redeemedAt: string
  offer: { title: string; benefitType: string; benefitValue: number }
  user: { firstName: string }
  branch: { title: string }
}

export default function BusinessRedemptionsPage() {
  const { user } = useAuth()
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'BUSINESS_OWNER') return
    fetch('/api/business/redemptions')
      .then((r) => r.json())
      .then((data) => { setRedemptions(data.redemptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded-xl" />
          <div className="h-24 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">История использований</h1>

      {redemptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Нет использований</p>
          <p className="text-sm text-gray-400 mt-1">Здесь появятся использования после первых сканирований</p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {redemptions.map((r) => (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{r.offer.title}</p>
                  <span
                    className={`shrink-0 ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {r.status === 'SUCCESS' ? 'Успешно' : 'Ошибка'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{r.branch?.title}</span>
                  <span>{new Date(r.redeemedAt).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Предложение</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Точка</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600">{new Date(r.redeemedAt).toLocaleString('ru')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.offer.title}</td>
                    <td className="px-4 py-3 text-gray-600">{r.branch?.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {r.status === 'SUCCESS' ? 'Успешно' : 'Ошибка'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
