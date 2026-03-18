'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type FavoriteEntityType = 'PLACE' | 'OFFER'
type AuthState = 'unknown' | 'guest' | 'authenticated'

interface FavoritesContextValue {
  ensureLoaded: (entityType: FavoriteEntityType) => Promise<void>
  isFavorited: (entityType: FavoriteEntityType, entityId: string) => boolean
  isLoaded: (entityType: FavoriteEntityType) => boolean
  toggleFavorite: (entityType: FavoriteEntityType, entityId: string) => Promise<'added' | 'removed' | 'guest'>
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function createEmptyFavorites() {
  return {
    PLACE: new Set<string>(),
    OFFER: new Set<string>(),
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState(createEmptyFavorites)
  const [loaded, setLoaded] = useState<Record<FavoriteEntityType, boolean>>({
    PLACE: false,
    OFFER: false,
  })
  const [authState, setAuthState] = useState<AuthState>('unknown')
  const loadingRef = useRef<Record<FavoriteEntityType, Promise<void> | null>>({
    PLACE: null,
    OFFER: null,
  })

  const ensureLoaded = useCallback(async (entityType: FavoriteEntityType) => {
    if (loaded[entityType] || authState === 'guest') {
      return
    }

    if (loadingRef.current[entityType]) {
      await loadingRef.current[entityType]
      return
    }

    const request = fetch(`/api/favorites?entityType=${entityType}&idsOnly=1&limit=500`)
      .then(async (res) => {
        if (res.status === 401) {
          setAuthState('guest')
          setLoaded({ PLACE: true, OFFER: true })
          return
        }

        if (!res.ok) {
          throw new Error('Failed to load favorites')
        }

        const data = await res.json() as { favoriteIds?: string[] }
        setAuthState('authenticated')
        setFavorites((prev) => ({
          ...prev,
          [entityType]: new Set(data.favoriteIds ?? []),
        }))
        setLoaded((prev) => ({ ...prev, [entityType]: true }))
      })
      .finally(() => {
        loadingRef.current[entityType] = null
      })

    loadingRef.current[entityType] = request
    await request
  }, [authState, loaded])

  const toggleFavorite = useCallback(async (entityType: FavoriteEntityType, entityId: string) => {
    await ensureLoaded(entityType)

    if (authState === 'guest') {
      return 'guest'
    }

    const currentlyFavorited = favorites[entityType].has(entityId)
    const method = currentlyFavorited ? 'DELETE' : 'POST'
    const url = currentlyFavorited
      ? `/api/favorites/${entityType}/${entityId}`
      : '/api/favorites'

    const res = await fetch(url, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify({ entityType, entityId }) : undefined,
    })

    if (res.status === 401) {
      setAuthState('guest')
      setLoaded({ PLACE: true, OFFER: true })
      return 'guest'
    }

    if (!res.ok) {
      throw new Error('Failed to update favorite')
    }

    setAuthState('authenticated')
    setFavorites((prev) => {
      const next = new Set(prev[entityType])
      if (currentlyFavorited) {
        next.delete(entityId)
      } else {
        next.add(entityId)
      }

      return {
        ...prev,
        [entityType]: next,
      }
    })

    return currentlyFavorited ? 'removed' : 'added'
  }, [authState, ensureLoaded, favorites])

  const value = useMemo<FavoritesContextValue>(() => ({
    ensureLoaded,
    isFavorited: (entityType, entityId) => favorites[entityType].has(entityId),
    isLoaded: (entityType) => loaded[entityType],
    toggleFavorite,
  }), [ensureLoaded, favorites, loaded, toggleFavorite])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider')
  }

  return context
}
