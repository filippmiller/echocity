'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface OfferDetail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  benefitValue: number
  benefitType: string
  termsText: string | null
  imageUrl: string | null
  branch: { title: string; address: string }
  merchant: { name: string }
}

export default function MiniAppOfferDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/offers/${id}`)
      .then((r) => r.json())
      .then((d) => setOffer(d.offer || d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-12 text-gray-400">Загрузка...</div>
  if (!offer) return <div className="text-center py-12 text-gray-500">Предложение не найдено</div>

  return (
    <div className="pb-20">
      <header className="sticky top-0 bg-white z-40 px-4 py-3 border-b flex items-center gap-3">
        <Link href="/miniapp" className="text-blue-500 text-sm">&larr; Назад</Link>
        <h1 className="text-lg font-bold truncate">{offer.title}</h1>
      </header>

      {offer.imageUrl && (
        <img src={offer.imageUrl} alt={offer.title} className="w-full h-48 object-cover" />
      )}

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="bg-emerald-100 text-emerald-700 text-lg font-bold px-4 py-2 rounded-full">
            {offer.benefitType === 'PERCENT' ? `-${offer.benefitValue}%` : `${offer.benefitValue}₽`}
          </span>
        </div>

        <div>
          <h2 className="font-bold text-xl">{offer.title}</h2>
          {offer.subtitle && <p className="text-gray-500 mt-1">{offer.subtitle}</p>}
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium">{offer.branch.title}</p>
          <p className="text-gray-400">{offer.branch.address}</p>
        </div>

        {offer.description && (
          <p className="text-sm text-gray-600">{offer.description}</p>
        )}

        {offer.termsText && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Условия</p>
            <p className="text-xs text-gray-600">{offer.termsText}</p>
          </div>
        )}

        <Link
          href={`/miniapp/offers/${id}/redeem`}
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center font-bold py-3 rounded-xl transition-colors"
        >
          Активировать
        </Link>
      </div>
    </div>
  )
}
