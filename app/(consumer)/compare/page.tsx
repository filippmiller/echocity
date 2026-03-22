'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { CompareTable } from '@/components/OfferCompare'

function CompareContent() {
  const searchParams = useSearchParams()
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').filter(Boolean).slice(0, 3)

  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false)
      return
    }

    Promise.all(
      ids.map((id) =>
        fetch(`/api/offers/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      const valid = results
        .filter((r): r is any => r?.offer != null)
        .map((r) => {
          const o = r.offer
          return {
            id: o.id,
            title: o.title,
            benefitType: o.benefitType,
            benefitValue: Number(o.benefitValue),
            branchName: o.branch?.title ?? '',
            branchAddress: o.branch?.address ?? '',
            nearestMetro: o.branch?.nearestMetro ?? null,
            isVerified: o.merchant?.isVerified ?? false,
            redemptionCount: o.redemptionCount ?? 0,
            reviewCount: o.reviewCount ?? 0,
            imageUrl: o.imageUrl,
            expiresAt: o.endAt ?? null,
            visibility: o.visibility,
          }
        })
      setOffers(valid)
      setLoading(false)
    })
  }, [idsParam])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return <CompareTable offers={offers} />
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/offers" className="flex items-center gap-1 text-gray-500 text-sm mb-2">
            <ChevronLeft className="w-4 h-4" />
            К скидкам
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Сравнение предложений</h1>
          <p className="text-sm text-gray-500 mt-0.5">До 3 предложений рядом для удобного выбора</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
          <CompareContent />
        </Suspense>
      </div>
    </div>
  )
}
