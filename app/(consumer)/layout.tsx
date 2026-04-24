import { SavingsMilestoneCelebration } from '@/components/SavingsMilestoneCelebration'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { PushPermissionBanner } from '@/components/PushPermissionBanner'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary scope="consumer">
      <PushPermissionBanner />
      <OfflineIndicator />
      {children}
      <Footer />
      <SavingsMilestoneCelebration />
      <PWAInstallPrompt />
    </ErrorBoundary>
  )
}
