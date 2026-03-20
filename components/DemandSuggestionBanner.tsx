'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb, X } from 'lucide-react'

interface Suggestion {
  categoryName: string
  demandCount: number
  supportCount: number
  placeName: string
  placeId: string
  message: string
}

export function DemandSuggestionBanner() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/business/demand/suggestions')
      .then((r) => r.json())
      .then((data) => {
        if (data.suggestions) {
          setSuggestions(data.suggestions.slice(0, 2))
        }
      })
      .catch(() => {/* silently ignore — non-critical UI */})
      .finally(() => setLoading(false))
  }, [])

  const visible = suggestions.filter((s) => !dismissed.has(s.placeId + s.categoryName))

  if (loading || visible.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {visible.map((suggestion) => {
        const key = suggestion.placeId + suggestion.categoryName
        const hint = suggestion.categoryName.toLowerCase().replace(/\s+/g, '-')
        const href = `/business/offers/create?placeId=${suggestion.placeId}&hint=${encodeURIComponent(hint)}`

        return (
          <div
            key={key}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 shadow-sm"
          >
            {/* Dismiss button */}
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(key))}
              className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
              aria-label="Скрыть"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className="shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white text-sm leading-snug">
                  {suggestion.message}
                </p>
                <p className="text-white/80 text-xs mt-0.5">
                  Создайте предложение и привлеките новых клиентов
                </p>

                <Link
                  href={href}
                  className="inline-block mt-3 bg-white text-orange-600 font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-orange-50 transition-colors active:scale-[0.97]"
                >
                  Создать предложение
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
