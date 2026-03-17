'use client'

import { AppHeader } from './AppHeader'
import { MobileNav } from './MobileNav'
import { PushPermissionBanner } from '@/components/PushPermissionBanner'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <PushPermissionBanner />
      <AppHeader />
      <main className="pb-safe md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
