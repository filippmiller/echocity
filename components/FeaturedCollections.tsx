'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { hapticTap } from '@/lib/haptics'

interface Collection {
  id: string
  slug: string
  title: string
  description: string | null
  emoji: string | null
  coverImageUrl: string | null
  items: Array<{ id: string }>
}

export function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/collections?limit=6')
      .then((r) => r.json())
      .then((data) => {
        setCollections(data.collections || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || collections.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <h2 className="text-base font-bold text-gray-900">Подборки</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.slug}`}
            onClick={hapticTap}
            className="flex-shrink-0 w-36 group"
          >
            <div className="w-36 h-20 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-100 border border-indigo-100 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all">
              {col.coverImageUrl ? (
                <img src={col.coverImageUrl} alt={col.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="text-3xl">{col.emoji || '🎁'}</span>
              )}
            </div>
            <p className="mt-1.5 text-xs font-medium text-gray-700 line-clamp-2 leading-tight">
              {col.title}
            </p>
            <p className="text-[10px] text-gray-400">{col.items.length} предложений</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
