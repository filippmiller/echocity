'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-client'
import { toast } from 'sonner'
import {
  ClipboardCheck,
  Loader2,
  ImageOff,
  Clock,
  Calculator,
  Store,
  MapPin,
  AlertCircle,
} from 'lucide-react'

interface QualitySection {
  count: number
  items: Array<{
    id: string
    title?: string
    name?: string
    city?: string
    benefitType?: string
    benefitValue?: number
    createdAt?: string
  }>
}

interface QualityReport {
  offersWithoutImages: QualitySection
  placesWithoutSchedule: QualitySection
  offersWithoutSavingsData: QualitySection
  pendingBusinesses: QualitySection
  emptyCityInventory: QualitySection
  checkedAt: string
}

const SECTIONS: Array<{
  key: keyof QualityReport
  title: string
  description: string
  icon: typeof ImageOff
  emptyText: string
}> = [
  {
    key: 'offersWithoutImages',
    title: 'Офферы без изображений',
    description: 'Активные предложения без фото',
    icon: ImageOff,
    emptyText: 'Все офферы имеют изображения',
  },
  {
    key: 'placesWithoutSchedule',
    title: 'Места без расписания',
    description: 'Активные места без часов работы',
    icon: Clock,
    emptyText: 'Все места имеют расписание',
  },
  {
    key: 'offersWithoutSavingsData',
    title: 'Офферы без данных о выгоде',
    description: 'Невозможно оценить экономию',
    icon: Calculator,
    emptyText: 'Все офферы имеют данные о выгоде',
  },
  {
    key: 'pendingBusinesses',
    title: 'Бизнесы на модерации',
    description: 'Ожидают подтверждения',
    icon: Store,
    emptyText: 'Нет бизнесов на модерации',
  },
  {
    key: 'emptyCityInventory',
    title: 'Города без заведений',
    description: 'Города без активных мест',
    icon: MapPin,
    emptyText: 'Все города имеют заведения',
  },
]

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '—'
  return String(value)
}

export default function AdminContentQualityPage() {
  const { user } = useAuth()
  const [report, setReport] = useState<QualityReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content-quality')
      if (!res.ok) throw new Error('Failed to load content quality report')
      const data = await res.json()
      setReport(data)
    } catch {
      toast.error('Не удалось загрузить отчёт о качестве контента')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') load()
  }, [user])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Качество контента</h1>
          <p className="text-sm text-gray-500">
            {loading
              ? '...'
              : report
              ? `Проверено ${new Date(report.checkedAt).toLocaleString('ru-RU')}`
              : 'Нет данных'}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {!loading && !report && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold">Не удалось загрузить отчёт</p>
        </div>
      )}

      {!loading && report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const data = report[section.key] as QualitySection
            const Icon = section.icon
            return (
              <div
                key={section.key}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-sm font-bold ${
                        data.count > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {data.count}
                    </span>
                  </div>
                </div>

                {data.count === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">{section.emptyText}</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {data.items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate">
                                {item.title || item.name || item.city || item.id}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.city && item.city !== item.title && item.city !== item.name
                                  ? `${item.city} · `
                                  : null}
                                {item.benefitType
                                  ? `${item.benefitType}: ${formatValue(item.benefitValue)}`
                                  : null}
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleDateString('ru-RU')
                                  : null}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
