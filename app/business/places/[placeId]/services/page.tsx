'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface PlaceService {
  id: string
  name?: string
  description?: string
  price?: string
  priceUnit: string
  durationMinutes?: number
  isActive: boolean
  serviceType: {
    id: string
    name: string
    slug: string
    category: {
      id: string
      name: string
      slug: string
    }
  }
}

interface ServiceType {
  id: string
  name: string
  slug: string
  category: {
    id: string
    name: string
  }
}

export default function PlaceServicesPage() {
  const params = useParams()
  const router = useRouter()
  const placeId = params.placeId as string

  const [services, setServices] = useState<PlaceService[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    serviceTypeId: '',
    name: '',
    description: '',
    price: '',
    priceUnit: 'FIXED' as const,
    durationMinutes: '',
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadServices()
    loadServiceTypes()
  }, [placeId])

  const loadServices = async () => {
    try {
      const res = await fetch(`/api/business/places/${placeId}/services`)
      if (res.ok) {
        const data = await res.json()
        setServices(data.services || [])
      }
    } catch (err) {
      setError('Ошибка при загрузке услуг')
    } finally {
      setLoading(false)
    }
  }

  const loadServiceTypes = async () => {
    try {
      const res = await fetch('/api/services/types')
      if (res.ok) {
        const data = await res.json()
        setServiceTypes(data.types || [])
      }
    } catch (err) {
      // Ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const payload: any = {
        serviceTypeId: formData.serviceTypeId,
        priceUnit: formData.priceUnit,
        isActive: formData.isActive,
      }

      if (formData.name) payload.name = formData.name
      if (formData.description) payload.description = formData.description
      if (formData.price) payload.price = parseFloat(formData.price)
      if (formData.durationMinutes)
        payload.durationMinutes = parseInt(formData.durationMinutes)

      const res = await fetch(`/api/business/places/${placeId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка при добавлении услуги')
        return
      }

      // Reset form and reload
      setFormData({
        serviceTypeId: '',
        name: '',
        description: '',
        price: '',
        priceUnit: 'FIXED',
        durationMinutes: '',
        isActive: true,
      })
      setShowAddForm(false)
      loadServices()
    } catch (err) {
      setError('Ошибка при добавлении услуги')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Удалить эту услугу?')) return

    try {
      const res = await fetch(
        `/api/business/places/${placeId}/services/${serviceId}`,
        {
          method: 'DELETE',
        }
      )

      if (res.ok) {
        loadServices()
      }
    } catch (err) {
      setError('Ошибка при удалении услуги')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href="/business/places"
              className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
            >
              ← Назад к заведениям
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Управление услугами</h1>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showAddForm ? 'Отмена' : 'Добавить услугу'}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Новая услуга</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Тип услуги *
                </label>
                <select
                  value={formData.serviceTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceTypeId: e.target.value })
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Выберите тип услуги</option>
                  {serviceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.category.name} - {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название (если отличается)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Цена
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Единица измерения
                  </label>
                  <select
                    value={formData.priceUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceUnit: e.target.value as any,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="FIXED">Фиксированная</option>
                    <option value="PER_HOUR">За час</option>
                    <option value="PER_ITEM">За штуку</option>
                    <option value="PER_KG">За кг</option>
                    <option value="PER_SQ_M">За м²</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Длительность (минуты)
                  </label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: e.target.value,
                      })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Добавление...' : 'Добавить'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Услуга
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Длительность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.serviceType.category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {service.name || service.serviceType.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.price
                      ? `${service.price} ₽ ${
                          service.priceUnit === 'FIXED'
                            ? ''
                            : service.priceUnit === 'PER_HOUR'
                            ? '/час'
                            : service.priceUnit === 'PER_ITEM'
                            ? '/шт'
                            : service.priceUnit === 'PER_KG'
                            ? '/кг'
                            : '/м²'
                        }`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.durationMinutes
                      ? `${service.durationMinutes} мин`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        service.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {service.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500">
              Услуги не добавлены
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


