'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'

interface PlaceOption {
  id: string
  title: string
}

interface TableItem {
  id: string
  placeId: string
  placeName: string
  tableNumber: string
  seats: number
  zone: string | null
  isActive: boolean
  todayReservations: number
}

const ZONE_LABELS: Record<string, string> = {
  main: 'Основной зал',
  terrace: 'Терраса',
  vip: 'VIP',
  bar: 'Бар',
}

export default function TablesPage() {
  const [tables, setTables] = useState<TableItem[]>([])
  const [places, setPlaces] = useState<PlaceOption[]>([])
  const [selectedPlace, setSelectedPlace] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [formPlaceId, setFormPlaceId] = useState('')
  const [formNumber, setFormNumber] = useState('')
  const [formSeats, setFormSeats] = useState(4)
  const [formZone, setFormZone] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchTables = (pid?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (pid) params.set('placeId', pid)

    fetch(`/api/business/tables?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTables(data.tables || [])
        if (data.places) {
          setPlaces(data.places)
          if (!formPlaceId && data.places.length > 0) {
            setFormPlaceId(data.places[0].id)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchTables(selectedPlace || undefined)
  }, [selectedPlace]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!formPlaceId || !formNumber.trim() || formSeats < 1) {
      toast.error('Заполните номер стола и количество мест')
      return
    }

    setFormSubmitting(true)
    try {
      const res = await fetch('/api/business/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: formPlaceId,
          tableNumber: formNumber.trim(),
          seats: formSeats,
          zone: formZone || undefined,
        }),
      })

      if (res.ok) {
        toast.success('Стол добавлен')
        setFormNumber('')
        setFormSeats(4)
        setFormZone('')
        setShowForm(false)
        fetchTables(selectedPlace || undefined)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggle = async (tableId: string, currentActive: boolean) => {
    setActionLoading(tableId)
    try {
      const res = await fetch(`/api/business/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      })

      if (res.ok) {
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, isActive: !currentActive } : t)),
        )
        toast.success(currentActive ? 'Стол деактивирован' : 'Стол активирован')
      } else {
        toast.error('Ошибка обновления')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (tableId: string) => {
    if (!confirm('Деактивировать стол? Существующие бронирования сохранятся.')) return

    setActionLoading(tableId)
    try {
      const res = await fetch(`/api/business/tables/${tableId}`, { method: 'DELETE' })
      if (res.ok) {
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, isActive: false } : t)),
        )
        toast.success('Стол деактивирован')
      } else {
        toast.error('Ошибка удаления')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setActionLoading(null)
    }
  }

  const activeTables = tables.filter((t) => t.isActive)
  const inactiveTables = tables.filter((t) => !t.isActive)

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Столы</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить стол
        </button>
      </div>

      {/* Place filter */}
      {places.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
          >
            <option value="">Все заведения</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add table form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новый стол</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {places.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заведение</label>
                <select
                  value={formPlaceId}
                  onChange={(e) => setFormPlaceId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                >
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Номер стола *
              </label>
              <input
                type="text"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder="1, A1, Терраса..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество мест *
              </label>
              <input
                type="number"
                value={formSeats}
                onChange={(e) => setFormSeats(Number(e.target.value))}
                min={1}
                max={50}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Зона</label>
              <select
                value={formZone}
                onChange={(e) => setFormZone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              >
                <option value="">Без зоны</option>
                <option value="main">Основной зал</option>
                <option value="terrace">Терраса</option>
                <option value="vip">VIP</option>
                <option value="bar">Бар</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={formSubmitting}
              className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Создать
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Tables list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">Столы не настроены</p>
          <p className="text-gray-400 text-xs">
            Добавьте столы, чтобы система автоматически распределяла бронирования
          </p>
        </div>
      ) : (
        <>
          {/* Active tables */}
          {activeTables.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Активные ({activeTables.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeTables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    onToggle={() => handleToggle(t.id, t.isActive)}
                    onDelete={() => handleDelete(t.id)}
                    loading={actionLoading === t.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive tables */}
          {inactiveTables.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Неактивные ({inactiveTables.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactiveTables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    onToggle={() => handleToggle(t.id, t.isActive)}
                    onDelete={() => handleDelete(t.id)}
                    loading={actionLoading === t.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TableCard({
  table: t,
  onToggle,
  onDelete,
  loading,
}: {
  table: TableItem
  onToggle: () => void
  onDelete: () => void
  loading: boolean
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        t.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900 text-lg">#{t.tableNumber}</p>
          {t.zone && (
            <p className="text-xs text-gray-400">
              {ZONE_LABELS[t.zone] || t.zone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggle}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title={t.isActive ? 'Деактивировать' : 'Активировать'}
          >
            {t.isActive ? (
              <ToggleRight className="w-5 h-5 text-green-500" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{t.seats} {t.seats === 1 ? 'место' : t.seats < 5 ? 'места' : 'мест'}</span>
        {t.todayReservations > 0 && (
          <span className="flex items-center gap-1 text-brand-600 font-medium">
            <CalendarDays className="w-3.5 h-3.5" />
            {t.todayReservations} сегодня
          </span>
        )}
      </div>

      {t.placeName && (
        <p className="text-xs text-gray-400 mt-1">{t.placeName}</p>
      )}
    </div>
  )
}
