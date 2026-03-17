'use client'

import { Heart } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch initial state
  useEffect(() => {
    let cancelled = false
    fetch(`/api/favorites/check?entityType=${entityType}&entityId=${entityId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setIsFavorited(data.isFavorited)
          setIsLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoaded(true)
      })
    return () => { cancelled = true }
  }, [entityType, entityId])

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isPending) return

    // Optimistic update
    const wasFavorited = isFavorited
    setIsFavorited(!wasFavorited)
    if (!wasFavorited) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 400)
    }

    startTransition(async () => {
      try {
        if (wasFavorited) {
          const res = await fetch(`/api/favorites/${entityType}/${entityId}`, {
            method: 'DELETE',
          })
          if (res.status === 401) {
            setIsFavorited(wasFavorited)
            router.push('/auth/login')
            return
          }
        } else {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entityType, entityId }),
          })
          if (res.status === 401) {
            setIsFavorited(wasFavorited)
            router.push('/auth/login')
            return
          }
          if (!res.ok) {
            setIsFavorited(wasFavorited)
          }
        }
      } catch {
        // Revert on error
        setIsFavorited(wasFavorited)
      }
    })
  }, [entityType, entityId, isFavorited, isPending, router])

  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFavorited ? 'Убрать из избранного' : 'Добавить в избранное'}
      className={`
        ${buttonSize} rounded-full flex items-center justify-center
        transition-all duration-200 ease-out
        ${isLoaded ? 'opacity-100' : 'opacity-0'}
        ${isAnimating ? 'scale-125' : 'scale-100'}
        hover:scale-110 active:scale-95
        bg-white/80 backdrop-blur-sm shadow-md
        ${className}
      `}
    >
      <Heart
        className={`
          ${iconSize} transition-all duration-200
          ${isFavorited
            ? 'fill-rose-500 text-rose-500 drop-shadow-sm'
            : 'fill-transparent text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]'
          }
        `}
        strokeWidth={isFavorited ? 2 : 2.5}
      />
    </button>
  )
}
