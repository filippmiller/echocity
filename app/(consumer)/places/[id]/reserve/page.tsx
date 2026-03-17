'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-client'
import Link from 'next/link'
import {
  ChevronLeft,
  CalendarDays,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  MapPin,
} from 'lucide-react'

interface SlotInfo {
  time: string
  available: boolean
  tablesLeft: number
}

interface ReservationResult {
  id: string
  guestName: string
  timeSlot: string
  date: string
  partySize: number
  status: string
  place: { id: string; title: string; address: string }
  table: { tableNumber: string; zone: string | null; seats: number } | null
}

export default function ReservePage() {
  const { id: placeId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // State
  const [placeName, setPlaceName] = useState('')
  const [placeAddress, setPlaceAddress] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [slots, setSlots] = useState<SlotInfo[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [note, setNote] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ReservationResult | null>(null)

  // Generate next 14 days
  const dates: { value: string; label: string }[] = []
  const today = new Date()
  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const value = `${y}-${m}-${day}`
    const label = i === 0
      ? 'Сегодня'
      : i === 1
        ? 'Завтра'
        : `${weekDays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
    dates.push({ value, label })
  }

  // Set default date
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0].value)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch place name
  useEffect(() => {
    fetch(`/api/places/${placeId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.place) {
          setPlaceName(data.place.title || data.place.publicName || '')
          setPlaceAddress(data.place.address || '')
        }
      })
      .catch(() => {})
  }, [placeId])

  // Pre-fill guest name from user
  useEffect(() => {
    if (user && !guestName) {
      fetch('/api/user/stats')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.firstName) {
            setGuestName(`${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`)
          }
        })
        .catch(() => {})
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch slots when date or party size changes
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSelectedSlot('')
    setError('')

    fetch(`/api/reservations/slots?placeId=${placeId}&date=${selectedDate}&partySize=${partySize}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || [])
        setLoadingSlots(false)
      })
      .catch(() => {
        setSlots([])
        setLoadingSlots(false)
      })
  }, [placeId, selectedDate, partySize])

  // Submit
  const handleSubmit = async () => {
    if (!selectedSlot || !guestName.trim()) {
      setError('Выберите время и укажите имя')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          date: selectedDate,
          timeSlot: selectedSlot,
          partySize,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка бронирования')
        setSubmitting(false)
        return
      }

      setResult(data.reservation)
    } catch {
      setError('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  // Auth check
  if (!authLoading && !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Войдите для бронирования</h2>
        <p className="text-gray-500 mb-6">Чтобы забронировать стол, необходимо авторизоваться</p>
        <Link
          href={`/auth/login?redirect=/places/${placeId}/reserve`}
          className="inline-block px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
        >
          Войти
        </Link>
      </div>
    )
  }

  // Success screen
  if (result) {
    const dateObj = new Date(result.date)
    const dateLabel = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Бронирование создано!</h1>
          <p className="text-gray-500 mb-6">
            Ожидайте подтверждения от заведения
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{result.place.title}</p>
              <p className="text-sm text-gray-500">{result.place.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-gray-900">{dateLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-gray-900">{result.timeSlot}</span>
          </div>

          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="text-gray-900">{result.partySize} {result.partySize === 1 ? 'гость' : result.partySize < 5 ? 'гостя' : 'гостей'}</span>
          </div>

          {result.table && (
            <div className="text-sm text-gray-500">
              Стол: {result.table.tableNumber}
              {result.table.zone ? ` (${result.table.zone})` : ''}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
              Ожидает подтверждения
            </span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/reservations"
            className="flex-1 text-center py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Мои бронирования
          </Link>
          <button
            onClick={() => router.push(`/places/${placeId}`)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            К заведению
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Забронировать стол</h1>
      {placeName && (
        <p className="text-gray-500 mb-6">{placeName}</p>
      )}

      {/* Date Picker */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <CalendarDays className="w-4 h-4 inline mr-1.5" />
          Дата
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDate === d.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Party Size */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Users className="w-4 h-4 inline mr-1.5" />
          Количество гостей
        </label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setPartySize(n)}
              className={`w-11 h-11 rounded-xl text-sm font-medium transition-colors ${
                partySize === n
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1.5" />
          Время
        </label>

        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">Нет доступных слотов на выбранную дату</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && setSelectedSlot(slot.time)}
                disabled={!slot.available}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  !slot.available
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : selectedSlot === slot.time
                      ? 'bg-brand-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guest Info */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Имя гостя *
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Иван Иванов"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Телефон
          </label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Пожелания
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Столик у окна, детский стульчик..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 md:static md:border-0 md:p-0 z-40">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot || !guestName.trim()}
            className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Бронирование...
              </>
            ) : (
              'Забронировать'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
