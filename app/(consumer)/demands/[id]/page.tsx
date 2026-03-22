'use client'

import { useParams } from 'next/navigation'
import { DemandBids } from '@/components/DemandBids'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function DemandDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Link
        href="/demands"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Все запросы
      </Link>

      <DemandBids demandId={id} />
    </div>
  )
}
