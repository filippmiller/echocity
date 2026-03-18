'use client'

import { FavoritesProvider } from '@/components/FavoritesProvider'
import { OnboardingFlow } from '@/components/OnboardingFlow'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      {children}
      <OnboardingFlow />
    </FavoritesProvider>
  )
}
