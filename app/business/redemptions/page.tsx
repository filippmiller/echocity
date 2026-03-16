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
    // Fetch merchant's redemptions via a dedicated endpoint
    fetch('/api/business/redemptions')
      .then((r) => r.json())
      .then((data) => { setRedemptions(data.redemptions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-500">Загрузка...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">История использований</h1>

      {redemptions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Нет использований</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Дата</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Предложение</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Точка</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.redeemedAt).toLocaleString('ru')}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.offer.title}</td>
                  <td className="px-4 py-3 text-gray-600">{r.branch?.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
