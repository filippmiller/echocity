'use client'

import { Heart } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useFavorites } from '@/components/FavoritesProvider'

interface FavoriteButtonProps {
  entityType: 'PLACE' | 'OFFER'
  entityId: string
  className?: string
  size?: 'sm' | 'md'
}

export function FavoriteButton({
  entityType,
  entityId,
  className = '',
  size = 'sm',
}: FavoriteButtonProps) {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { ensureLoaded, isFavorited, isLoaded, toggleFavorite } = useFavorites()
  const loaded = isLoaded(entityType)
  const favorited = isFavorited(entityType, entityId)

  useEffect(() => {
    ensureLoaded(entityType).catch(() => {})
  }, [ensureLoaded, entityType])

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPending) return

    startTransition(async () => {
      try {
        const result = await toggleFavorite(entityType, entityId)
        if (result === 'guest') {
          router.push('/auth/login')
          return
        }
        if (result === 'added') {
          setIsAnimating(true)
          setTimeout(() => setIsAnimating(false), 400)
        }
      } catch {
        // Keep current visual state if background update fails.
      }
    })
  }, [entityType, entityId, isPending, router, toggleFavorite])

  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={favorited ? 'Убрать из избранного' : 'Добавить в избранное'}
      className={`
        ${buttonSize} rounded-full flex items-center justify-center
        transition-all duration-200 ease-out
        ${loaded ? 'opacity-100' : 'opacity-0'}
        ${isAnimating ? 'scale-125' : 'scale-100'}
        hover:scale-110 active:scale-95
        bg-white/80 backdrop-blur-sm shadow-md
        ${className}
      `}
    >
      <Heart
        className={`
          ${iconSize} transition-all duration-200
          ${favorited
            ? 'fill-rose-500 text-rose-500 drop-shadow-sm'
            : 'fill-transparent text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
          }
        `}
        strokeWidth={favorited ? 2 : 2.5}
      />
    </button>
  )
}
