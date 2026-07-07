'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Plus, X, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface City {
  id: string
  name: string
  slug: string
  countryCode: string
  timezone: string
  defaultLanguage?: string
  franchise?: {
    id: string
    name: string
    code: string
  }
  _count: {
    places: number
  }
}

interface Franchise {
  id: string
  code: string
  name: string
  status: string
}

interface ConsistencyReport {
  citiesWithoutFranchise: Array<{ id: string; name: string; slug: string; franchiseId: string | null }>
  franchisesWithoutOwner: Array<{ id: string; code: string; name: string; ownerUserId: string }>
  placesWithInvalidCity: Array<{ id: string; cityId: string | null }>
  orphanedCities: Array<{ id: string; name: string; slug: string }>
  summary: {
    totalCities: number
    totalFranchises: number
    totalPlaces: number
    citiesWithoutFranchiseCount: number
    franchisesWithoutOwnerCount: number
    placesWithInvalidCityCount: number
    orphanedCitiesCount: number
  }
}

export default function AdminCitiesPage() {
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    countryCode: 'RU',
    timezone: 'Europe/Moscow',
    defaultLanguage: 'ru',
    franchiseId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState<ConsistencyReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    loadCities()
    loadFranchises()
    loadConsistency()
  }, [])

  const loadCities = async () => {
    try {
      const res = await fetch('/api/admin/cities')
      if (res.status === 403) {
        router.push('/admin')
        return
      }
      const data = await res.json()
      setCities(data.cities || [])
    } catch {
      toast.error('Ошибка при загрузке городов')
    } finally {
      setLoading(false)
    }
  }

  const loadFranchises = async () => {
    try {
      const res = await fetch('/api/admin/franchises/list')
      if (res.ok) {
        const data = await res.json()
        setFranchises(data.franchises || [])
      }
    } catch {
      // Ignore — franchise list is optional for form
    }
  }

  const loadConsistency = async () => {
    setReportLoading(true)
    try {
      const res = await fetch('/api/admin/consistency')
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch {
      // Ignore — consistency report is optional
    } finally {
      setReportLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        ...formData,
        franchiseId: formData.franchiseId || undefined,
      }

      const res = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Ошибка при создании города')
        return
      }

      toast.success(`Город "${formData.name}" создан`)
      setFormData({
        name: '',
        slug: '',
        countryCode: 'RU',
        timezone: 'Europe/Moscow',
        defaultLanguage: 'ru',
        franchiseId: '',
      })
      setShowForm(false)
      loadCities()
    } catch {
      toast.error('Ошибка при создании города')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Города</h1>
            <p className="text-sm text-gray-500">
              {loading ? '...' : `${cities.length} городов`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Отмена
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Добавить город
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новый город</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Москва"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="moscow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Код страны *
                </label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })
                  }
                  required
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Часовой пояс *
                </label>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Язык по умолчанию
                </label>
                <input
                  type="text"
                  value={formData.defaultLanguage}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultLanguage: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Франшиза
                </label>
                <select
                  value={formData.franchiseId}
                  onChange={(e) =>
                    setFormData({ ...formData, franchiseId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="">Без франшизы</option>
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Создание...' : 'Создать город'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-surface-tertiary">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Город
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Страна
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Часовой пояс
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Франшиза
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Мест
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {city.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                        {city.slug}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
                      {city.countryCode}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap hidden lg:table-cell">
                      {city.timezone}
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                      {city.franchise ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-deal-premium">
                          {city.franchise.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap text-right tabular-nums">
                      {city._count.places}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cities.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-medium">Города не найдены</p>
              <p className="text-sm mt-1">Добавьте первый город</p>
            </div>
          )}
        </div>
      )}

      {/* Consistency report */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              {report && report.summary.citiesWithoutFranchiseCount + report.summary.franchisesWithoutOwnerCount + report.summary.placesWithInvalidCityCount === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Проверка консистентности</h2>
              <p className="text-sm text-gray-500">
                {reportLoading
                  ? 'Загрузка...'
                  : report
                  ? `${report.summary.citiesWithoutFranchiseCount + report.summary.franchisesWithoutOwnerCount + report.summary.placesWithInvalidCityCount} проблем`
                  : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={loadConsistency}
            disabled={reportLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${reportLoading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Городов без франшизы</p>
                <p className="font-semibold text-gray-900">{report.summary.citiesWithoutFranchiseCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Франшиз без владельца</p>
                <p className="font-semibold text-gray-900">{report.summary.franchisesWithoutOwnerCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Мест с невалидным городом</p>
                <p className="font-semibold text-gray-900">{report.summary.placesWithInvalidCityCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Городов без мест</p>
                <p className="font-semibold text-gray-900">{report.summary.orphanedCitiesCount}</p>
              </div>
            </div>

            {report.citiesWithoutFranchise.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Города с отсутствующей франшизой</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {report.citiesWithoutFranchise.map((city) => (
                    <li key={city.id}>
                      {city.name} <code className="text-xs bg-gray-100 rounded px-1">{city.slug}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.franchisesWithoutOwner.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Франшизы без владельца</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {report.franchisesWithoutOwner.map((franchise) => (
                    <li key={franchise.id}>
                      {franchise.name} <code className="text-xs bg-gray-100 rounded px-1">{franchise.code}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.placesWithInvalidCity.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Места с невалидным cityId</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {report.placesWithInvalidCity.map((place) => (
                    <li key={place.id}>
                      Place {place.id} <code className="text-xs bg-gray-100 rounded px-1">cityId={place.cityId}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
