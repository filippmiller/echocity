'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ReviewPromptBannerProps {
  offerId: string
  redemptionId: string
}

export default function ReviewPromptBanner({ offerId, redemptionId }: ReviewPromptBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-amber-900 text-sm">
            Оставьте отзыв — получите монеты!
          </p>
          <p className="text-amber-700 text-xs mt-1">
            Текстовый отзыв — 10 монет, с фото — 25 монет
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 ml-2 text-lg leading-none"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
      <Link
        href={`/offers/${offerId}/review?redemptionId=${redemptionId}`}
        className="mt-3 inline-block bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Написать отзыв
      </Link>
    </div>
  )
}
