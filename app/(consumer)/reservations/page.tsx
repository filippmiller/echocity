'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-client'
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Users,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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
  place: { id: string; title: string; address: string; city: string }
  table: { tableNumber: string; zone: string | null; seats: number } | null
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Ожидает', className: 'bg-amber-50 text-amber-700' },
  CONFIRMED: { label: 'Подтверждено', className: 'bg-green-50 text-green-700' },
  CANCELED: { label: 'Отменено', className: 'bg-red-50 text-red-600' },
  NO_SHOW: { label: 'Не пришёл', className: 'bg-gray-100 text-gray-500' },
  COMPLETED: { label: 'Завершено', className: 'bg-blue-50 text-blue-600' },
}

const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

function formatDate(isoStr: string): string {
  const d = new Date(isoStr)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function isUpcoming(dateStr: string, timeSlot: string): boolean {
  const now = new Date()
  const d = new Date(dateStr)
  const [h, m] = timeSlot.split(':').map(Number)
  d.setHours(h, m || 0, 0, 0)
  return d > now
}

export default function ReservationsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [reservations, setReservations] = useState<ReservationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    fetch('/api/reservations')
      .then((r) => r.json())
      .then((data) => {
        setReservations(data.reservations || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [user, authLoading])

  const handleCancel = async (id: string) => {
    if (!confirm('Отменить бронирование?')) return

    setCancelingId(id)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'CANCELED' } : r)),
        )
        toast.success('Бронирование отменено')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка отмены')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setCancelingId(null)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Войдите для просмотра</h2>
        <p className="text-gray-500 mb-6">Авторизуйтесь, чтобы увидеть свои бронирования</p>
        <Link
          href="/auth/login?redirect=/reservations"
          className="inline-block px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold"
        >
          Войти
        </Link>
      </div>
    )
  }

  const upcoming = reservations.filter(
    (r) => ['PENDING', 'CONFIRMED'].includes(r.status) && isUpcoming(r.date, r.timeSlot),
  )
  const past = reservations.filter(
    (r) => !(['PENDING', 'CONFIRMED'].includes(r.status) && isUpcoming(r.date, r.timeSlot)),
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои бронирования</h1>

        {reservations.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Нет бронирований</h2>
            <p className="text-gray-500 text-sm mb-6">
              Вы ещё не забронировали ни одного стола
            </p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium"
            >
              Найти заведение
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Предстоящие
                </h2>
                <div className="space-y-3">
                  {upcoming.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      onCancel={() => handleCancel(r.id)}
                      canceling={cancelingId === r.id}
                      showCancel
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Прошедшие
                </h2>
                <div className="space-y-3">
                  {past.map((r) => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      showCancel={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ReservationCard({
  reservation: r,
  onCancel,
  canceling,
  showCancel,
}: {
  reservation: ReservationItem
  onCancel?: () => void
  canceling?: boolean
  showCancel: boolean
}) {
  const statusInfo = STATUS_MAP[r.status] || { label: r.status, className: 'bg-gray-100 text-gray-600' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <Link href={`/places/${r.place.id}`} className="hover:underline">
          <p className="font-semibold text-gray-900">{r.place.title}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {r.place.address}
          </p>
        </Link>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(r.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {r.timeSlot}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          {r.partySize}
        </span>
      </div>

      {r.table && (
        <p className="text-xs text-gray-400 mt-2">
          Стол {r.table.tableNumber}{r.table.zone ? ` (${r.table.zone})` : ''}
        </p>
      )}

      {r.note && (
        <p className="text-xs text-gray-400 mt-1 italic">{r.note}</p>
      )}

      {r.cancelReason && (
        <p className="text-xs text-red-400 mt-1">Причина отмены: {r.cancelReason}</p>
      )}

      {showCancel && ['PENDING', 'CONFIRMED'].includes(r.status) && (
        <button
          onClick={onCancel}
          disabled={canceling}
          className="mt-3 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          {canceling ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Отменить
        </button>
      )}
    </div>
  )
}
