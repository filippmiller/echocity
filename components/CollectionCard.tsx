'use client'

import Link from 'next/link'

interface CollectionCardProps {
  slug: string
  title: string
  description?: string | null
  coverUrl?: string | null
  itemCount: number
}

export function CollectionCard({ slug, title, description, coverUrl, itemCount }: CollectionCardProps) {
  return (
    <Link href={`/collections/${slug}`} className="block group">
      <div className="relative w-[240px] h-[160px] rounded-2xl overflow-hidden shrink-0 shadow-sm">
        {/* Cover image or gradient fallback */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-600 via-brand-700 to-blue-800" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
            {title}
          </h3>
          {description && (
            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{description}</p>
          )}
          <p className="text-white/60 text-xs mt-1">
            {itemCount} {itemCount === 1 ? 'место' : itemCount < 5 ? 'места' : 'мест'}
          </p>
        </div>
      </div>
    </Link>
  )
}
