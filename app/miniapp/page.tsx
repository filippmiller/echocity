'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { detectPlatform } from '@/modules/miniapp/platform'

interface Offer {
  id: string
  title: string
  subtitle: string | null
  benefitValue: number
  benefitType: string
  branch: { title: string }
  merchant: { name: string }
}

export default function MiniAppHome() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [platform, setPlatform] = useState<string>('web')
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())

    // Try to authenticate via mini app params
    const params = window.location.search
    if (params.includes('vk_app_id') || params.includes('max_token')) {
      const p = detectPlatform()
      const body = p === 'vk'
        ? { platform: 'vk', launchParams: params.slice(1) }
        : { platform: 'max', token: new URLSearchParams(params).get('max_token') || '' }

      fetch('/api/auth/miniapp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((r) => setAuthed(r.ok))
        .catch(() => {})
    }

    // Load offers
    fetch('/api/offers?limit=20')
      .then((r) => r.json())
      .then((d) => setOffers(d.offers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white z-40 px-4 py-3 border-b">
        <h1 className="text-lg font-bold">ГдеСейчас</h1>
        <p className="text-xs text-gray-400">Скидки рядом с вами</p>
      </header>

      <div className="p-4 space-y-3">
        {loading && <div className="text-center py-12 text-gray-400">Загрузка...</div>}
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/miniapp/offers/${offer.id}`}
            className="block bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-sm">{offer.title}</p>
                {offer.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{offer.subtitle}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {offer.branch?.title || offer.merchant?.name}
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-sm font-bold px-3 py-1 rounded-full flex-shrink-0">
                {offer.benefitType === 'PERCENT' ? `-${offer.benefitValue}%` : `${offer.benefitValue}₽`}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
