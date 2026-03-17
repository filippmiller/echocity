'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Users,
  XCircle,
  UserX,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface PlaceOption {
  id: string
  title: string
}

interface ReservationItem {
  id: string
  placeId: string
  guestName: string
  guestPhone: string | null
  partySize: number
  date: string
  timeSlot: string
  durationMin: number
  status: string
  note: string | null
  cancelReason: string | null
  createdAt: string
  table: { id: string; tableNumber: string; zone: string | null; seats: number } | null
  user: { email: string; firstName: string; phone: string | null }
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Ожидает', className: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Подтверждено', className: 'bg-green-50 text-green-700' },
  CANCELED: { label: 'Отменено', className: 'bg-red-50 text-red-600' },
  NO_SHOW: { label: 'Не пришёл', className: 'bg-gray-100 text-gray-500' },
  COMPLETED: { label: 'Завершено', className: 'bg-blue-50 text-blue-600' },
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = todayStr()
  if (dateStr === today) return 'Сегодня'
  const tomorrow = shiftDate(today, 1)
  if (dateStr === tomorrow) return 'Завтра'
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export default function ReservationsManagePage() {
  const [date, setDate] = useState(todayStr())
  const [placeId, setPlaceId] = useState<string>('')
  const [places, setPlaces] = useState<PlaceOption[]>([])
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = (d: string, pid: string) => {
    setLoading(true)
    const params = new URLSearchParams({ date: d })
    if (pid) params.set('placeId', pid)

    fetch(`/api/business/reservations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setReservations(data.reservations || [])
        if (data.places && places.length === 0) {
          setPlaces(data.places)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData(date, placeId)
  }, [date, placeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (
    reservationId: string,
    action: 'confirm' | 'cancel' | 'complete' | 'no_show',
  ) => {
    setActionLoading(reservationId)
    try {
      const res = await fetch(`/api/business/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        const data = await res.json()
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId
              ? { ...r, status: data.reservation.status }
              : r,
          ),
        )
        const labels: Record<string, string> = {
          confirm: 'Подтверждено',
          cancel: 'Отменено',
          complete: 'Завершено',
          no_show: 'Отмечен неявкой',
        }
        toast.success(labels[action] || 'Обновлено')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setActionLoading(null)
    }
  }

  // Stats
  const total = reservations.length
  const confirmed = reservations.filter((r) => r.status === 'CONFIRMED').length
  const pending = reservations.filter((r) => r.status === 'PENDING').length
  const totalGuests = reservations
    .filter((r) => ['PENDING', 'CONFIRMED'].includes(r.status))
    .reduce((sum, r) => sum + r.partySize, 0)

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Бронирования</h1>

      {/* Date navigation + Place filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 min-w-[160px] justify-center">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{formatDateLabel(date)}</span>
          </div>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {date !== todayStr() && (
            <button
              onClick={() => setDate(todayStr())}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Сегодня
            </button>
          )}
        </div>

        {places.length > 1 && (
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
          >
            <option value="">Все заведения</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Всего</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{confirmed}</p>
          <p className="text-xs text-gray-500">Подтверждено</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs text-gray-500">Ожидает</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-brand-600">{totalGuests}</p>
          <p className="text-xs text-gray-500">Гостей</p>
        </div>
      </div>

      {/* Reservations list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Нет бронирований на эту дату</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const statusInfo = STATUS_MAP[r.status] || { label: r.status, className: 'bg-gray-100 text-gray-600' }
            const isActionable = ['PENDING', 'CONFIRMED'].includes(r.status)
            const isLoading = actionLoading === r.id

            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{r.guestName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {r.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {r.partySize}
                      </span>
                      {r.table && (
                        <span className="text-xs text-gray-400">
                          Стол {r.table.tableNumber}
                          {r.table.zone ? ` (${r.table.zone})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {r.guestPhone && (
                  <p className="text-xs text-gray-400 mb-1">Тел: {r.guestPhone}</p>
                )}
                {r.user.email && (
                  <p className="text-xs text-gray-400 mb-1">{r.user.email}</p>
                )}
                {r.note && (
                  <p className="text-xs text-gray-400 italic mb-2">Пожелания: {r.note}</p>
                )}

                {/* Actions */}
                {isActionable && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    {r.status === 'PENDING' && (
                      <button
                        onClick={() => handleAction(r.id, 'confirm')}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Подтвердить
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(r.id, 'complete')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Завершить
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'no_show')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Неявка
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'cancel')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Отменить
                    </button>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
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
