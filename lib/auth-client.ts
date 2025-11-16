'use client'

import { useEffect, useState } from 'react'
import type { Role } from '@prisma/client'

export interface UserSession {
  userId: string
  email: string
  role: Role
  avatarUrl?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          return res.json()
        }
        return null
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return { user, loading }
}

