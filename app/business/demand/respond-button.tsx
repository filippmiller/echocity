'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RespondButtonProps {
  demandRequestId: string
  offers: { id: string; title: string }[]
}

export function RespondButton({ demandRequestId, offers }: RespondButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedOfferId, setSelectedOfferId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() && !selectedOfferId) {
      setError('Введите сообщение или выберите предложение')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/business/demand/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandRequestId,
          message: message.trim() || undefined,
          offerId: selectedOfferId || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Не удалось отправить ответ')
        return
      }

      setIsOpen(false)
      setMessage('')
      setSelectedOfferId('')
      router.refresh()
    } catch {
      setError('Ошибка сети. Попробуйте снова.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-deal-savings text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Ответить
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div>
        <label htmlFor={`msg-${demandRequestId}`} className="block text-sm font-medium text-gray-700 mb-1">
          Сообщение клиенту
        </label>
        <textarea
          id={`msg-${demandRequestId}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Напишите ответ на запрос..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
        />
      </div>

      {offers.length > 0 && (
        <div>
          <label htmlFor={`offer-${demandRequestId}`} className="block text-sm font-medium text-gray-700 mb-1">
            Привязать предложение (необязательно)
          </label>
          <select
            id={`offer-${demandRequestId}`}
            value={selectedOfferId}
            onChange={(e) => setSelectedOfferId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          >
            <option value="">Без привязки</option>
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-deal-savings text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setError('')
            setMessage('')
            setSelectedOfferId('')
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}
