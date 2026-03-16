'use client'

import { useEffect, useState } from 'react'
import { OfferCard } from './OfferCard'
import { OfferCardSkeleton } from './ui/OfferCardSkeleton'
import Link from 'next/link'

export function HomeFeed() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/offers?limit=6')
      .then((r) => r.json())
      .then((data) => {
        setOffers(data.offers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <OfferCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">
        Пока нет активных предложений
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {offers.slice(0, 6).map((offer: any) => (
          <OfferCard
            key={offer.id}
            id={offer.id}
            title={offer.title}
            subtitle={offer.subtitle}
            offerType={offer.offerType}
            visibility={offer.visibility}
            benefitType={offer.benefitType}
            benefitValue={Number(offer.benefitValue)}
            imageUrl={offer.imageUrl}
            branchName={offer.branch?.title || ''}
            branchAddress={offer.branch?.address || ''}
            redemptionCount={offer.redemptionCount}
          />
        ))}
      </div>
      {offers.length > 6 && (
        <div className="text-center mt-4">
          <Link
            href="/offers"
            className="inline-block px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
          >
            Показать все скидки
          </Link>
        </div>
      )}
    </div>
  )
}
